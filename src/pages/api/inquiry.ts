import type { APIRoute } from 'astro';
import { getDB, insertInquiry, type NewInquiry } from '../../lib/db/client';
import { validateInquiry, sanitizeInput } from '../../lib/utils/validateForm';
import { sendInquiryNotification } from '../../lib/email/sendNotification';
import { saveToGoogleSheets } from '../../lib/utils/googleSheets';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = (await request.json()) as Record<string, string>;

    // 1. 입력값 새니타이즈
    const sanitizedData: Record<string, string> = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key, typeof value === 'string' ? sanitizeInput(value) : String(value)
      ])
    );

    // 2. 서버 사이드 유효성 검사
    const { valid, errors } = validateInquiry(sanitizedData);
    if (!valid) {
      return new Response(
        JSON.stringify({ success: false, errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. DB에 데이터 저장
    const newInquiry: NewInquiry = {
      name: sanitizedData.name || '',
      company: sanitizedData.company || '',
      phone: sanitizedData.phone || '',
      email: sanitizedData.email || null,
      serviceType: sanitizedData.serviceType || '',
      productCategory: sanitizedData.productCategory || null,
      budgetRange: sanitizedData.budgetRange || null,
      message: sanitizedData.message || null,
      referralSource: sanitizedData.referralSource || null,
      status: 'new',
    };

    let result = { ...newInquiry, id: Date.now() } as any;

    try {
      if (locals?.runtime?.env?.D1_DATABASE) {
        const db = getDB(locals.runtime.env);
        result = await insertInquiry(db, newInquiry);
      }
    } catch (error) {
      console.error('DB Insert Error:', error);
    }

    // 4. 후속 작업 (구글 시트 저장 -> 메일 발송 순서로 진행)
    const env = (locals?.runtime?.env || {}) as any;
    const toEmail = env.NOTIFICATION_EMAIL || 'utongstart@naver.com';

    // 결과 메시지 조립용 변수
    let statusMessage = '상담 신청이 완료되었습니다.';

    // 1순위: 구글 시트 저장
    const sheetResult = await saveToGoogleSheets('inquiry', result, env);
    if (sheetResult) {
      statusMessage += ' 서버에 저장완료하였습니다.';
    }

    // 2순위: 이메일 알림 발송
    const emailResult = await sendInquiryNotification(result, env);
    if (emailResult) {
      statusMessage += ` ${toEmail}로 이메일 발송완료.`;
    }

    // 5. 성공 응답 반환
    return new Response(
      JSON.stringify({
        success: true,
        id: result.id,
        message: statusMessage
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API Error (inquiry):', error);
    return new Response(
      JSON.stringify({ success: false, message: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Astro 런타임 타입 정의
declare namespace App {
  interface Locals {
    runtime: {
      env: {
        D1_DATABASE: D1Database;
        NOTIFICATION_EMAIL: string;
        RESEND_API_KEY: string;
        GOOGLE_SHEET_API_URL: string;
      };
    };
  }
}