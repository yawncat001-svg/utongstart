import type { APIRoute } from 'astro';
import { saveToGoogleSheets } from '../../lib/utils/googleSheets';

/**
 * [DEBUG 전용] 구글 시트 연동 상태 확인 API
 * URL: /api/debug-sheet
 */
export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const body = await request.json() as any;
        const type = body.type || 'inquiry';
        const data = body.data || {
            name: '디버그 테스트',
            company: '유통스타트 연구소',
            message: '서버 환경 변수 및 네트워크 리다이렉트 테스트 중입니다.'
        };

        const env = (locals?.runtime?.env || {}) as any;

        // 환경 변수 마스킹 처리하여 로그에 출력
        const apiUrl = env.GOOGLE_SHEET_API_URL || 'NOT_CONFIGURED';
        console.log(`[DEBUG] Attempting to sync to Google Sheets. URL: ${apiUrl.substring(0, 30)}...`);

        // 백그라운드가 아닌 실제 응답을 기다려서 결과를 확인 (디버그용)
        const result = await saveToGoogleSheets(type, data, env);

        return new Response(
            JSON.stringify({
                success: result,
                message: result ? '구글 시트 연동 성공' : '구글 시트 연동 실패',
                env_configured: apiUrl !== 'NOT_CONFIGURED',
                timestamp: new Date().toISOString()
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (err) {
        console.error('[DEBUG] Sheet Sync Error:', err);
        return new Response(
            JSON.stringify({
                success: false,
                error: (err as any).message,
                stack: (err as any).stack
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
