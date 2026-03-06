import type { APIRoute } from 'astro';
import { getDB, insertInquiry, type NewInquiry } from '../../lib/db/client';
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

    // 3. 데이터 객체 생성 (DB 저장용)
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

    // 4. DB 저장 시도 (옵션)
    try {
      if (locals?.runtime?.env?.D1_DATABASE) {
        const db = getDB(locals.runtime.env);
        result = await insertInquiry(db, newInquiry).catch(() => result);
      }
    } catch (e) {
      console.error('DB Error:', e);
    }

    // 5. 구글 시트 저장 (메인 작업)
    const env = (locals?.runtime?.env || {}) as any;
    const sheetResult = await saveToGoogleSheets('inquiry', result, env);

    // 6. 성공 응답 반환 (이메일 발송은 중지됨)
    return new Response(
      JSON.stringify({
        success: true,
        message: sheetResult ? '상담 신청 완료! 서버에 저장완료하였습니다.' : '상담 신청이 완료되었습니다.'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API Error (inquiry):', error);
    return new Response(
      JSON.stringify({ success: false, message: '서버 오류가 발생했습니다. 다시 시도해 주세요.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};