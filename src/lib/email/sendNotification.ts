import type { Inquiry } from '../db/client';

export async function sendInquiryNotification(inquiry: Inquiry, env: any) {
  // 실제 이메일 발송 서비스(Resend 등)를 통한 알림 로직
  // 여기에서는 콘솔 로그로 대체하며 원본 명세에 따라 구현할 수 있습니다.
  console.log('Sending inquiry notification email to: ', env.NOTIFICATION_EMAIL);
  console.log('Inquiry details: ', JSON.stringify(inquiry, null, 2));

  // Resend API 예시 호출 (가상)
  /*
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: env.NOTIFICATION_EMAIL,
      subject: `[유통스타트] 새 상담이 접수되었습니다: ${inquiry.company}`,
      html: `
        <h1>새로운 상담 신청이 있습니다.</h1>
        <p>담당자: ${inquiry.name}</p>
        <p>회사: ${inquiry.company}</p>
        <p>연락처: ${inquiry.phone}</p>
        <p>서비스: ${inquiry.serviceType}</p>
        <p>내용: ${inquiry.message || '없음'}</p>
      `
    })
  });
  return response.ok;
  */
  return true;
}

export async function sendWelcomeEmail(email: string, name: string | undefined, env: any) {
  console.log(`Sending welcome email to: ${email}, Name: ${name || 'Subscriber'}`);
  return true;
}
