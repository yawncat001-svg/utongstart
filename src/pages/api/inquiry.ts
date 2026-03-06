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

    // 4. 후속 작업 (메일 발송, 구글 시트 저장)
    const env = locals?.runtime?.env || {};

    // 이메일과 구글 시트 저장을 동시에 실행하되, 완료를 기다려 네트워크 오류 방지
    await Promise.allSettled([
      sendInquiryNotification(result, env),
      saveToGoogleSheets('inquiry', result, env)
    ]);

    // 5. 성공 응답 반환
    return new Response(
      JSON.stringify({
        success: true,
        id: result.id,
        message: '상담 신청이 완료되었습니다.'
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