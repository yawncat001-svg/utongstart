import type { APIRoute } from 'astro';
import { getDB, insertNewsletterSubscriber, type NewNewsletterSubscriber } from '../../lib/db/client';
import { validateEmail, sanitizeInput } from '../../lib/utils/validateForm';
import { sendWelcomeEmail } from '../../lib/email/sendNotification';
import { saveToGoogleSheets } from '../../lib/utils/googleSheets';
import { eq } from 'drizzle-orm';
import * as schema from '../../lib/db/schema';

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

    // 2. 환경 확인
    const env = locals?.runtime?.env || {};
    const db = env?.D1_DATABASE ? getDB(env) : null;

    if (db) {
      try {
        const existing = await db.select().from(schema.newsletterSubscribers).where(eq(schema.newsletterSubscribers.email, email)).get();
        if (existing) {
          if (existing.isActive === 1) {
            return new Response(
              JSON.stringify({ success: false, message: '이미 구독된 이메일 주소입니다.' }),
              { status: 409, headers: { 'Content-Type': 'application/json' } }
            );
          }
          await db.update(schema.newsletterSubscribers).set({ isActive: 1, name: name || existing.name }).where(eq(schema.newsletterSubscribers.email, email)).run();
        } else {
          await insertNewsletterSubscriber(db, { email, name, isActive: 1 });
        }
      } catch (e) {
        console.error('Newsletter DB Error:', e);
      }
    }

    // 4. 후속 작업 (환영 메일 발송, 구글 시트 저장)
    // 인스턴스 종료 전 모든 비동기 작업의 완료를 기다림으로써 네트워크 연결 끊김 방지
    await Promise.allSettled([
      sendWelcomeEmail(email, name || undefined, env),
      saveToGoogleSheets('newsletter', { email, name }, env)
    ]);

    // 5. 성공 응답 반환
    return new Response(
      JSON.stringify({
        success: true,
        message: '뉴스레터 구독이 완료되었습니다.'
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
