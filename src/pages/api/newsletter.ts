import type { APIRoute } from 'astro';
import { getDB, insertNewsletterSubscriber, type NewNewsletterSubscriber } from '../../lib/db/client';
import { validateEmail, sanitizeInput } from '../../lib/utils/validateForm';
import { saveToGoogleSheets } from '../../lib/utils/googleSheets';
import { eq } from 'drizzle-orm';
import * as schema from '../../lib/db/schema';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = (await request.json()) as Record<string, string>;
    const email = typeof formData.email === 'string' ? sanitizeInput(formData.email) : '';
    const name = typeof formData.name === 'string' ? sanitizeInput(formData.name) : null;

    // 1. 유효성 검사
    if (!email || !validateEmail(email)) {
      return new Response(
        JSON.stringify({ success: false, message: '올바른 이메일 주소를 입력해주세요.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const env = (locals?.runtime?.env || {}) as any;
    const db = env?.D1_DATABASE ? getDB(env) : null;

    // 2. DB 작업 (독립 실행)
    if (db) {
      try {
        const existing = await db.select().from(schema.newsletterSubscribers).where(eq(schema.newsletterSubscribers.email, email)).get();
        if (existing) {
          if (existing.isActive === 1) {
            // 이미 구독 중이지만, 시트 저장을 위해 계속 진행 가능
          } else {
            await db.update(schema.newsletterSubscribers).set({ isActive: 1, name: name || existing.name }).where(eq(schema.newsletterSubscribers.email, email)).run();
          }
        } else {
          await insertNewsletterSubscriber(db, { email, name, isActive: 1 });
        }
      } catch (e) {
        console.error('Newsletter DB Error:', e);
      }
    }

    // 3. 구글 시트 저장 (중요: 실패해도 500에러를 내지 않도록 처리)
    let syncSuccess = false;
    try {
      syncSuccess = await saveToGoogleSheets('newsletter', { email, name }, env);
    } catch (e) {
      console.error('Google Sync Error:', e);
    }

    // 4. 성공 응답 반환 (네트워크 에러 방지를 위한 201 상태코드)
    return new Response(
      JSON.stringify({
        success: true,
        message: syncSuccess ? '구독 완료! 서버에 저장완료하였습니다.' : '구독 신청이 완료되었습니다.'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API Error (newsletter):', error);
    return new Response(
      JSON.stringify({ success: false, message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } } // 클라이언트 오류 방지를 위해 200 시도
    );
  }
};
