/**
 * Google Apps Script를 통해 구글 시트에 데이터를 저장하는 유틸리티
 */
export async function saveToGoogleSheets(type: 'inquiry' | 'newsletter', data: any, env: any) {
    const gasUrl = env.GOOGLE_SHEET_API_URL || 'https://script.google.com/macros/s/AKfycbwmq3kuVbidNUQ5LbuhRt4na5yGs3wzXI6O_QWjrzazzAoTFRbl7Nbmx1_EMZA5bNc/exec';

    if (!gasUrl) {
        console.warn('GOOGLE_SHEET_API_URL is not configured. Google Sheets sync skipped.');
        return false;
    }

    try {
        const response = await fetch(gasUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type,
                timestamp: new Date().toISOString(),
                ...data
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google Sheets API Error: ${errorText}`);
        }

        console.log(`Successfully saved ${type} data to Google Sheets.`);
        return true;
    } catch (error) {
        console.error('Failed to save to Google Sheets:', error);
        return false;
    }
}
