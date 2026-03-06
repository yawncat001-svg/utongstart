import type { APIRoute } from 'astro';
export const prerender = false;
import { validateInquiry, sanitizeInput } from '../../lib/utils/validateForm';
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

    // 3. 데이터 정리
    const inquiryData = {
      id: Date.now(),
      name: sanitizedData.name || '',
      company: sanitizedData.company || '',
      phone: sanitizedData.phone || '',
      email: sanitizedData.email || '',
      serviceType: sanitizedData.serviceType || '',
      message: sanitizedData.message || '',
      timestamp: new Date().toISOString(),
    };

    // 4. 구글 시트 저장 - 응답을 기다리지 않고 백그라운드로 실행
    // ctx.waitUntil이 있으면 사용, 없으면 그냥 fire-and-forget
    const runtime = (locals as any)?.runtime || {};
    const env = runtime.env || {};
    const ctx = runtime.ctx || {};
    const sheetPromise = saveToGoogleSheets('inquiry', inquiryData, env);

    if (ctx?.waitUntil) {
      ctx.waitUntil(sheetPromise);
    }
    // waitUntil 없어도 Promise는 계속 실행됨 (fire-and-forget)

    // 5. 구글 시트 업로드를 기다리지 않고 즉시 성공 응답 반환
    return new Response(
      JSON.stringify({
        success: true,
        message: '상담 신청이 완료되었습니다! 서버에 저장 중입니다.'
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