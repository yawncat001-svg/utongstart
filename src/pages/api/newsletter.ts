import type { APIRoute } from 'astro';
import { getDB, insertNewsletterSubscriber, type NewNewsletterSubscriber } from '../../lib/db/client';
import { validateEmail, sanitizeInput } from '../../lib/utils/validateForm';
import { sendWelcomeEmail } from '../../lib/email/sendNotification';
import { eq } from 'drizzle-orm';
import * as schema from '../../lib/db/schema';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.json();
    const email = typeof formData.email === 'string' ? sanitizeInput(formData.email) : '';
    const name = typeof formData.name === 'string' ? sanitizeInput(formData.name) : null;

    // 1. 이메일 유효성 검사
    if (!email || !validateEmail(email)) {
      return new Response(
        JSON.stringify({ success: false, message: '올바른 이메일 주소를 입력해주세요.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = getDB(locals.runtime.env);

    // 2. 이메일 중복 확인
    const existingSubscriber = await db.select().from(schema.newsletterSubscribers).where(eq(schema.newsletterSubscribers.email, email)).get();
    if (existingSubscriber) {
      if (existingSubscriber.isActive === 1) {
        return new Response(
          JSON.stringify({ success: false, message: '이미 구독된 이메일 주소입니다.' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      } else {
        // 비활성 상태라면 다시 활성화
        await db.update(schema.newsletterSubscribers).set({ isActive: 1, name: name || existingSubscriber.name, createdAt: new Date().toISOString() }).where(eq(schema.newsletterSubscribers.email, email)).run();
        sendWelcomeEmail(email, name || existingSubscriber.name || undefined, locals.runtime.env).catch(console.error);
        return new Response(
          JSON.stringify({ success: true, message: '뉴스레터 구독이 성공적으로 재활성화되었습니다. 환영 이메일을 확인해주세요!' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 3. DB에 데이터 저장
    const newSubscriber: NewNewsletterSubscriber = {
      email,
      name,
      isActive: 1,
    };
    await insertNewsletterSubscriber(db, newSubscriber);

    // 4. 환영 이메일 발송 (비동기로 처리하여 응답 지연 방지)
    sendWelcomeEmail(email, name || undefined, locals.runtime.env).catch(console.error);

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
