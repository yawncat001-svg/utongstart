import type { Inquiry } from '../db/client';

/**
 * 새로운 상담 신청이 접수되었을 때 관리자에게 상세 내용을 메일로 알림
 */
export async function sendInquiryNotification(inquiry: Inquiry, env: any) {
  // 사용자 제공 설정 우선 (환경 변수가 없을 경우 대비)
  const apiKey = env.RESEND_API_KEY || 're_fXWPxXvR_8c5As6oSWBbt8Nbqwodt26YS';
  const toEmail = env.NOTIFICATION_EMAIL || 'utongstart@naver.com';

  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured. Email notification skipped.');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'notification@utongstart.co.kr',
        to: toEmail,
        subject: `[유통스타트] 신규 상담 신청: ${inquiry.company} (${inquiry.name}님)`,
        html: `
          <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8fafc;">
            <div style="background-color: #ffffff; border-radius: 20px; padding: 40px; shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <span style="background-color: #ef4444; color: #ffffff; padding: 6px 16px; border-radius: 50px; font-size: 12px; font-weight: bold; letter-spacing: 1px;">NEW INQUIRY</span>
              </div>
              <h2 style="color: #0f172a; font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 10px; letter-spacing: -0.5px;">새로운 상담 신청이 접수되었습니다</h2>
              <p style="color: #64748b; font-size: 15px; text-align: center; margin-bottom: 40px;">입력된 실시간 상담 신청 상세 내역입니다.</p>
              
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 14px; width: 100px;">신청인</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 15px; font-weight: 600;">${inquiry.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 14px;">회사/브랜드</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 15px; font-weight: 600;">${inquiry.company}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 14px;">연락처</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 15px; font-weight: 600;">${inquiry.phone}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 14px;">이메일</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 15px;">${inquiry.email || '미입력'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #475569; font-size: 14px;">관심 서비스</td>
                    <td style="padding: 12px 0; color: #ef4444; font-size: 15px; font-weight: 600;">${inquiry.serviceType}</td>
                  </tr>
                </table>
              </div>
              
              <div style="margin-bottom: 10px; color: #0f172a; font-size: 14px; font-weight: bold;">문의/요청 상세 내용</div>
              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; color: #334155; font-size: 14px; line-height: 1.6; min-height: 100px;">
                ${inquiry.message ? inquiry.message.replace(/\n/g, '<br/>') : '상세 내용이 없습니다.'}
              </div>
              
              <div style="margin-top: 40px; text-align: center;">
                <a href="mailto:${inquiry.email || ''}" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 14px 28px; border-radius: 10px; font-size: 14px; font-weight: bold; text-decoration: none; transition: background-color 0.2s;">이메일로 바로 회신하기</a>
              </div>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #94a3b8; font-size: 12px;">
              © 2024 유통스타트 (HELFLAB). 본 메일은 시스템에서 전송된 자동 알림 메일입니다.
            </div>
          </div>
        `
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send inquiry email:', error);
    return false;
  }
}

/**
 * 뉴스레터 구독 환영 메일 발송
 */
export async function sendWelcomeEmail(email: string, name: string | undefined, env: any) {
  const apiKey = env.RESEND_API_KEY || 're_fXWPxXvR_8c5As6oSWBbt8Nbqwodt26YS';

  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured. Welcome email skipped.');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'notification@utongstart.co.kr',
        to: email,
        subject: `[유통스타트] ${name ? name + '님, ' : ''}구독해주셔서 감사합니다!`,
        html: `
          <div style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8fafc;">
            <div style="background-color: #ffffff; border-radius: 20px; padding: 50px 40px; text-align: center;">
              <div style="margin-bottom: 30px; display: inline-block; padding: 15px; background-color: #fef2f2; border-radius: 20px;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path></svg>
              </div>
              <h1 style="color: #0f172a; font-size: 28px; font-weight: 800; margin-bottom: 20px; letter-spacing: -1px;">환영합니다! 유통스타트 구독이 완료되었습니다.</h1>
              <p style="color: #475569; font-size: 16px; line-height: 1.7; margin-bottom: 40px;">
                이제 유통스타트가 제공하는 프리미엄 유통 전략과 트렌드 분석 리포트를 가장 먼저 받아보실 수 있습니다. 제조사의 자생력을 키우는 실전 노하우를 아낌없이 전달해 드리겠습니다.
              </p>
              
              <div style="border-top: 1px solid #f1f5f9; padding-top: 40px; margin-top: 40px;">
                <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">지금 바로 가장 인기 있는 '유통스타트 프로그램'을 확인해 보세요.</p>
                <a href="https://utongstart.co.kr/services/utongstart" style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 16px 32px; border-radius: 12px; font-size: 15px; font-weight: bold; text-decoration: none;">프로그램 상세 보기</a>
              </div>
            </div>
            
            <div style="margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.6;">
              본 이메일은 수신동의를 하신 분들께 발송되었습니다.<br/>
              수신을 원치 않으시면 <a href="#" style="color: #94a3b8; text-decoration: underline;">수신거부</a>를 클릭해 주세요.
            </div>
          </div>
        `
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}
