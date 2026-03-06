import type { APIRoute } from 'astro';
import { validateEmail, sanitizeInput } from '../../lib/utils/validateForm';
import { saveToGoogleSheets } from '../../lib/utils/googleSheets';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = (await request.json()) as Record<string, string>;
    const email = typeof formData.email === 'string' ? sanitizeInput(formData.email) : '';
    const name = typeof formData.name === 'string' ? sanitizeInput(formData.name) : null;

    // 1. 이메일 유효성 검사
    if (!email || !validateEmail(email)) {
      return new Response(
        JSON.stringify({ success: false, message: '올바른 이메일 주소를 입력해주세요.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. 구글 시트 저장 - 백그라운드로 실행 (응답을 기다리지 않음)
    const env = (locals?.runtime?.env || {}) as any;
    const ctx = (locals?.runtime?.ctx) as any;
    const sheetPromise = saveToGoogleSheets('newsletter', { email, name }, env);

    if (ctx?.waitUntil) {
      ctx.waitUntil(sheetPromise);
    }

    // 3. 즉시 성공 응답 반환 (구글 시트 완료 기다리지 않음)
    return new Response(
      JSON.stringify({
        success: true,
        message: '구독 신청이 완료되었습니다! 서버에 저장 중입니다.'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API Error (newsletter):', error);
    return new Response(
      JSON.stringify({ success: false, message: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
