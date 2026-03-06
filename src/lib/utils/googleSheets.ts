/**
 * Google Apps Script를 통해 구글 시트에 데이터를 저장하는 유틸리티
 */
export async function saveToGoogleSheets(type: 'inquiry' | 'newsletter', data: any, env: any) {
    const gasUrl = env.GOOGLE_SHEET_API_URL || 'https://script.google.com/macros/s/AKfycbwmq3kuVbidNUQ5LbuhRt4na5yGs3wzXI6O_QWjrzazzAoTFRbl7Nbmx1_EMZA5bNc/exec';

    if (!gasUrl) {
        console.warn('GOOGLE_SHEET_API_URL is not configured.');
        return false;
    }

    try {
        // GAS 요청 시 redirect: 'follow'가 필수인 경우가 많습니다.
        const response = await fetch(gasUrl, {
            method: 'POST',
            redirect: 'follow',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // GAS에서 JSON을 받을 때 가끔 생기는 이슈 방지
            },
            body: JSON.stringify({
                type,
                timestamp: new Date().toISOString(),
                ...data
            })
        });

        if (!response.ok) {
            console.error(`Google Sheets Error Status: ${response.status}`);
            return false;
        }

        console.log(`Successfully synced ${type} to Google Sheets.`);
        return true;
    } catch (error) {
        console.error('Failed to sync to Google Sheets:', error);
        return false;
    }
}
