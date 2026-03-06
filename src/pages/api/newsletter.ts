import type { APIRoute } from 'astro';
import { getDB, insertNewsletterSubscriber, type NewNewsletterSubscriber } from '../../lib/db/client';
import { validateEmail, sanitizeInput } from '../../lib/utils/validateForm';
import { sendWelcomeEmail } from '../../lib/email/sendNotification';
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

    // 2. DB 및 Cloudflare 환경 확인
    let existingSubscriber = null;
    const env = locals?.runtime?.env || {};
    const db = env?.D1_DATABASE ? getDB(env) : null;

    if (db) {
      existingSubscriber = await db.select().from(schema.newsletterSubscribers).where(eq(schema.newsletterSubscribers.email, email)).get();
      if (existingSubscriber) {
        if (existingSubscriber.isActive === 1) {
          return new Response(
            JSON.stringify({ success: false, message: '이미 구독된 이메일 주소입니다.' }),
            { status: 409, headers: { 'Content-Type': 'application/json' } }
          );
        } else {
          // 비활성 상태라면 다시 활성화
          await db.update(schema.newsletterSubscribers).set({ isActive: 1, name: name || existingSubscriber.name, createdAt: new Date().toISOString() }).where(eq(schema.newsletterSubscribers.email, email)).run();
        }
      }
    }

    // 3. DB에 데이터 저장 (DB가 있는 경우에만)
    if (db && !existingSubscriber) {
      const newSubscriber: NewNewsletterSubscriber = {
        email,
        name,
        isActive: 1,
      };
      await insertNewsletterSubscriber(db, newSubscriber);
    } else if (!db) {
      console.warn('D1_DATABASE not found. Subscription info logged to console.');
      console.log('Newsletter Subscription:', { email, name });
    }

    // 4. 환영 이메일 발송 및 구글 시트 저장
    sendWelcomeEmail(email, name || undefined, env).catch(console.error);

    // 구글 시트 저장 (비동기)
    import('../../lib/utils/googleSheets').then(({ saveToGoogleSheets }) => {
      saveToGoogleSheets('newsletter', { email, name }, env).catch(console.error);
    });

    // 5. 성공 응답 반환
    return new Response(
      JSON.stringify({
        success: true,
        message: '뉴스레터 구독이 완료되었습니다. 환영 이메일을 확인해주세요!'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('API Error (newsletter):', error);
    return new Response(
      JSON.stringify({ success: false, message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
