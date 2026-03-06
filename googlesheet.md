# 구글 시트 연동 시스템 구축 가이드라인 (Astro + Cloudflare + GAS)

이 문서는 현재 유통스타트 웹사이트에 적용된 구글 시트 데이터 저장 시스템을 다른 프로젝트에서도 동일하게 구현할 수 있도록 돕는 기술 가이드입니다.

---

## 1. 구글 앱스 스크립트 (GAS) 설정 (서버 측)

데이터를 받아 실제 시트에 기록하는 역할을 합니다.

### 1.1 스크립트 작성

연동할 구글 시트에서 `확장 프로그램 > Apps Script`를 클릭하고 아래 코드를 붙여넣습니다.

```javascript
/*
  Google Apps Script: doPost(e)
  설명: 외부 POST 요청을 받아 시트별로 데이터를 추가합니다.
*/
function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var type = params.type; // 'inquiry' 또는 'newsletter'
    var data = params.data;
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(type === 'inquiry' ? '상담신청자' : '뉴스레터구독자');
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        "result": "error", "error": "Sheet not found"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 데이터 형식에 맞게 행 추가
    if (type === 'inquiry') {
      sheet.appendRow([
        data.timestamp, 
        data.name, 
        data.company, 
        data.phone, 
        data.email, 
        data.serviceType, 
        data.message
      ]);
    } else {
      sheet.appendRow([
        new Date().toISOString(), 
        data.email, 
        data.name || 'N/A'
      ]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      "result": "success"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (f) {
    return ContentService.createTextOutput(JSON.stringify({
      "result": "error", "error": f.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 1.2 배포 설정 (중요)

1. 상단 **[새 배포]** 클릭
2. 유형 선택: **[웹 앱]**
3. 설명: `v1.0.0` (자유롭게 입력)
4. 다음 사용자로 실행: **[나 (본인 계정)]**
5. 액세스 권한이 있는 사용자: **[모든 사용자]** (로그인 없이 접근 가능해야 연동됩니다.)
6. **[배포]** 클릭 후 생성된 **웹 앱 URL**을 복사해둡니다.

---

## 2. 웹 프로젝트 설정 (Cloudflare Pages / Astro 측)

### 2.1 환경 변수 설정

Cloudflare Pages 관리 대시보드에서 `Settings > Functions > Environment variables`에 아래 변수를 추가합니다.

- `GOOGLE_SHEET_API_URL`: 위 1.2단계에서 복사한 웹 앱 URL

### 2.2 유틸리티 함수 (`src/lib/utils/googleSheets.ts`)

리다이렉트와 CORS 문제를 피하기 위한 설정을 포함합니다.

```typescript
export async function saveToGoogleSheets(type: 'inquiry' | 'newsletter', data: any, env: any) {
  const url = env.GOOGLE_SHEET_API_URL;
  if (!url) return console.error('GOOGLE_SHEET_API_URL is missing');

  try {
    await fetch(url, {
      method: 'POST',
      redirect: 'follow', // GAS의 리다이렉트를 따라가기 위해 필수
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // 단순 요청으로 취급하여 CORS preflight 회피
      body: JSON.stringify({ type, data })
    });
  } catch (error) {
    console.error('Google Sheets Sync Error:', error);
  }
}
```

### 2.3 API 라우트 구현 패턴

타임아웃을 방지하기 위해 `ctx.waitUntil`을 사용한 백그라운드 처리가 핵심입니다.

```typescript
// src/pages/api/submit-contact.ts 예시
export const prerender = false; // SSR 강제 (405 에러 방지)

export const POST: APIRoute = async ({ request, locals }) => {
  const formData = await request.json();
  
  // 1. 유효성 검사 로직...
  
  // 2. 비동기 저장 (사용자 응답 대기 없음)
  const { env, ctx } = (locals as any).runtime;
  const sheetPromise = saveToGoogleSheets('inquiry', payload, env);
  
  if (ctx?.waitUntil) {
    ctx.waitUntil(sheetPromise); // Cloudflare Worker 환경에서 응답 후 작업 지속
  }
  
  // 3. 즉시 성공 응답
  return new Response(JSON.stringify({ success: true }), { status: 201 });
};
```

---

## 3. 핵심 유지보수 포인트 (FAQ)

- **Q: 405 Method Not Allowed 에러가 나요!**
  - **A:** Astro의 하이브리드 모드에서 API가 정적으로 생성된 경우입니다. 파일 상단에 `export const prerender = false;`를 반드시 추가하세요.
  
- **Q: 구글 시트에 데이터가 안 쌓여요!**
  - **A:** Cloudflare 관리 페이지에 환경 변수(`GOOGLE_SHEET_API_URL`)가 정확히 등록되었는지 확인하세요. `.env` 파일은 로컬용이며, 서버 배포 시에는 관리자 대시보드 설정이 우선됩니다.
  
- **Q: 네트워크 오류(400)가 발생해요!**
  - **A:** `validateForm.ts`의 유효성 검사 규칙(예: 전화번호 하이픈 필수 여부 등)과 클라이언트가 보내는 데이터 형식을 대조해 보세요.

---

**© 2026 유통스타트 개발 팀 가이드**
