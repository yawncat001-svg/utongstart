import type { APIRoute } from 'astro';
import { getDB, insertInquiry, NewInquiry } from '../../lib/db/client';
import { validateInquiry, sanitizeInput } from '../../lib/utils/validateForm';
import { sendInquiryNotification } from '../../lib/email/sendNotification';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.json();

    // 1. 입력값 새니타이즈
    const sanitizedData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key, typeof value === 'string' ? sanitizeInput(value) : value
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

    const db = getDB(locals.runtime.env);

    // 3. DB에 데이터 저장
    const newInquiry: NewInquiry = {
      name: sanitizedData.name,
      company: sanitizedData.company,
      phone: sanitizedData.phone,
      email: sanitizedData.email || null,
      serviceType: sanitizedData.serviceType,
      productCategory: sanitizedData.productCategory || null,
      budgetRange: sanitizedData.budgetRange || null,
      message: sanitizedData.message || null,
      referralSource: sanitizedData.referralSource || null,
      status: 'new',
    };
    const result = await insertInquiry(db, newInquiry);

    // 4. 관리자에게 이메일 알림 발송 (비동기로 처리하여 응답 지연 방지)
    sendInquiryNotification(result, locals.runtime.env).catch(console.error);

    // 5. 성공 응답 반환
    return new Response(
      JSON.stringify({ 
        success: true, 
        id: result.id,
        message: '상담 신청이 성공적으로 접수되었습니다.'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API Error (inquiry):', error);
    return new Response(
      JSON.stringify({ success: false, message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Astro 런타임에 D1 바인딩 타입 추가
declare namespace App {
  interface Locals {
    runtime: {
      env: {
        D1_DATABASE: D1Database;
        NOTIFICATION_EMAIL: string; 
        RESEND_API_KEY: string; 
      };
    };
  }
}