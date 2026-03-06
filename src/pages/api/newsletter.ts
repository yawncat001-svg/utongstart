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

    // 4. 후속 작업 (구글 시트 저장 -> 환영 메일 발송 순서로 진행)
    let statusMessage = '뉴스레터 구독이 완료되었습니다.';

    // 1순위: 구글 시트 저장
    const sheetResult = await saveToGoogleSheets('newsletter', { email, name }, env);
    if (sheetResult) {
      statusMessage += ' 서버에 저장완료하였습니다.';
    }

    // 2순위: 환영 이메일 발송
    const emailResult = await sendWelcomeEmail(email, name || undefined, env);
    if (emailResult) {
      statusMessage += ` ${email}로 발송완료.`;
    }

    // 5. 성공 응답 반환
    return new Response(
      JSON.stringify({
        success: true,
        message: statusMessage
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
