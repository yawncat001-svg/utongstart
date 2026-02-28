기술 스택 검증 완료. Astro가 Cloudflare에 공식 합류(2026.01)한 상태이므로 Astro + Cloudflare Pages가 최적의 조합임이 확인됨. 이제 구현 명세서를 작성하겠음.

---

# utongstart.co.kr 구현 명세서 (Implementation Specification)

**문서 버전:** v1.0
**작성일:** 2026-02-28
**프로젝트명:** 유통스타트 웹사이트
**도메인:** utongstart.co.kr

---

## 1. 기술 스택 선정 근거

**프레임워크: Astro (v5.x)**

Astro를 선택한 근거는 명확함. 2026년 1월 Astro가 Cloudflare에 공식 합류하면서 Cloudflare Pages와의 통합이 1st-party 수준으로 강화됨. 콘텐츠 중심 웹사이트(유통스타트는 서비스 소개 + 블로그 + 상담폼이 핵심)에서 Astro는 Zero JavaScript by default라는 특성 덕분에 페이지 로딩 속도가 압도적으로 빠름. 이는 네이버 SEO와 구글 Core Web Vitals 점수에 직접적으로 기여함. Islands Architecture를 통해 상담 신청 폼, 카카오톡 챗봇 등 인터랙티브가 필요한 부분만 선택적으로 JavaScript를 로드하므로 성능과 기능을 동시에 확보할 수 있음.

**배포: Cloudflare Pages (GitHub 연동 자동 배포)**

GitHub 리포지토리에 push하면 Cloudflare Pages가 자동으로 빌드·배포하는 구조임. 무료 티어에서도 월 500회 빌드, 무제한 요청, 무제한 대역폭을 제공하므로 초기 비용이 0원임.

**백엔드: Cloudflare Workers + D1 (SQLite 기반 서버리스 DB)**

상담 신청 폼 데이터 저장에 Cloudflare D1을 사용함. 별도 서버 운영 없이 서버리스로 동작하며, 무료 티어에서 5GB 저장, 일 500만 읽기/10만 쓰기가 가능하므로 초기 단계에 충분함.

**스타일링: Tailwind CSS v4**

유틸리티 기반 CSS 프레임워크로 디자인 시스템을 빠르게 구축할 수 있고, Astro와의 통합이 완벽함.

**전체 스택 요약**

```
Frontend:     Astro 5.x + Tailwind CSS 4.x
UI Islands:   React 19 (상담폼, 인터랙티브 컴포넌트 한정)
Backend:      Cloudflare Workers (API Routes via Astro SSR)
Database:     Cloudflare D1 (SQLite)
ORM:          Drizzle ORM
Storage:      Cloudflare R2 (이미지/파일 저장, 필요 시)
Analytics:    Cloudflare Web Analytics (무료) + GA4
IDE:          VSCode
VCS:          GitHub
Deploy:       Cloudflare Pages (GitHub Auto Deploy)
Domain:       utongstart.co.kr (Cloudflare DNS)
```

---

## 2. 개발 환경 설정 명세

### 2-1. VSCode 필수 익스텐션

```
astro-build.astro-vscode          // Astro 공식 언어 지원
bradlc.vscode-tailwindcss          // Tailwind CSS IntelliSense
dbaeumer.vscode-eslint             // ESLint
esbenp.prettier-vscode             // Prettier
cloudflare.cloudflare-workers-bindings-extension  // Cloudflare 바인딩
github.vscode-pull-request-github  // GitHub PR 관리
```

### 2-2. GitHub 리포지토리 구조

```
Repository: utongstart/utongstart-web
Branch Strategy:
  main        → Production (utongstart.co.kr)
  staging     → Preview (staging.utongstart.pages.dev)
  feature/*   → 기능 개발 브랜치
```

### 2-3. Cloudflare Pages 빌드 설정

| 항목 | 값 |
|---|---|
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node.js version | 20.x |
| Environment variables | 아래 별도 정리 |

### 2-4. 환경 변수 (Cloudflare Dashboard에서 설정)

| 변수명 | 용도 | 환경 |
|---|---|---|
| `D1_DATABASE` | D1 바인딩 이름 | Production/Preview |
| `KAKAO_CHANNEL_KEY` | 카카오톡 채널 API 키 | Production |
| `GA_MEASUREMENT_ID` | Google Analytics 4 측정 ID | Production |
| `NAVER_SITE_VERIFICATION` | 네이버 서치어드바이저 인증 코드 | Production |
| `GOOGLE_SITE_VERIFICATION` | 구글 서치콘솔 인증 코드 | Production |
| `NOTIFICATION_EMAIL` | 상담 접수 알림 수신 이메일 | Production |
| `RESEND_API_KEY` | 이메일 발송 서비스 API 키 | Production |

---

## 3. 파일 트리 구조

```
utongstart-web/
├── .github/
│   └── workflows/
│       └── preview.yml                    # staging 브랜치 프리뷰 배포
│
├── public/
│   ├── favicon.ico
│   ├── og-image.png                       # Open Graph 기본 이미지 (1200x630)
│   ├── robots.txt
│   ├── sitemap-index.xml                  # Astro 자동 생성 (빌드 시)
│   ├── naver-site-verification.html       # 네이버 서치어드바이저 인증
│   └── images/
│       ├── logo/
│       │   ├── logo-full.svg              # 전체 로고
│       │   ├── logo-icon.svg              # 아이콘만
│       │   └── logo-white.svg             # 흰색 버전
│       ├── hero/
│       │   ├── hero-main.webp             # 메인 히어로 이미지
│       │   └── hero-mobile.webp           # 모바일 히어로
│       ├── services/
│       │   ├── utongstart-icon.svg        # 유통스타트 아이콘
│       │   ├── live-commerce-icon.svg     # 라이브커머스 아이콘
│       │   └── place-seo-icon.svg         # 플레이스 아이콘
│       ├── steps/
│       │   ├── step-wadiz.webp            # STEP1 와디즈
│       │   ├── step-live.webp             # STEP2 라이브
│       │   ├── step-group-buy.webp        # STEP3 공동구매
│       │   └── step-closed-mall.webp      # STEP4 폐쇄몰
│       ├── cases/                         # 성공사례 이미지
│       └── team/                          # 팀 소개 이미지
│
├── src/
│   ├── assets/
│   │   └── styles/
│   │       ├── global.css                 # Tailwind 베이스 + 글로벌 스타일
│   │       └── fonts.css                  # 웹폰트 선언 (Pretendard)
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.astro               # GNB 헤더
│   │   │   ├── Footer.astro               # 푸터
│   │   │   ├── MobileNav.astro            # 모바일 햄버거 메뉴
│   │   │   ├── Breadcrumb.astro           # 브레드크럼 네비게이션
│   │   │   ├── CTABanner.astro            # 공통 CTA 배너
│   │   │   ├── SEOHead.astro              # SEO 메타 태그 컴포넌트
│   │   │   └── KakaoChat.astro            # 카카오톡 상담 플로팅 버튼
│   │   │
│   │   ├── home/
│   │   │   ├── HeroSection.astro          # 메인 히어로
│   │   │   ├── PainPointSection.astro     # 제조사 Pain Point 3단계
│   │   │   ├── ServiceCards.astro         # 3개 사업영역 카드
│   │   │   ├── ProcessFlow.astro          # 4단계 유통 프로세스 인포그래픽
│   │   │   ├── CaseHighlight.astro        # 성공사례 하이라이트
│   │   │   └── StatsCounter.astro         # 수치 카운터 (누적 고객수 등)
│   │   │
│   │   ├── services/
│   │   │   ├── ServiceHero.astro          # 서비스 페이지 공통 히어로
│   │   │   ├── StepCard.astro             # 단계별 카드 (재사용)
│   │   │   ├── PricingTable.astro         # 요금표 컴포넌트
│   │   │   ├── ComparisonTable.astro      # 경쟁사 비교표
│   │   │   └── FAQAccordion.astro         # FAQ 아코디언
│   │   │
│   │   ├── cases/
│   │   │   ├── CaseCard.astro             # 사례 카드
│   │   │   └── CaseFilter.astro           # 사례 필터 (카테고리별)
│   │   │
│   │   ├── blog/
│   │   │   ├── PostCard.astro             # 블로그 포스트 카드
│   │   │   ├── PostList.astro             # 포스트 목록
│   │   │   └── TableOfContents.astro      # 목차 사이드바
│   │   │
│   │   └── contact/
│   │       ├── ConsultForm.tsx            # 상담 신청 폼 (React Island)
│   │       └── FormSuccess.astro          # 폼 제출 성공 메시지
│   │
│   ├── content/
│   │   ├── config.ts                      # Content Collections 스키마 정의
│   │   ├── cases/                         # 성공사례 MDX 파일
│   │   │   ├── case-001.mdx
│   │   │   └── case-002.mdx
│   │   └── blog/                          # 블로그 포스트 MDX 파일
│   │       ├── distribution-mistakes-top5.mdx
│   │       └── wadiz-checklist.mdx
│   │
│   ├── data/
│   │   ├── navigation.ts                  # GNB 메뉴 데이터
│   │   ├── services.ts                    # 서비스 정보 데이터
│   │   ├── pricing.ts                     # 패키지 가격 데이터
│   │   ├── faq.ts                         # FAQ 데이터
│   │   ├── steps.ts                       # 유통 4단계 데이터
│   │   └── seo.ts                         # 페이지별 SEO 메타데이터
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro               # 기본 레이아웃 (HTML 구조)
│   │   ├── ServiceLayout.astro            # 서비스 상세 페이지 레이아웃
│   │   ├── BlogLayout.astro               # 블로그 포스트 레이아웃
│   │   └── CaseLayout.astro               # 성공사례 상세 레이아웃
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts                  # Drizzle ORM 스키마 정의
│   │   │   ├── client.ts                  # D1 클라이언트 초기화
│   │   │   └── migrations/               # DB 마이그레이션 파일
│   │   │       └── 0001_create_inquiries.sql
│   │   │
│   │   ├── email/
│   │   │   └── sendNotification.ts        # 상담 접수 알림 이메일 발송
│   │   │
│   │   └── utils/
│   │       ├── formatDate.ts              # 날짜 포맷 유틸
│   │       ├── slugify.ts                 # URL 슬러그 생성
│   │       └── validateForm.ts            # 폼 유효성 검증
│   │
│   ├── pages/
│   │   ├── index.astro                    # 메인페이지 (홈)
│   │   │
│   │   ├── services/
│   │   │   ├── utongstart.astro           # 유통스타트 서비스 상세
│   │   │   ├── live-commerce.astro        # 라이브커머스 서비스 상세
│   │   │   └── place-seo.astro            # 플레이스 상위노출 서비스 상세
│   │   │
│   │   ├── pricing.astro                  # 통합 요금 안내 페이지
│   │   │
│   │   ├── cases/
│   │   │   ├── index.astro                # 성공사례 목록
│   │   │   └── [...slug].astro            # 성공사례 상세 (동적 라우팅)
│   │   │
│   │   ├── blog/
│   │   │   ├── index.astro                # 블로그 목록
│   │   │   ├── [...slug].astro            # 블로그 상세 (동적 라우팅)
│   │   │   └── [tag].astro                # 태그별 필터
│   │   │
│   │   ├── contact.astro                  # 상담 신청 페이지
│   │   │
│   │   ├── about.astro                    # 회사 소개
│   │   │
│   │   ├── api/
│   │   │   ├── inquiry.ts                 # POST: 상담 신청 API 엔드포인트
│   │   │   └── newsletter.ts              # POST: 뉴스레터 구독 API
│   │   │
│   │   ├── 404.astro                      # 404 에러 페이지
│   │   └── [...slug].astro                # CMS 동적 페이지 (확장용)
│   │
│   └── env.d.ts                           # 환경 타입 선언
│
├── drizzle.config.ts                      # Drizzle ORM 설정
├── astro.config.mjs                       # Astro 프로젝트 설정
├── tailwind.config.mjs                    # Tailwind CSS 설정
├── tsconfig.json                          # TypeScript 설정
├── wrangler.toml                          # Cloudflare Workers/D1 바인딩 설정
├── package.json
├── .gitignore
├── .prettierrc
├── .eslintrc.cjs
└── README.md
```

---

## 4. 데이터 스키마 (Data Schema)

### 4-1. Cloudflare D1 데이터베이스 스키마

**테이블: `inquiries` (상담 신청)**

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 고유 ID |
| `created_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 신청 일시 |
| `name` | TEXT | NOT NULL | 담당자명 |
| `company` | TEXT | NOT NULL | 회사명 |
| `phone` | TEXT | NOT NULL | 연락처 |
| `email` | TEXT | | 이메일 (선택) |
| `service_type` | TEXT | NOT NULL | 관심 서비스: 'utongstart' / 'live-commerce' / 'place-seo' / 'package' |
| `product_category` | TEXT | | 제품 카테고리: '식품' / '뷰티' / '생활용품' / '테크' / '기타' |
| `budget_range` | TEXT | | 예산 범위: 'under-300' / '300-500' / '500-1000' / 'over-1000' |
| `message` | TEXT | | 상세 문의 내용 |
| `referral_source` | TEXT | | 유입 경로: 'search' / 'sns' / 'referral' / 'sourcing-start' / 'other' |
| `status` | TEXT | DEFAULT 'new' | 상태: 'new' / 'contacted' / 'in-progress' / 'completed' / 'cancelled' |
| `admin_note` | TEXT | | 내부 메모 |

**테이블: `newsletter_subscribers` (뉴스레터 구독)**

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 고유 ID |
| `created_at` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 구독 일시 |
| `email` | TEXT | NOT NULL, UNIQUE | 이메일 |
| `name` | TEXT | | 이름 (선택) |
| `is_active` | INTEGER | DEFAULT 1 | 구독 상태: 1=활성, 0=해지 |

**테이블: `page_views` (간이 페이지뷰 로그, Cloudflare Analytics 보완용)**

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 고유 ID |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | 기록 일시 |
| `path` | TEXT | NOT NULL | 페이지 경로 |
| `referrer` | TEXT | | 리퍼러 |
| `utm_source` | TEXT | | UTM 소스 |
| `utm_medium` | TEXT | | UTM 미디엄 |
| `utm_campaign` | TEXT | | UTM 캠페인 |

### 4-2. Drizzle ORM 스키마 (`src/lib/db/schema.ts`)

```typescript
// schema.ts 에서 정의할 테이블 및 타입

export const inquiries = sqliteTable('inquiries', {
  id:               integer('id').primaryKey({ autoIncrement: true }),
  createdAt:        text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  name:             text('name').notNull(),
  company:          text('company').notNull(),
  phone:            text('phone').notNull(),
  email:            text('email'),
  serviceType:      text('service_type').notNull(),
  productCategory:  text('product_category'),
  budgetRange:      text('budget_range'),
  message:          text('message'),
  referralSource:   text('referral_source'),
  status:           text('status').default('new'),
  adminNote:        text('admin_note'),
});

export const newsletterSubscribers = sqliteTable('newsletter_subscribers', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  email:     text('email').notNull().unique(),
  name:      text('name'),
  isActive:  integer('is_active').default(1),
});
```

### 4-3. Content Collections 스키마 (`src/content/config.ts`)

```typescript
// Astro Content Collections 스키마 정의

// 성공사례 (cases) 컬렉션
export const casesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title:           z.string(),
    company:         z.string(),
    category:        z.enum(['utongstart', 'live-commerce', 'place-seo']),
    thumbnail:       z.string(),
    summary:         z.string().max(200),
    results: z.object({
      metric1Label:  z.string(),
      metric1Value:  z.string(),
      metric2Label:  z.string(),
      metric2Value:  z.string(),
    }),
    publishedAt:     z.coerce.date(),
    featured:        z.boolean().default(false),
    tags:            z.array(z.string()),
  }),
});

// 블로그 (blog) 컬렉션
export const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    description: z.string().max(300),
    author:      z.string().default('유통스타트'),
    thumbnail:   z.string(),
    publishedAt: z.coerce.date(),
    updatedAt:   z.coerce.date().optional(),
    tags:        z.array(z.string()),
    category:    z.enum(['유통전략', '와디즈', '라이브커머스', '플레이스', '마케팅팁']),
    readingTime: z.number(),
    featured:    z.boolean().default(false),
  }),
});
```

### 4-4. 정적 데이터 스키마 (`src/data/`)

**`navigation.ts` - 네비게이션 데이터**

```json
[
  {
    "label": "유통스타트",
    "href": "/services/utongstart",
    "children": null
  },
  {
    "label": "라이브커머스",
    "href": "/services/live-commerce",
    "children": null
  },
  {
    "label": "플레이스 상위노출",
    "href": "/services/place-seo",
    "children": null
  },
  {
    "label": "요금안내",
    "href": "/pricing",
    "children": null
  },
  {
    "label": "성공사례",
    "href": "/cases",
    "children": null
  },
  {
    "label": "블로그",
    "href": "/blog",
    "children": null
  }
]
```

**`pricing.ts` - 패키지 요금 데이터**

```json
{
  "utongstart": {
    "serviceName": "유통스타트",
    "packages": [
      {
        "tier": "basic",
        "name": "베이직",
        "price": "400만원~",
        "description": "와디즈 런칭 + 라이브 1회",
        "features": [
          "시장조사 리포트",
          "와디즈 상품 기획 컨설팅",
          "상세페이지 기획 + 디자인",
          "와디즈 심사 대행",
          "라이브방송 1회 (모객용)",
          "성과 분석 리포트 1회"
        ],
        "highlight": false
      },
      {
        "tier": "standard",
        "name": "스탠다드",
        "price": "600만원~",
        "description": "베이직 + 공동구매 + 라이브 추가",
        "features": [
          "베이직 전체 포함",
          "라이브방송 추가 1회",
          "인플루언서 3명 선정 + 공동구매 진행",
          "공동구매 운영 가이드",
          "유통 전략 컨설팅 1회",
          "성과 분석 리포트 2회"
        ],
        "highlight": true
      },
      {
        "tier": "premium",
        "name": "프리미엄",
        "price": "800만원~",
        "description": "전체 4단계 + 유통 전략 컨설팅",
        "features": [
          "스탠다드 전체 포함",
          "폐쇄몰 입점 지원 (제안서 작성 + 벤더 연결)",
          "유통 전략 컨설팅 3회",
          "소싱스타트 프리미엄 회원 3개월",
          "유통채널 발굴 가이드북",
          "프로그램 수료 후 3개월 사후관리"
        ],
        "highlight": false
      }
    ]
  },
  "liveCommerce": {
    "serviceName": "라이브커머스",
    "packages": [
      {
        "tier": "single",
        "name": "싱글",
        "price": "50만원~",
        "description": "1회 방송",
        "features": [
          "쇼호스트 1명",
          "기본 촬영 (카메라 1대)",
          "단일 플랫폼 송출",
          "기본 큐시트 제공"
        ],
        "highlight": false
      },
      {
        "tier": "monthly",
        "name": "월정기",
        "price": "150만원~/월",
        "description": "월 2~4회 + 기획 + 리포트",
        "features": [
          "월 2~4회 방송",
          "방송 기획 + 대본 작성",
          "쇼호스트 + PD",
          "멀티카메라 촬영",
          "월간 성과 리포트"
        ],
        "highlight": true
      },
      {
        "tier": "performance",
        "name": "성과연동",
        "price": "30만원 + 매출 5~8%",
        "description": "고정비 최소화, 매출 연동",
        "features": [
          "기본 고정비 30만원",
          "매출액 기준 5~8% RS",
          "성과 미달 시 고정비만 부과",
          "월간 성과 리포트"
        ],
        "highlight": false
      }
    ]
  },
  "placeSeo": {
    "serviceName": "플레이스 상위노출",
    "packages": [
      {
        "tier": "light",
        "name": "라이트",
        "price": "월 30만원~",
        "description": "기본 최적화",
        "features": [
          "플레이스 기본정보 최적화",
          "소식 발행 관리 (주 2회)",
          "리뷰 관리 가이드",
          "월간 순위 리포트"
        ],
        "highlight": false
      },
      {
        "tier": "standard",
        "name": "스탠다드",
        "price": "월 60만원~",
        "description": "라이트 + 트래픽 + 리뷰",
        "features": [
          "라이트 전체 포함",
          "트래픽 관리 (방문·저장·길찾기)",
          "리뷰 관리 대행",
          "경쟁업체 분석"
        ],
        "highlight": true
      },
      {
        "tier": "premium",
        "name": "프리미엄",
        "price": "월 100만원~",
        "description": "스탠다드 + 상위노출 + 바이럴",
        "features": [
          "스탠다드 전체 포함",
          "키워드 상위노출 관리",
          "블로그/카페 바이럴 연계",
          "주간 순위 리포트",
          "전담 매니저 배정"
        ],
        "highlight": false
      }
    ]
  }
}
```

**`steps.ts` - 유통스타트 4단계 프로세스 데이터**

```json
[
  {
    "step": 1,
    "title": "와디즈 런칭",
    "subtitle": "시장 검증 + 브랜드 인지도 확보",
    "description": "소비자 시장조사를 기반으로 와디즈 구조에 맞는 상품 디자인을 기획하고, 크라우드펀딩 런칭까지 지원합니다.",
    "outcomes": ["시장 반응 데이터 확보", "초기 서포터(고객) 확보", "브랜드 스토리 검증"],
    "icon": "step-wadiz",
    "duration": "4~6주"
  },
  {
    "step": 2,
    "title": "라이브방송 지원",
    "subtitle": "모객 + 초기 매출 견인",
    "description": "와디즈 펀딩 기간 중 라이브방송을 통해 모객하고, 브랜드 인지도와 매출을 동시에 끌어올립니다.",
    "outcomes": ["실시간 고객 반응 체험", "라이브커머스 운영 노하우", "매출 견인 경험"],
    "icon": "step-live",
    "duration": "1~2주"
  },
  {
    "step": 3,
    "title": "공동구매 유통",
    "subtitle": "인플루언서 네트워크 구축",
    "description": "인플루언서 선정부터 상품 공급, 정산까지 공동구매 전 과정을 직접 경험합니다.",
    "outcomes": ["인플루언서 발굴·협업 역량", "공동구매 운영 프로세스 체득", "팬덤 기반 매출 경험"],
    "icon": "step-group-buy",
    "duration": "2~4주"
  },
  {
    "step": 4,
    "title": "폐쇄몰 입점",
    "subtitle": "안정적 B2B 거래처 확보",
    "description": "상품 제안서 작성부터 복지몰·임직원몰 입점 협상까지, B2B 유통의 기본기를 체득합니다.",
    "outcomes": ["상품 제안서 작성 역량", "B2B 유통 구조 이해", "안정적 거래처 확보 경험"],
    "icon": "step-closed-mall",
    "duration": "2~4주"
  }
]
```

**`seo.ts` - 페이지별 SEO 메타데이터**

```json
{
  "home": {
    "title": "유통스타트 | 제조사의 첫 유통 경험을 설계합니다",
    "description": "와디즈 런칭부터 라이브커머스, 공동구매, 폐쇄몰 입점까지. 제조사 맞춤 단계별 유통 경험 프로그램. 올바른 유통 경험이 제조사의 미래를 바꿉니다.",
    "keywords": "유통스타트,제조사유통,유통경험,와디즈대행,라이브커머스,플레이스상위노출,유통판로개척",
    "ogImage": "/og-image.png"
  },
  "utongstart": {
    "title": "유통스타트 프로그램 | 4단계 유통 경험 설계",
    "description": "와디즈 → 라이브방송 → 공동구매 → 폐쇄몰. 제조사가 직접 유통 역량을 체화하는 통합 프로그램. 유통 내공을 키워 독립적 판로 개척이 가능합니다.",
    "keywords": "유통경험프로그램,와디즈런칭,공동구매대행,폐쇄몰입점,제조사유통지원",
    "ogImage": "/og-image.png"
  },
  "liveCommerce": {
    "title": "라이브커머스 대행 | 기획부터 송출까지 올인원",
    "description": "네이버 쇼핑라이브, 쿠팡라이브 등 멀티 플랫폼 라이브방송 기획·촬영·송출 대행. 쇼호스트 매칭부터 성과 분석까지.",
    "keywords": "라이브커머스대행,쇼핑라이브,라이브방송대행,쇼호스트,라이브커머스기획",
    "ogImage": "/og-image.png"
  },
  "placeSeo": {
    "title": "네이버 플레이스 상위노출 | 정상적 SEO 최적화",
    "description": "어뷰징 없는 정상적 SEO 방식으로 네이버 플레이스 상위노출. 기본정보 최적화, 리뷰 관리, 트래픽 관리, 바이럴 연계까지.",
    "keywords": "플레이스상위노출,네이버플레이스,스마트플레이스,플레이스SEO,네이버지도순위",
    "ogImage": "/og-image.png"
  },
  "pricing": {
    "title": "요금 안내 | 유통스타트 패키지 가격",
    "description": "유통스타트, 라이브커머스, 플레이스 상위노출 패키지 요금 안내. 제조사 상황에 맞는 최적의 패키지를 선택하세요.",
    "keywords": "유통스타트요금,라이브커머스비용,플레이스상위노출가격,유통대행비용",
    "ogImage": "/og-image.png"
  }
}
```

---

## 5. 핵심 함수 및 API 명세

### 5-1. API 엔드포인트

**`src/pages/api/inquiry.ts`**

| 항목 | 내용 |
|---|---|
| Method | POST |
| Path | `/api/inquiry` |
| Content-Type | `application/json` |
| 함수명 | `POST({ request, locals })` |
| 역할 | 상담 신청 데이터 유효성 검증 → D1 DB 저장 → 이메일 알림 발송 → 응답 반환 |

요청 바디:

```json
{
  "name": "string (필수)",
  "company": "string (필수)",
  "phone": "string (필수, 정규식 검증)",
  "email": "string (선택, 이메일 형식 검증)",
  "serviceType": "enum: utongstart | live-commerce | place-seo | package",
  "productCategory": "enum: food | beauty | living | tech | other",
  "budgetRange": "enum: under-300 | 300-500 | 500-1000 | over-1000",
  "message": "string (선택, 최대 2000자)",
  "referralSource": "enum: search | sns | referral | sourcing-start | other"
}
```

응답:

```json
// 성공 (201)
{ "success": true, "id": 42, "message": "상담 신청이 접수되었습니다." }

// 실패 (400)
{ "success": false, "errors": [{ "field": "phone", "message": "올바른 연락처를 입력해주세요." }] }

// 서버 에러 (500)
{ "success": false, "message": "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }
```

**`src/pages/api/newsletter.ts`**

| 항목 | 내용 |
|---|---|
| Method | POST |
| Path | `/api/newsletter` |
| 함수명 | `POST({ request, locals })` |
| 역할 | 이메일 중복 확인 → D1 DB 저장 → 환영 이메일 발송 |

### 5-2. 유틸리티 함수

**`src/lib/utils/validateForm.ts`**

| 함수명 | 파라미터 | 반환값 | 역할 |
|---|---|---|---|
| `validateInquiry` | `data: InquiryInput` | `{ valid: boolean, errors: FieldError[] }` | 상담 신청 폼 필드 유효성 검증 |
| `validateEmail` | `email: string` | `boolean` | 이메일 형식 검증 |
| `validatePhone` | `phone: string` | `boolean` | 한국 전화번호 형식 검증 (010-XXXX-XXXX) |
| `sanitizeInput` | `input: string` | `string` | XSS 방지용 입력값 새니타이즈 |

**`src/lib/email/sendNotification.ts`**

| 함수명 | 파라미터 | 반환값 | 역할 |
|---|---|---|---|
| `sendInquiryNotification` | `inquiry: Inquiry, env: Env` | `Promise<boolean>` | 새 상담 접수 시 관리자 이메일 알림 발송 (Resend API 사용) |
| `sendWelcomeEmail` | `email: string, name?: string` | `Promise<boolean>` | 뉴스레터 구독 환영 이메일 발송 |

**`src/lib/db/client.ts`**

| 함수명 | 파라미터 | 반환값 | 역할 |
|---|---|---|---|
| `getDB` | `locals: App.Locals` | `DrizzleD1Database` | Cloudflare D1 바인딩에서 Drizzle ORM 인스턴스 생성 |
| `insertInquiry` | `db: DrizzleD1Database, data: NewInquiry` | `Promise<Inquiry>` | 상담 신청 레코드 삽입 |
| `getInquiries` | `db: DrizzleD1Database, filters?: InquiryFilter` | `Promise<Inquiry[]>` | 상담 목록 조회 (관리자용, 향후 확장) |
| `updateInquiryStatus` | `db: DrizzleD1Database, id: number, status: string` | `Promise<void>` | 상담 상태 업데이트 |

**`src/lib/utils/formatDate.ts`**

| 함수명 | 파라미터 | 반환값 | 역할 |
|---|---|---|---|
| `formatKoreanDate` | `date: Date` | `string` | "2026년 2월 28일" 형식 반환 |
| `formatRelativeDate` | `date: Date` | `string` | "3일 전", "1주 전" 형식 반환 |

### 5-3. React Island 컴포넌트 (`src/components/contact/ConsultForm.tsx`)

| 함수/컴포넌트명 | 역할 |
|---|---|
| `ConsultForm` | 상담 신청 폼 전체 컴포넌트 (React) |
| `useFormState` | 폼 상태 관리 커스텀 훅 (입력값, 에러, 로딩, 성공 상태) |
| `handleSubmit` | 폼 제출 핸들러 (/api/inquiry POST 호출) |
| `ServiceTypeSelector` | 서비스 유형 선택 UI (카드 형태 라디오) |
| `BudgetRangeSelector` | 예산 범위 선택 UI |
| `FormField` | 재사용 가능한 폼 필드 컴포넌트 (라벨 + 인풋 + 에러 메시지) |

---

## 6. 핵심 설정 파일 명세

### 6-1. `astro.config.mjs`

```javascript
// 주요 설정 항목
{
  site: 'https://utongstart.co.kr',
  output: 'hybrid',                          // 정적 + 서버 혼합 모드
  adapter: cloudflare({                       // Cloudflare 어댑터
    platformProxy: { enabled: true }          // 로컬 개발 시 D1 프록시
  }),
  integrations: [
    tailwind(),                               // Tailwind CSS
    react(),                                  // React (Islands용)
    sitemap({                                 // 사이트맵 자동 생성
      filter: (page) => !page.includes('/api/')
    }),
    mdx(),                                    // MDX 지원 (블로그/사례)
  ],
  image: {
    domains: ['utongstart.co.kr'],
    service: { entrypoint: 'astro/assets/services/sharp' }
  },
  vite: {
    ssr: { external: ['node:buffer'] }
  }
}
```

### 6-2. `wrangler.toml`

```toml
# 주요 설정 항목
name = "utongstart-web"
compatibility_date = "2026-02-01"

[[d1_databases]]
binding = "D1_DATABASE"
database_name = "utongstart-db"
database_id = "<Cloudflare Dashboard에서 생성 후 입력>"

# [vars]
# NOTIFICATION_EMAIL = "상담알림수신이메일"
```

### 6-3. `tailwind.config.mjs`

```javascript
// 주요 커스텀 설정
{
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EFF6FF',    // 가장 밝은 네이비
          500: '#1E3A5F',    // 메인 네이비
          900: '#0A1628',    // 가장 어두운 네이비
        },
        accent: {
          400: '#FF7A59',    // 코랄 (CTA 버튼)
          500: '#FF5733',    // 메인 코랄
          600: '#E04E2D',    // 호버 코랄
        },
        neutral: {
          50:  '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          900: '#171717',
        }
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        'hero': ['3.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'section': ['2.25rem', { lineHeight: '1.3', fontWeight: '700' }],
      },
      maxWidth: {
        'content': '1200px',
      }
    }
  }
}
```

---

## 7. 페이지별 렌더링 전략

| 페이지 | 렌더링 방식 | 근거 |
|---|---|---|
| `/` (홈) | Static (SSG) | 콘텐츠 변경 빈도 낮음, 최대 성능 필요 |
| `/services/*` | Static (SSG) | 서비스 소개는 정적 콘텐츠 |
| `/pricing` | Static (SSG) | 가격 변경 시 재빌드로 충분 |
| `/cases/` (목록) | Static (SSG) | 빌드 시 MDX에서 생성 |
| `/cases/[slug]` | Static (SSG) | MDX 콘텐츠 기반 정적 생성 |
| `/blog/` (목록) | Static (SSG) | 빌드 시 MDX에서 생성 |
| `/blog/[slug]` | Static (SSG) | MDX 콘텐츠 기반 정적 생성 |
| `/contact` | Static + Island | 페이지 자체는 정적, 폼만 React Island |
| `/api/inquiry` | SSR (Server) | D1 DB 쓰기 필요, 서버사이드 필수 |
| `/api/newsletter` | SSR (Server) | D1 DB 쓰기 필요, 서버사이드 필수 |
| `/about` | Static (SSG) | 정적 콘텐츠 |
| `/404` | Static (SSG) | 에러 페이지 |

Astro의 `hybrid` 모드를 사용하면 기본적으로 모든 페이지가 정적(SSG)으로 빌드되고, `export const prerender = false;`를 선언한 API 라우트만 서버사이드(SSR)로 동작함. 이 구조 덕분에 대부분의 페이지가 Cloudflare CDN 엣지에서 즉시 서빙되어 TTFB(Time to First Byte)가 극도로 빠르고, 폼 제출 같은 동적 기능만 Workers에서 처리됨.

---

## 8. SEO 구현 체크리스트

| 항목 | 구현 위치 | 설명 |
|---|---|---|
| `<title>` 태그 | `SEOHead.astro` | 페이지별 고유 타이틀 |
| `<meta name="description">` | `SEOHead.astro` | 페이지별 고유 설명 |
| Open Graph 태그 | `SEOHead.astro` | `og:title`, `og:description`, `og:image`, `og:url` |
| 정규 URL (canonical) | `SEOHead.astro` | `<link rel="canonical">` |
| `robots.txt` | `public/robots.txt` | 크롤링 허용/차단 규칙 |
| `sitemap.xml` | Astro `@astrojs/sitemap` | 빌드 시 자동 생성 |
| 구조화 데이터 (JSON-LD) | `SEOHead.astro` | Organization, Service, FAQ 스키마 |
| `<html lang="ko">` | `BaseLayout.astro` | 한국어 언어 선언 |
| 이미지 alt 속성 | 모든 `<img>` | 모든 이미지에 의미 있는 alt 텍스트 |
| Pretendard 폰트 | `fonts.css` | 한글 최적화 웹폰트 |
| 네이버 서치어드바이저 | `public/naver-site-verification.html` | 사이트 소유 인증 |
| 구글 서치콘솔 | `SEOHead.astro` 메타 태그 | 사이트 소유 인증 |

---

## 9. 개발 워크플로우

### 9-1. 로컬 개발

```
1. git clone → npm install
2. wrangler d1 create utongstart-db (최초 1회)
3. wrangler d1 execute utongstart-db --local --file=src/lib/db/migrations/0001_create_inquiries.sql
4. npm run dev (Astro dev server + Cloudflare local runtime)
5. localhost:4321 에서 확인
```

### 9-2. 배포 파이프라인

```
feature/* 브랜치에서 개발
    ↓ PR 생성
staging 브랜치로 머지
    ↓ Cloudflare Pages 자동 빌드
    ↓ Preview URL 생성 (staging.utongstart.pages.dev)
    ↓ 검수
main 브랜치로 머지
    ↓ Cloudflare Pages 자동 빌드
    ↓ Production 배포 (utongstart.co.kr)
```

### 9-3. 도메인 연결

```
1. Cloudflare Dashboard → DNS → utongstart.co.kr 추가
2. Pages → Custom domains → utongstart.co.kr 연결
3. SSL/TLS → Full (Strict) 설정
4. 자동 HTTPS 리디렉트 활성화
```

---

## 10. 우선순위 기반 개발 로드맵

**Phase 1 (MVP, 2~3주)**
메인페이지 + 3개 서비스 상세 페이지 + 상담 신청 폼 + 요금 안내 페이지. 이것만으로 사이트 오픈 가능. 가장 중요한 전환 퍼널(서비스 확인 → 상담 신청)이 완성됨.

**Phase 2 (확장, 2주)**
성공사례 페이지 + 블로그 시스템 + 회사 소개 페이지. SEO 콘텐츠 유입 채널이 확보됨.

**Phase 3 (최적화, 1~2주)**
카카오톡 채널 연동 + 뉴스레터 구독 + GA4/Cloudflare Analytics 대시보드 세팅 + 구조화 데이터(JSON-LD) 완성.

**Phase 4 (고도화, 이후)**
관리자 대시보드(상담 관리, 상태 변경) + 소싱스타트 연계 링크/API + A/B 테스트 프레임워크.

---

디자인가이트 참조

KRDS 타이포그래피 데이터를 완벽하게 확보함. 이제 종합하여 디자인 가이드를 작성하겠음.

---

# 유통스타트 디자인 가이드 (Design Guide)

**문서 버전:** v1.0
**작성일:** 2026-02-28
**프로젝트:** utongstart.co.kr
**타겟 사용자:** 제조사 대표 및 실무자 (주 연령대 40~50대)

---

## 1. 디자인 철학

### 1-1. 핵심 키워드 3가지

**신뢰(Trust):** 유통스타트의 본질은 "유통 경험을 제대로 설계해주는 파트너"임. 과장된 시각 효과보다 정돈된 레이아웃, 명확한 정보 구조, 안정감 있는 컬러가 우선임. 제조사 대표가 처음 사이트에 들어왔을 때 "이 회사는 진지하고 믿을 수 있겠다"는 인상이 3초 안에 형성되어야 함.

**명료(Clarity):** 40~50대 제조사 대표는 화려한 애니메이션이나 트렌디한 레이아웃보다, "이 회사가 뭘 해주는 건지" 빠르게 파악할 수 있는 정보 전달력을 원함. 텍스트 가독성, 시각적 위계, 여백의 충분한 활용이 핵심임.

**행동(Action):** 모든 페이지의 최종 목적은 "무료 상담 신청"이라는 전환(Conversion)임. CTA(Call to Action)는 시각적으로 눈에 띄면서도 자연스럽게 배치되어야 함. 매 스크롤 섹션마다 다음 행동을 유도하는 흐름이 설계되어야 함.

### 1-2. 디자인 원칙

첫째, 가독성 최우선. 본문 폰트는 17px 이상, 줄 간격 150% 이상을 유지함. KRDS(대한민국 정부 디자인 시스템) 타이포그래피 기준을 참고하되, 상업 서비스에 맞게 시각적 임팩트를 더함.

둘째, 60-30-10 컬러 룰. 전체 화면의 60%는 배경색(화이트/라이트그레이), 30%는 주조색(네이비), 10%는 강조색(코랄)으로 구성함. 이 비율을 지키면 시각적 피로 없이 CTA가 자연스럽게 돋보임.

셋째, 모바일 퍼스트. 제조사 대표는 이동 중 모바일로 사이트를 처음 접할 가능성이 높음. 모든 컴포넌트는 모바일에서 먼저 설계하고, 데스크톱으로 확장하는 방식으로 진행함.

넷째, 콘텐츠 중심. 장식적 요소를 최소화하고, 텍스트와 데이터가 주인공이 되는 레이아웃을 지향함. 이미지는 실제 서비스 관련 사진(라이브방송 현장, 와디즈 펀딩 화면 등)만 사용하고, 의미 없는 스톡 이미지 사용을 지양함.

---

## 2. 컬러 시스템

### 2-1. 브랜드 컬러

**Primary (네이비 계열) — 신뢰, 전문성**

| 토큰명 | HEX | RGB | 용도 |
|---|---|---|---|
| `primary-950` | `#0A1628` | 10, 22, 40 | 최상단 헤더 배경, 푸터 배경 |
| `primary-900` | `#0F2342` | 15, 35, 66 | 다크 섹션 배경 |
| `primary-800` | `#152E54` | 21, 46, 84 | 호버 상태 다크 |
| `primary-700` | `#1B3A66` | 27, 58, 102 | 서브 네비게이션 |
| `primary-600` | `#234B82` | 35, 75, 130 | 링크 텍스트 |
| `primary-500` | `#1E3A5F` | 30, 58, 95 | **메인 브랜드 컬러** |
| `primary-400` | `#3D6491` | 61, 100, 145 | 세컨더리 버튼 |
| `primary-300` | `#6B8EB5` | 107, 142, 181 | 비활성 요소 |
| `primary-200` | `#A3BDD6` | 163, 189, 214 | 보더, 디바이더 |
| `primary-100` | `#D1DEE9` | 209, 222, 233 | 라이트 배경 |
| `primary-50` | `#EFF4F9` | 239, 244, 249 | 카드 배경, 섹션 배경 |

**Accent (코랄 계열) — 활력, 행동 유도**

| 토큰명 | HEX | RGB | 용도 |
|---|---|---|---|
| `accent-700` | `#C43D22` | 196, 61, 34 | 액티브/클릭 상태 |
| `accent-600` | `#E04E2D` | 224, 78, 45 | 호버 상태 |
| `accent-500` | `#FF5733` | 255, 87, 51 | **메인 CTA 버튼** |
| `accent-400` | `#FF7A59` | 255, 122, 89 | 보조 강조, 뱃지 |
| `accent-300` | `#FFA48A` | 255, 164, 138 | 라이트 강조 |
| `accent-200` | `#FFCABC` | 255, 202, 188 | 연한 배경 강조 |
| `accent-100` | `#FFF0EC` | 255, 240, 236 | 하이라이트 배경 |

**Neutral (그레이 계열) — 본문, 배경, 보더**

| 토큰명 | HEX | RGB | 용도 |
|---|---|---|---|
| `neutral-900` | `#171717` | 23, 23, 23 | 본문 텍스트 (메인) |
| `neutral-800` | `#2E2E2E` | 46, 46, 46 | 서브 헤딩 텍스트 |
| `neutral-700` | `#525252` | 82, 82, 82 | 보조 텍스트 |
| `neutral-600` | `#6B6B6B` | 107, 107, 107 | 캡션, 플레이스홀더 |
| `neutral-500` | `#8A8A8A` | 138, 138, 138 | 비활성 텍스트 |
| `neutral-400` | `#ABABAB` | 171, 171, 171 | 디바이더 라인 |
| `neutral-300` | `#D4D4D4` | 212, 212, 212 | 보더 |
| `neutral-200` | `#E5E5E5` | 229, 229, 229 | 연한 보더 |
| `neutral-100` | `#F5F5F5` | 245, 245, 245 | 섹션 배경 (교차) |
| `neutral-50` | `#FAFAFA` | 250, 250, 250 | 카드 배경 |
| `neutral-0` | `#FFFFFF` | 255, 255, 255 | 기본 배경 |

**System (시스템 피드백 컬러)**

| 토큰명 | HEX | 용도 |
|---|---|---|
| `success` | `#10B981` | 성공 메시지, 완료 상태 |
| `warning` | `#F59E0B` | 경고, 주의 |
| `error` | `#EF4444` | 에러, 실패 |
| `info` | `#3B82F6` | 정보, 안내 |

### 2-2. 컬러 적용 규칙

**배경 교차 패턴:** 페이지를 스크롤할 때 섹션별로 배경색을 교차 적용하여 시각적 리듬감을 생성함. 패턴은 `neutral-0`(화이트) → `neutral-100`(라이트그레이) → `neutral-0` → `primary-50`(라이트블루) → `neutral-0` 순으로 반복함. 다크 섹션(`primary-900`)은 중간 강조 포인트로 1~2회만 사용함.

**텍스트-배경 대비:** 흰색 배경에서 본문 텍스트는 반드시 `neutral-900`(#171717)을 사용하여 WCAG AA 등급(4.5:1) 이상의 대비율을 확보함. 다크 배경(`primary-900`)에서 텍스트는 `neutral-0`(#FFFFFF)을 사용함.

**CTA 버튼:** 전체 페이지에서 `accent-500`(코랄)이 사용되는 곳은 CTA 버튼과 핵심 강조 포인트에 한정함. 남용하면 시각적 피로와 행동 유도력 저하가 발생하므로 한 화면(뷰포트)에 코랄 포인트는 최대 2개로 제한함.

---

## 3. 타이포그래피

### 3-1. 서체 선정

**주 서체: Pretendard**

Pretendard를 선택한 근거는 다음과 같음. 대한민국 정부 디자인 시스템(KRDS)이 Pretendard GOV를 공식 서체로 채택하여 공공 영역에서의 신뢰도가 검증됨. 한글·영문·숫자 가독성이 뛰어나고 9가지 굵기(Thin~Black)를 지원함. 가변 폰트(Variable Font)를 지원하여 하나의 파일로 모든 굵기를 커버할 수 있어 웹 성능에 유리함. SIL 오픈 폰트 라이선스로 상업적 사용에 제한이 없음.

**폰트 스택 (CSS font-family)**

```
font-family: 'Pretendard Variable', Pretendard, -apple-system,
             BlinkMacSystemFont, system-ui, Roboto, 'Helvetica Neue',
             'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR',
             'Malgun Gothic', 'Apple Color Emoji', 'Segoe UI Emoji',
             'Segoe UI Symbol', sans-serif;
```

### 3-2. 타이포그래피 스케일

KRDS 기준을 참고하되, 유통스타트의 마케팅 사이트 특성에 맞게 Display 계층을 확장하고, 모바일 사이즈를 조정함.

**Display (히어로, 배너용)**

| 토큰명 | PC 사이즈 | Mobile 사이즈 | Weight | Line Height | Letter Spacing | 용도 |
|---|---|---|---|---|---|---|
| `display-lg` | 56px / 3.5rem | 36px / 2.25rem | 700 | 120% | -0.5px | 메인 히어로 타이틀 |
| `display-md` | 44px / 2.75rem | 30px / 1.875rem | 700 | 130% | -0.3px | 서브 히어로, 섹션 메인 타이틀 |
| `display-sm` | 36px / 2.25rem | 26px / 1.625rem | 700 | 140% | 0px | 서비스 페이지 히어로 |

**Heading (페이지/섹션 제목)**

| 토큰명 | PC 사이즈 | Mobile 사이즈 | Weight | Line Height | Letter Spacing | 용도 |
|---|---|---|---|---|---|---|
| `heading-xl` | 36px / 2.25rem | 26px / 1.625rem | 700 | 140% | 0px | 섹션 대제목 (h1) |
| `heading-lg` | 30px / 1.875rem | 24px / 1.5rem | 700 | 140% | 0px | 섹션 중제목 (h2) |
| `heading-md` | 24px / 1.5rem | 20px / 1.25rem | 700 | 150% | 0px | 카드 제목, 소제목 (h3) |
| `heading-sm` | 20px / 1.25rem | 18px / 1.125rem | 700 | 150% | 0px | 소제목 (h4) |
| `heading-xs` | 17px / 1.0625rem | 17px / 1.0625rem | 700 | 150% | 0px | 라벨형 제목 (h5) |

**Body (본문, 설명)**

| 토큰명 | PC 사이즈 | Mobile 사이즈 | Weight | Line Height | Letter Spacing | 용도 |
|---|---|---|---|---|---|---|
| `body-lg` | 19px / 1.1875rem | 18px / 1.125rem | 400 | 170% | 0px | 서머리, 리드 텍스트 |
| `body-lg-bold` | 19px / 1.1875rem | 18px / 1.125rem | 700 | 170% | 0px | 강조 서머리 |
| `body-md` | 17px / 1.0625rem | 16px / 1rem | 400 | 170% | 0px | **기본 본문** |
| `body-md-bold` | 17px / 1.0625rem | 16px / 1rem | 700 | 170% | 0px | 강조 본문 |
| `body-sm` | 15px / 0.9375rem | 14px / 0.875rem | 400 | 160% | 0px | 보조 설명, 캡션 |
| `body-xs` | 13px / 0.8125rem | 13px / 0.8125rem | 400 | 160% | 0px | 주석, 부가 정보 |

**Label (버튼, 입력 필드, 네비게이션)**

| 토큰명 | 사이즈 | Weight | Line Height | 용도 |
|---|---|---|---|---|
| `label-lg` | 17px | 600 | 100% | 대형 버튼 |
| `label-md` | 15px | 600 | 100% | 일반 버튼, 네비게이션 |
| `label-sm` | 13px | 500 | 100% | 작은 버튼, 뱃지 |

### 3-3. 타이포그래피 사용 규칙

본문의 한 줄 최대 글자 수(measure)는 40~45자(한글 기준)로 제한함. 이는 약 680px 너비에 해당하며, 이 범위를 넘으면 시선 이동이 길어져 가독성이 떨어짐. 콘텐츠 영역의 max-width를 720px로 설정하면 자연스럽게 지켜짐.

제목과 본문의 크기 차이는 최소 1.25배를 유지함. heading-md(24px)와 body-md(17px)의 비율은 약 1.41배로, 시각적 위계가 명확하게 구분됨.

굵기(weight)는 400(Regular)과 700(Bold) 두 가지를 주로 사용하고, 500(Medium)과 600(SemiBold)은 Label과 특수 용도에 한정함. KRDS 가이드와 동일하게 최대 4가지 굵기로 제한함.

---

## 4. 레이아웃 그리드 시스템

### 4-1. 그리드 정의

| 브레이크포인트 | 너비 | 컬럼 수 | 거터(Gutter) | 마진(Margin) | 토큰명 |
|---|---|---|---|---|---|
| Mobile | 0~639px | 4 | 16px | 20px | `sm` |
| Tablet | 640~1023px | 8 | 24px | 32px | `md` |
| Desktop | 1024~1279px | 12 | 24px | 40px | `lg` |
| Wide | 1280px~ | 12 | 32px | auto (센터 정렬) | `xl` |

**콘텐츠 최대 너비:** 1200px (Tailwind `max-w-content`)
**와이드 섹션 최대 너비:** 1440px (풀 블리드 배경에서 내부 콘텐츠 제한)

### 4-2. 섹션 간격 (Vertical Rhythm)

| 요소 | PC 간격 | Mobile 간격 | 설명 |
|---|---|---|---|
| 섹션 간 (Section Gap) | 120px | 80px | 메인페이지 각 섹션 사이 |
| 섹션 내 타이틀-콘텐츠 | 48px | 32px | 섹션 제목과 하위 콘텐츠 사이 |
| 카드 간 | 24px | 16px | 그리드 내 카드 사이 |
| 문단 간 (Paragraph) | 24px | 20px | 본문 문단 사이 |
| 컴포넌트 내부 패딩 | 32px~48px | 24px~32px | 카드, 박스 내부 |

---

## 5. 컴포넌트 스타일

### 5-1. 버튼 (Button)

**Primary Button (메인 CTA)**

| 상태 | 배경색 | 텍스트색 | 보더 | 그림자 | 모서리 |
|---|---|---|---|---|---|
| Default | `accent-500` | `neutral-0` | none | `0 2px 8px rgba(255,87,51,0.25)` | 8px |
| Hover | `accent-600` | `neutral-0` | none | `0 4px 12px rgba(255,87,51,0.35)` | 8px |
| Active | `accent-700` | `neutral-0` | none | `0 1px 4px rgba(255,87,51,0.2)` | 8px |
| Disabled | `neutral-300` | `neutral-500` | none | none | 8px |

사이즈: Large(높이 56px, 패딩 20px 32px, `label-lg`), Medium(높이 48px, 패딩 14px 24px, `label-md`), Small(높이 40px, 패딩 10px 20px, `label-sm`)

**Secondary Button (보조)**

| 상태 | 배경색 | 텍스트색 | 보더 | 모서리 |
|---|---|---|---|---|
| Default | `transparent` | `primary-500` | `1px solid primary-500` | 8px |
| Hover | `primary-50` | `primary-500` | `1px solid primary-500` | 8px |
| Active | `primary-100` | `primary-600` | `1px solid primary-600` | 8px |

**Ghost Button (텍스트형)**

배경 없이 텍스트 + 밑줄 또는 텍스트 + 화살표 아이콘 조합. 색상은 `primary-600`. Hover 시 밑줄 표시.

### 5-2. 카드 (Card)

**서비스 카드 (3개 사업영역 소개용)**

| 속성 | 값 |
|---|---|
| 배경 | `neutral-0` |
| 보더 | `1px solid neutral-200` |
| 모서리 | 16px |
| 그림자 (Default) | `0 1px 3px rgba(0,0,0,0.06)` |
| 그림자 (Hover) | `0 8px 24px rgba(0,0,0,0.1)` |
| 내부 패딩 | 32px (PC) / 24px (Mobile) |
| 전환 효과 | `transform: translateY(-4px)` on hover, `transition: 0.3s ease` |

카드 내부 구조: 상단에 아이콘(48x48) → 서비스명(`heading-md`, 700) → 한 줄 설명(`body-md`, 400) → "자세히 보기" 텍스트 링크(`label-md`, `primary-600`)

**요금표 카드 (PricingTable용)**

추천 패키지(highlight=true)는 보더를 `accent-500` 2px로 변경하고, 상단에 "추천" 뱃지를 코랄 배경으로 표시함. 추천 카드는 `transform: scale(1.02)`로 약간 확대하여 시각적 우위를 부여함.

### 5-3. 네비게이션 (Header)

**Desktop GNB**

| 속성 | 값 |
|---|---|
| 높이 | 72px |
| 배경 | `neutral-0` (스크롤 시 `rgba(255,255,255,0.95)` + `backdrop-filter: blur(8px)`) |
| 하단 보더 | `1px solid neutral-200` |
| 로고 영역 | 좌측, 높이 36px |
| 메뉴 항목 | 중앙 정렬, `label-md` (15px, 600), `neutral-800` |
| 메뉴 Hover | `primary-500` + 하단 2px 언더라인 |
| CTA 버튼 | 우측, "무료 상담" Primary Button Small |
| Position | `sticky top-0 z-50` |

**Mobile GNB**

높이 60px. 좌측 로고, 우측 햄버거 아이콘(24x24). 햄버거 클릭 시 전체 화면 오버레이 메뉴(`primary-950` 배경, 화이트 텍스트). 메뉴 항목은 `heading-md`(24px) 크기로 세로 나열. 하단에 "무료 상담 신청" CTA 버튼 배치.

### 5-4. 폼 (Form Input)

| 속성 | 값 |
|---|---|
| 높이 | 52px |
| 배경 | `neutral-0` |
| 보더 (Default) | `1px solid neutral-300` |
| 보더 (Focus) | `2px solid primary-500` |
| 보더 (Error) | `2px solid error` |
| 모서리 | 8px |
| 내부 패딩 | 16px |
| 라벨 | `body-sm` (15px), `neutral-700`, 인풋 위 8px 간격 |
| 플레이스홀더 | `body-md` (17px), `neutral-500` |
| 에러 메시지 | `body-sm` (15px), `error` |

### 5-5. 프로세스 스텝 (4단계 인포그래픽)

가로 배치(Desktop)와 세로 배치(Mobile)를 모두 지원함.

**스텝 아이템 구조:**
원형 넘버링(48x48, `primary-500` 배경, 화이트 숫자 `heading-md`) → 스텝 제목(`heading-sm`, 700) → 스텝 설명(`body-md`, 400) → 기대 성과 뱃지 목록(`label-sm`, `primary-50` 배경, `primary-600` 텍스트)

스텝 간 연결선: Desktop에서는 가로 점선(`primary-200`, dashed 2px), Mobile에서는 세로 실선(`primary-200`, solid 1px)

### 5-6. CTA 배너 (CTABanner)

| 속성 | 값 |
|---|---|
| 배경 | `primary-900` |
| 패딩 | 64px (PC) / 40px (Mobile) |
| 모서리 | 16px (섹션 내 삽입 시) / 0px (풀 블리드 시) |
| 타이틀 | `heading-lg`, 700, `neutral-0` |
| 서브 텍스트 | `body-lg`, 400, `primary-200` |
| 버튼 | Primary Button Large |
| 정렬 | 중앙 정렬 (텍스트 + 버튼) |

### 5-7. FAQ 아코디언

| 속성 | 값 |
|---|---|
| 질문 영역 | `heading-sm` (20px), 700, `neutral-900` |
| 질문 배경 | `neutral-0` |
| 질문 패딩 | 20px 24px |
| 질문 하단 보더 | `1px solid neutral-200` |
| 열림 시 화살표 | 180도 회전, `transition: 0.2s ease` |
| 답변 영역 | `body-md` (17px), 400, `neutral-700` |
| 답변 배경 | `neutral-50` |
| 답변 패딩 | 16px 24px 24px |

---

## 6. 아이콘 시스템

### 6-1. 아이콘 라이브러리

**Lucide Icons** (오픈소스, MIT 라이선스)를 기본 아이콘 세트로 사용함. Astro에서 `astro-icon` 패키지로 통합 가능하고, SVG 기반이라 컬러와 사이즈 커스터마이징이 자유로움.

### 6-2. 아이콘 사이즈 규칙

| 용도 | 사이즈 | 스트로크 너비 |
|---|---|---|
| 네비게이션 메뉴 | 20px | 1.5px |
| 인라인 (텍스트 옆) | 16px~20px | 1.5px |
| 카드/리스트 아이콘 | 24px | 2px |
| 피처 아이콘 (서비스 소개) | 48px | 2px |
| 히어로/대형 장식 | 64px~80px | 2px |

### 6-3. 서비스별 커스텀 아이콘

3개 사업영역은 Lucide 기본 아이콘으로는 차별화가 부족하므로, 커스텀 SVG 일러스트(선형 스타일)를 제작함. 스타일은 네이비(`primary-500`) 선 + 코랄(`accent-400`) 포인트의 2색 조합으로 통일함.

유통스타트: 계단형 상승 화살표 + 박스(유통/배송 상징)
라이브커머스: 재생 버튼 + 카메라 프레임
플레이스 상위노출: 지도 핀 + 상승 그래프

---

## 7. 이미지 가이드

### 7-1. 이미지 포맷 및 사이즈

| 용도 | 포맷 | PC 사이즈 | Mobile 사이즈 | 비율 |
|---|---|---|---|---|
| 히어로 배경 | WebP | 1920x800 | 750x600 | 자유 |
| 서비스 상세 이미지 | WebP | 1200x675 | 750x422 | 16:9 |
| 성공사례 썸네일 | WebP | 600x400 | 375x250 | 3:2 |
| 블로그 썸네일 | WebP | 800x450 | 375x211 | 16:9 |
| Open Graph | PNG | 1200x630 | - | 약 1.91:1 |
| 팀/인물 사진 | WebP | 400x400 | 200x200 | 1:1 (원형 마스크) |

### 7-2. 이미지 톤앤매너

전체적으로 밝고 자연스러운 톤을 유지함. 과도한 색 보정이나 필터 적용을 지양하고, 현장감이 느껴지는 실사 이미지를 선호함. 다크 오버레이가 필요한 경우(히어로 텍스트 가독성 확보 등) `primary-950`에 opacity 60~70%를 적용함.

---

## 8. 간격(Spacing) 토큰

Tailwind CSS의 spacing 스케일을 기반으로 하되, 프로젝트 전용 시멘틱 토큰을 추가 정의함.

| 토큰명 | 값 | 용도 |
|---|---|---|
| `space-xs` | 4px (0.25rem) | 아이콘-텍스트 간격, 뱃지 내부 |
| `space-sm` | 8px (0.5rem) | 인라인 요소 간격 |
| `space-md` | 16px (1rem) | 기본 간격, 폼 필드 간 |
| `space-lg` | 24px (1.5rem) | 카드 내부 패딩, 문단 간격 |
| `space-xl` | 32px (2rem) | 컴포넌트 간 간격 |
| `space-2xl` | 48px (3rem) | 섹션 내 타이틀-콘텐츠 간격 |
| `space-3xl` | 64px (4rem) | 섹션 패딩 (Mobile) |
| `space-4xl` | 80px (5rem) | 섹션 패딩 (Tablet) |
| `space-5xl` | 120px (7.5rem) | 섹션 간격 (Desktop) |

---

## 9. 모션 및 전환 효과

### 9-1. 기본 전환 값

| 용도 | Duration | Easing | 설명 |
|---|---|---|---|
| 버튼 호버 | 0.2s | `ease-in-out` | 배경색, 그림자 변화 |
| 카드 호버 | 0.3s | `ease` | Y축 이동 + 그림자 확대 |
| 메뉴 전환 | 0.3s | `ease-in-out` | 모바일 메뉴 슬라이드 |
| 아코디언 열기/닫기 | 0.25s | `ease` | 높이 변화 + 화살표 회전 |
| 페이지 스크롤 등장 | 0.5s | `ease-out` | 스크롤 시 요소 페이드인 |

### 9-2. 스크롤 등장 애니메이션

모든 섹션의 주요 요소는 뷰포트 진입 시 아래에서 위로 16px 이동하며 페이드인됨. 과도한 애니메이션은 배제하고, 이 하나의 패턴만 일관되게 적용함. `Intersection Observer API`로 구현하며, `prefers-reduced-motion: reduce` 미디어 쿼리를 존중하여 모션 감소 설정 사용자에게는 즉시 표시함.

---

## 10. 반응형 디자인 규칙

### 10-1. 브레이크포인트별 레이아웃 변환

**서비스 카드 (3개 사업영역)**

Desktop(lg~): 3컬럼 가로 배치 (각 4/12 컬럼)
Tablet(md): 1컬럼 세로 배치 (카드 내부를 가로형으로 변환: 좌측 아이콘+제목, 우측 설명)
Mobile(sm): 1컬럼 세로 스택

**요금표 카드**

Desktop: 3컬럼 가로 배치, 추천 카드 확대
Tablet: 가로 스크롤 (snap scroll)
Mobile: 1컬럼 세로 스택, 추천 카드에 "추천" 배너 상단 표시

**4단계 프로세스**

Desktop: 가로 4스텝 + 연결선
Tablet: 2x2 그리드
Mobile: 세로 타임라인

### 10-2. 터치 타겟

모바일에서 모든 인터랙티브 요소(버튼, 링크, 폼 필드)의 최소 터치 영역은 48x48px을 보장함. 이는 WCAG 2.2 Level AA 기준(최소 24x24, 권장 44x44)을 초과하는 수준으로, 제조사 대표 연령대를 고려한 설정임.

---

## 11. 페이지별 와이어프레임 구조

### 11-1. 메인페이지 (index.astro)

```
┌─────────────────────────────────────────────┐
│  [Header]  로고  |  메뉴  |  무료 상담      │  sticky, 72px
├─────────────────────────────────────────────┤
│                                             │
│  [HeroSection]                              │  배경: primary-900 + 오버레이 이미지
│  "유통, 처음 시작이 전부입니다"                │  display-lg, white
│  서브카피 (body-lg, primary-200)              │
│  [ 무료 유통 진단 받기 ] CTA Large             │  accent-500
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  [PainPointSection]                         │  배경: neutral-0
│  "이런 경험, 혹시 겪고 계신가요?"              │  heading-xl, 중앙정렬
│                                             │
│  ┌──────┐  ┌──────┐  ┌──────┐               │  3컬럼 카드
│  │광고비만│  │가격무너│  │유통사고│               │  아이콘 + 제목 + 설명
│  │쓰고   │  │뜨림   │  │스트레스│               │
│  └──────┘  └──────┘  └──────┘               │
│                                             │
│  → "유통스타트가 다릅니다" 전환 메시지          │  heading-md, accent-500
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  [ServiceCards]                             │  배경: neutral-100
│  "3가지 사업으로 유통을 완성합니다"            │  heading-xl
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ 유통스타트 │ │라이브커머스│ │플레이스    │     │  서비스 카드 x3
│  │           │ │          │ │상위노출    │     │
│  └──────────┘ └──────────┘ └──────────┘     │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  [ProcessFlow]                              │  배경: neutral-0
│  "유통 경험 4단계 프로세스"                    │  heading-xl
│                                             │
│  ① 와디즈 ──→ ② 라이브 ──→ ③ 공동구매 ──→ ④ 폐쇄몰  │  가로 스텝
│                                             │
│  "이 과정을 마치면,                           │  body-lg, 강조 블록
│   직접 유통 채널을 발굴하는 내공이 생깁니다"     │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  [StatsCounter]                             │  배경: primary-50
│  누적 지원 제조사 | 평균 펀딩 달성률 | 연계 유통사  │  heading-xl 숫자 카운터
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  [CaseHighlight]                            │  배경: neutral-0
│  "성공사례" heading-xl                       │
│  카드 3장 (가장 최신/대표)                     │
│  [ 더 많은 사례 보기 ] Secondary Button        │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  [CTABanner]                                │  배경: primary-900
│  "지금 무료 유통 진단을 받아보세요"             │  heading-lg, white
│  [ 무료 상담 신청 ] CTA Large                  │
│  카카오톡으로 상담하기 Ghost Button             │
│                                             │
├─────────────────────────────────────────────┤
│  [Footer]                                   │  배경: primary-950
│  로고 | 메뉴 링크 | 소싱스타트 연결           │
│  연락처 | 사업자정보 | SNS 링크               │
│  ⓒ 2026 유통스타트                           │
└─────────────────────────────────────────────┘
```

### 11-2. 서비스 상세 페이지 (유통스타트)

```
┌─────────────────────────────────────────────┐
│  [ServiceHero]                              │  배경: primary-50
│  뱃지: "유통 경험 프로그램"                    │  label-sm, primary 뱃지
│  "올바른 유통 경험이                          │  display-sm
│   제조사의 미래를 바꿉니다"                    │
│  서브 설명 (body-lg)                         │
│  [ 무료 상담 신청 ] CTA                       │
├─────────────────────────────────────────────┤
│                                             │
│  [스토리텔링 섹션]                            │  배경: neutral-0
│  "많은 신제품이 광고대행사 말만 듣고..."        │  heading-lg + body-lg
│  Pain Point 강조 블록 (accent-100 배경)       │
│  → 전환: "유통스타트는 다릅니다"               │
│  → 3가지 역량 획득 안내                       │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  [4단계 상세]                                │  배경: neutral-100
│  STEP 1~4 각각 상세 설명                      │  StepCard 컴포넌트 x4
│  각 스텝: 번호 + 제목 + 설명 + 기대성과 + 기간 │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  [수료 후 가치]                               │  배경: primary-900 (다크)
│  "프로그램을 마치면 얻는 3가지"                │  heading-lg, white
│  ① 유통채널 발굴 능력                         │  아이콘 + 텍스트 3컬럼
│  ② 유통사 구별 안목                           │
│  ③ 유통사고 방지 내공                         │
│                                             │
├─────────────────────────────────────────────┤
│  [PricingTable]  베이직 | 스탠다드 | 프리미엄   │  요금표 카드 3장
├─────────────────────────────────────────────┤
│  [FAQAccordion]  자주 묻는 질문                │
├─────────────────────────────────────────────┤
│  [CTABanner]  하단 CTA                       │
└─────────────────────────────────────────────┘
```

### 11-3. 요금 안내 페이지 (pricing.astro)

```
┌─────────────────────────────────────────────┐
│  [PageHero]                                 │  배경: primary-50
│  "제조사 상황에 맞는 최적의 패키지"             │  display-sm
├─────────────────────────────────────────────┤
│                                             │
│  [탭 네비게이션]                              │  배경: neutral-0
│  [ 유통스타트 ] [ 라이브커머스 ] [ 플레이스 ]    │  탭 선택 시 underline
│                                             │
│  [PricingTable]                             │  선택된 탭의 패키지 3장
│  베이직 | 스탠다드(추천) | 프리미엄            │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  [통합 패키지 안내]                           │  배경: accent-100
│  "3개 서비스를 한 번에? 올인원 패키지"          │  heading-lg
│  통합 패키지 설명 + 가격 + CTA                 │
│                                             │
├─────────────────────────────────────────────┤
│  [ComparisonTable]                          │  개별 vs 패키지 비용 비교
├─────────────────────────────────────────────┤
│  [FAQAccordion]  요금 관련 FAQ                │
├─────────────────────────────────────────────┤
│  [CTABanner]                                │
└─────────────────────────────────────────────┘
```

---

## 12. 접근성(Accessibility) 기준

| 항목 | 기준 | 구현 방법 |
|---|---|---|
| 색상 대비 | WCAG AA (4.5:1) 이상 | 모든 텍스트-배경 조합 대비율 검증 |
| 키보드 내비게이션 | 모든 인터랙티브 요소 Tab 접근 가능 | `tabindex`, `:focus-visible` 스타일 |
| Focus 인디케이터 | `2px solid primary-500`, `offset 2px` | 커스텀 focus ring |
| 이미지 대체 텍스트 | 모든 이미지에 의미 있는 alt | `<img alt="설명">` |
| 시멘틱 HTML | 올바른 heading 계층, landmark role | `<main>`, `<nav>`, `<section>`, `<article>` |
| 모션 감소 | `prefers-reduced-motion` 대응 | 애니메이션 비활성화 |
| 터치 타겟 | 최소 48x48px | 모바일 버튼/링크 최소 사이즈 |

---

## 13. Tailwind CSS 디자인 토큰 매핑

구현 명세서의 `tailwind.config.mjs`에 들어갈 최종 커스텀 설정을 디자인 가이드와 정확히 매핑함.

```javascript
// tailwind.config.mjs 커스텀 테마 (디자인 가이드 기준)
{
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EFF4F9',
          100: '#D1DEE9',
          200: '#A3BDD6',
          300: '#6B8EB5',
          400: '#3D6491',
          500: '#1E3A5F',   // 메인 브랜드
          600: '#234B82',
          700: '#1B3A66',
          800: '#152E54',
          900: '#0F2342',
          950: '#0A1628',
        },
        accent: {
          100: '#FFF0EC',
          200: '#FFCABC',
          300: '#FFA48A',
          400: '#FF7A59',
          500: '#FF5733',   // 메인 CTA
          600: '#E04E2D',
          700: '#C43D22',
        },
        neutral: {
          0:   '#FFFFFF',
          50:  '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#ABABAB',
          500: '#8A8A8A',
          600: '#6B6B6B',
          700: '#525252',
          800: '#2E2E2E',
          900: '#171717',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error:   '#EF4444',
        info:    '#3B82F6',
      },
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        'display-lg': ['3.5rem',   { lineHeight: '1.2',  fontWeight: '700', letterSpacing: '-0.5px' }],
        'display-md': ['2.75rem',  { lineHeight: '1.3',  fontWeight: '700', letterSpacing: '-0.3px' }],
        'display-sm': ['2.25rem',  { lineHeight: '1.4',  fontWeight: '700' }],
        'heading-xl': ['2.25rem',  { lineHeight: '1.4',  fontWeight: '700' }],
        'heading-lg': ['1.875rem', { lineHeight: '1.4',  fontWeight: '700' }],
        'heading-md': ['1.5rem',   { lineHeight: '1.5',  fontWeight: '700' }],
        'heading-sm': ['1.25rem',  { lineHeight: '1.5',  fontWeight: '700' }],
        'heading-xs': ['1.0625rem',{ lineHeight: '1.5',  fontWeight: '700' }],
        'body-lg':    ['1.1875rem',{ lineHeight: '1.7',  fontWeight: '400' }],
        'body-md':    ['1.0625rem',{ lineHeight: '1.7',  fontWeight: '400' }],
        'body-sm':    ['0.9375rem',{ lineHeight: '1.6',  fontWeight: '400' }],
        'body-xs':    ['0.8125rem',{ lineHeight: '1.6',  fontWeight: '400' }],
        'label-lg':   ['1.0625rem',{ lineHeight: '1',    fontWeight: '600' }],
        'label-md':   ['0.9375rem',{ lineHeight: '1',    fontWeight: '600' }],
        'label-sm':   ['0.8125rem',{ lineHeight: '1',    fontWeight: '500' }],
      },
      maxWidth: {
        'content': '1200px',
        'wide':    '1440px',
        'prose':   '720px',
      },
      borderRadius: {
        'card': '16px',
        'button': '8px',
        'input': '8px',
        'badge': '20px',
      },
      boxShadow: {
        'card':       '0 1px 3px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.1)',
        'cta':        '0 2px 8px rgba(255,87,51,0.25)',
        'cta-hover':  '0 4px 12px rgba(255,87,51,0.35)',
      },
      spacing: {
        '18': '4.5rem',
        '30': '7.5rem',
      },
    }
  }
}
```

---

## 14. 디자인 파일 산출물 체크리스트

디자인 가이드를 기반으로 실제 디자인 작업 시 산출해야 할 파일 목록임.

| 산출물 | 도구 | 설명 |
|---|---|---|
| Figma 디자인 시스템 라이브러리 | Figma | 컬러, 타이포, 컴포넌트 토큰 정의 |
| 메인페이지 Desktop 시안 | Figma | 1440px 기준 |
| 메인페이지 Mobile 시안 | Figma | 375px 기준 |
| 서비스 상세 x3 Desktop/Mobile | Figma | 유통스타트, 라이브커머스, 플레이스 |
| 요금 안내 Desktop/Mobile | Figma | 탭 UI 포함 |
| 상담 신청 Desktop/Mobile | Figma | 폼 상태별 (기본, 포커스, 에러, 성공) |
| 로고 파일 | AI/SVG | 풀 로고, 아이콘, 화이트 버전 |
| 서비스 아이콘 x3 | SVG | 2색(네이비+코랄) 커스텀 아이콘 |
| Open Graph 이미지 | PNG 1200x630 | SNS 공유 시 미리보기 |
| Favicon 세트 | ICO, PNG | 16x16, 32x32, 180x180 (Apple Touch) |

---

이 디자인 가이드를 기반으로 Figma 시안 작업 또는 바로 Tailwind CSS 코드 구현이 가능함. 구현 명세서의 파일 구조와 1:1로 매핑되어 있으므로 디자이너-개발자 간 커뮤니케이션 비용이 최소화됨. 다음 단계로 특정 페이지의 상세 와이어프레임 확대, 또는 실제 Figma 시안 방향 검토가 필요하면 진행 가능함.

프롬프트 작성 원칙을 확인함. 이제 디자인 가이드에 명시된 모든 필수 이미지에 대한 순차적 프롬프트 세트를 작성하겠음.

---

# 유통스타트 필수 이미지 생성 프롬프트 세트

**대상 도구:** DALL-E 3 / Midjourney / GPT Image Generation
**브랜드 컬러 기준:** Navy #1E3A5F, Coral #FF5733, White #FFFFFF, Light Gray #F5F5F5
**일관성 유지 키워드(모든 프롬프트 공통):** clean, professional, modern, minimal, Korean B2B service

---

## 프롬프트 사용 가이드

아래 프롬프트는 총 19개이며, 4개 카테고리(로고/아이콘, 히어로/배너, 서비스 일러스트, OG/기타)로 분류됨. 각 프롬프트를 순서대로 하나씩 입력하여 생성하면 됨. 프롬프트 내의 `--ar` 파라미터는 Midjourney용이며, DALL-E 사용 시 해당 비율에 맞는 사이즈를 직접 지정하면 됨.

---

## 카테고리 A: 로고 및 브랜드 아이콘 (4개)

### A-1. 메인 로고 (logo-full.svg 원본용)

```
Design a clean, modern logo for "유통스타트" (UtongStart), a Korean B2B distribution consulting company. The logo should combine the Korean text "유통스타트" with a minimal icon that represents distribution/logistics growth. Use navy blue (#1E3A5F) as the primary color with a coral (#FF5733) accent on a key element. The icon should suggest upward movement and connected pathways, representing step-by-step distribution channel expansion. Style: flat vector, no gradients, suitable for SVG conversion. White background. Professional and trustworthy feeling, not playful. --ar 3:1
```

### A-2. 로고 아이콘 (logo-icon.svg 원본용)

```
Design a minimal icon mark extracted from the "유통스타트" brand logo. The icon should be a simple geometric symbol combining an upward arrow with connected nodes or steps, representing distribution channel growth. Colors: navy blue (#1E3A5F) body with coral (#FF5733) arrow tip or accent point. Flat vector style, no gradients, no text. Must work clearly at 32x32px size. Square format, white background. Clean, professional, B2B aesthetic. --ar 1:1
```

### A-3. 흰색 로고 버전 (logo-white.svg 원본용)

```
Design the same "유통스타트" logo from prompt A-1, but in an all-white (#FFFFFF) colorway suitable for placement on dark navy (#0A1628) backgrounds. The icon accent that was coral should now be a slightly lighter white or very subtle light gray (#D1DEE9) to maintain visual hierarchy. Flat vector, no gradients. Dark navy background for preview. --ar 3:1
```

### A-4. Favicon 원본

```
Design a minimal favicon icon for "유통스타트" brand. A single bold geometric mark: a stylized upward-pointing arrow merged with the Korean character "유" in an abstract way. Navy blue (#1E3A5F) shape with coral (#FF5733) small accent. Must be extremely recognizable at 16x16 pixels. Flat design, no gradients, no fine details. Square format, white background. --ar 1:1
```

---

## 카테고리 B: 히어로 및 배너 이미지 (4개)

### B-1. 메인 히어로 이미지 — Desktop (hero-main.webp)

```
Professional wide-angle photograph of a modern Korean manufacturing company's products being prepared for distribution. The scene shows neatly arranged consumer products (cosmetics, food packages, electronics accessories) on a clean white table, with a laptop showing sales dashboard graphs in the background. Soft natural lighting from the left. Shallow depth of field focusing on the products in the foreground. Color tone: cool and professional with warm highlights. The overall mood should convey "the exciting beginning of distribution." No people's faces visible, only hands arranging products if needed. Horizontal composition, cinematic feel. --ar 12:5
```

### B-2. 메인 히어로 이미지 — Mobile (hero-mobile.webp)

```
Vertical composition version of a modern Korean manufacturing products display. Close-up of diverse consumer products (beauty, food, tech accessories) arranged artistically on a clean surface. A tablet device showing an e-commerce dashboard partially visible in the background, slightly blurred. Warm yet professional lighting. Color palette leans toward navy blue and white tones with subtle warm coral accent lighting. No text overlay. Portrait orientation, suitable for mobile hero section. --ar 5:8
```

### B-3. 유통스타트 서비스 히어로 (services/utongstart 페이지용)

```
Abstract conceptual photograph representing a step-by-step journey of product distribution. Four distinct stages visualized from left to right: (1) a single product box, (2) a live streaming setup with ring light, (3) smartphone screens showing social media, (4) a corporate building entrance. Connected by a subtle flowing navy blue (#1E3A5F) line or ribbon. Clean, minimal styling on a light gray (#F5F5F5) background. Professional commercial photography style with soft shadows. No people. Wide horizontal format. --ar 16:9
```

### B-4. CTA 배너 배경 (다크 섹션용 텍스처)

```
Abstract dark background texture for website CTA banner section. Deep navy blue (#0A1628 to #0F2342) gradient base with subtle geometric pattern overlay — thin diagonal lines or hexagonal grid at 5% opacity. A very subtle coral (#FF5733) light glow coming from the bottom right corner at 10% opacity, creating depth without distraction. Must work as a background behind white text. No objects, no illustrations, purely atmospheric. Seamless, tileable preferred. --ar 16:5
```

---

## 카테고리 C: 서비스 아이콘 및 일러스트 (8개)

### C-1. 유통스타트 서비스 아이콘 (utongstart-icon.svg)

```
Flat vector line icon representing "distribution experience program." A stylized staircase made of 4 ascending steps, with a small package/box icon on the top step and an upward arrow. Primary color: navy blue (#1E3A5F) with coral (#FF5733) accent on the arrow and top step. Line weight: 2px consistent stroke. No fills, only outlined/linear style. White background. Clean, minimal, professional. Suitable for 48x48px to 80px display. --ar 1:1
```

### C-2. 라이브커머스 서비스 아이콘 (live-commerce-icon.svg)

```
Flat vector line icon representing "live commerce broadcasting service." A camera/video frame outline with a play button (triangle) in the center and a small signal/broadcast wave emanating from the top right. Primary color: navy blue (#1E3A5F) with coral (#FF5733) accent on the play button triangle and signal waves. Line weight: 2px consistent stroke. No fills, only outlined/linear style. White background. Clean, minimal, professional. Suitable for 48x48px to 80px display. --ar 1:1
```

### C-3. 플레이스 상위노출 서비스 아이콘 (place-seo-icon.svg)

```
Flat vector line icon representing "Naver Place top ranking SEO service." A map location pin with a small upward trending graph/chart line inside or beside the pin. Primary color: navy blue (#1E3A5F) with coral (#FF5733) accent on the graph's upward portion and the pin's center dot. Line weight: 2px consistent stroke. No fills, only outlined/linear style. White background. Clean, minimal, professional. Suitable for 48x48px to 80px display. --ar 1:1
```

### C-4. STEP 1 일러스트 — 와디즈 런칭 (step-wadiz.webp)

```
Isometric or flat illustration representing crowdfunding product launch. A stylized laptop screen showing a product funding page with a progress bar at 80%. Beside it, a magnifying glass hovering over market data charts, and a product package with a "NEW" tag. Color palette: navy blue (#1E3A5F) for main elements, coral (#FF5733) for the progress bar and "NEW" tag, light gray (#F5F5F5) background. Clean vector illustration style, no photorealism. Friendly yet professional. No text except symbolic elements. --ar 4:3
```

### C-5. STEP 2 일러스트 — 라이브방송 (step-live.webp)

```
Isometric or flat illustration representing live commerce broadcasting. A smartphone propped up on a small tripod with a ring light beside it, showing a product being showcased on screen. Small floating UI elements: heart icons, comment bubbles, and a viewer count badge. Color palette: navy blue (#1E3A5F) for devices and UI frames, coral (#FF5733) for hearts, live badge, and interactive elements, light gray (#F5F5F5) background. Clean vector illustration style, consistent with step-wadiz illustration. No photorealism. --ar 4:3
```

### C-6. STEP 3 일러스트 — 공동구매 (step-group-buy.webp)

```
Isometric or flat illustration representing influencer group buying (공동구매). Multiple smartphone screens arranged in a fan pattern, each showing a different influencer profile avatar (abstract geometric faces, no real people). Arrows connecting the phones to a central product package, symbolizing product distribution through influencers. Color palette: navy blue (#1E3A5F) for phones and connection lines, coral (#FF5733) for profile highlights and the central product, light gray (#F5F5F5) background. Clean vector illustration, consistent with previous step illustrations. --ar 4:3
```

### C-7. STEP 4 일러스트 — 폐쇄몰 입점 (step-closed-mall.webp)

```
Isometric or flat illustration representing B2B closed mall (폐쇄몰) distribution entry. A stylized corporate building or office tower with a locked/private shield icon, connected to a product catalog or document with a checkmark. A handshake symbol or contract icon nearby representing successful partnership. Color palette: navy blue (#1E3A5F) for buildings and documents, coral (#FF5733) for checkmarks and success indicators, light gray (#F5F5F5) background. Clean vector illustration, consistent with previous step illustrations. --ar 4:3
```

### C-8. Pain Point 섹션 일러스트 (3개 세트)

```
Create a set of 3 small flat vector icons for manufacturing company pain points, all in the same consistent style:

Icon 1 — "Wasted advertising budget": A money bill or coin with a downward arrow, symbolizing wasted spending. An X mark or broken arrow to represent failure.

Icon 2 — "Price destruction by bad distributors": A price tag with a crack or downward zigzag line through it, symbolizing price collapse.

Icon 3 — "Distribution accidents causing stress": A warning triangle with an exclamation mark, combined with a clock showing wasted time.

All three icons should use: navy blue (#1E3A5F) as primary stroke color, coral (#FF5733) for negative/warning elements (X marks, cracks, warning symbol). Line weight: 2px. Outlined style, no fills. Arranged side by side on white background. Each icon should work at 48x48px. --ar 3:1
```

---

## 카테고리 D: Open Graph, 소셜, 기타 (3개)

### D-1. Open Graph 기본 이미지 (og-image.png)

```
Professional Open Graph social sharing image for "유통스타트" (UtongStart) website. Left side: the brand logo icon (abstract upward arrow in navy blue #1E3A5F with coral #FF5733 accent). Right side: large Korean text "유통스타트" in bold navy blue, with smaller subtitle "제조사의 첫 유통 경험을 설계합니다" in dark gray. Background: clean white with a very subtle geometric pattern (hexagonal or diagonal lines) at 3% opacity. Bottom strip: coral (#FF5733) thin line accent. Professional, clean, B2B feel. Exact dimensions: 1200x630 pixels. --ar 1200:630
```

### D-2. 블로그 기본 썸네일 (blog default thumbnail)

```
Clean, minimal blog post thumbnail template design for a Korean B2B distribution consulting company. A large abstract geometric shape in navy blue (#1E3A5F) occupying the left third of the image, with the right two-thirds being a clean white/light gray (#F5F5F5) area where blog post title text would be overlaid later. A subtle coral (#FF5733) line accent at the bottom. The geometric shape should suggest knowledge/growth — like stacked books transforming into an upward graph. No actual text in the image. Professional, editorial feel. --ar 16:9
```

### D-3. 성공사례 기본 썸네일 (case study default thumbnail)

```
Clean, professional thumbnail template for a success case study page. Split composition: left side features an abstract product showcase area with subtle shelving lines in navy blue (#1E3A5F), right side shows an upward trending graph with data points. A large circular badge area in coral (#FF5733) in the top right corner where achievement numbers would be overlaid later. Background: white (#FFFFFF) with very light gray (#F5F5F5) subtle gradient. No actual text or numbers in the image. Professional B2B consulting aesthetic. --ar 3:2
```

---

## 순차 실행 요약 체크리스트

아래 순서대로 19개 프롬프트를 실행하면 됨.

| 순번 | 코드 | 파일명 | 사이즈/비율 | 용도 |
|---|---|---|---|---|
| 1 | A-1 | logo-full.svg | 3:1 | 메인 로고 |
| 2 | A-2 | logo-icon.svg | 1:1 | 로고 아이콘 |
| 3 | A-3 | logo-white.svg | 3:1 | 흰색 로고 |
| 4 | A-4 | favicon.png | 1:1 | 파비콘 |
| 5 | B-1 | hero-main.webp | 12:5 (1920x800) | 메인 히어로 Desktop |
| 6 | B-2 | hero-mobile.webp | 5:8 (750x1200) | 메인 히어로 Mobile |
| 7 | B-3 | hero-utongstart.webp | 16:9 (1200x675) | 유통스타트 서비스 히어로 |
| 8 | B-4 | cta-bg-dark.webp | 16:5 (1920x600) | CTA 배너 다크 배경 |
| 9 | C-1 | utongstart-icon.svg | 1:1 (48~80px) | 유통스타트 아이콘 |
| 10 | C-2 | live-commerce-icon.svg | 1:1 (48~80px) | 라이브커머스 아이콘 |
| 11 | C-3 | place-seo-icon.svg | 1:1 (48~80px) | 플레이스 아이콘 |
| 12 | C-4 | step-wadiz.webp | 4:3 (800x600) | STEP1 와디즈 일러스트 |
| 13 | C-5 | step-live.webp | 4:3 (800x600) | STEP2 라이브 일러스트 |
| 14 | C-6 | step-group-buy.webp | 4:3 (800x600) | STEP3 공동구매 일러스트 |
| 15 | C-7 | step-closed-mall.webp | 4:3 (800x600) | STEP4 폐쇄몰 일러스트 |
| 16 | C-8 | pain-point-icons.svg | 3:1 (세트) | Pain Point 아이콘 3종 |
| 17 | D-1 | og-image.png | 1200x630 | Open Graph |
| 18 | D-2 | blog-default-thumb.webp | 16:9 (800x450) | 블로그 기본 썸네일 |
| 19 | D-3 | case-default-thumb.webp | 3:2 (600x400) | 성공사례 기본 썸네일 |

---

## 일관성 유지를 위한 공통 지침

AI 이미지 도구로 순차 생성할 때 아래 규칙을 지키면 전체 이미지 세트의 톤앤매너가 통일됨.

첫째, C-4 ~ C-7(STEP 일러스트 4종)은 반드시 동일한 세션에서 연속으로 생성할 것. 같은 세션에서 생성해야 일러스트 스타일, 선 굵기, 컬러 톤이 일관됨. Midjourney를 사용한다면 첫 번째(C-4) 결과물의 스타일을 `--sref` 파라미터로 이후 프롬프트에 적용하는 방식이 효과적임.

둘째, 로고 관련(A-1 ~ A-4)은 AI 생성 후 반드시 벡터 편집 도구(Figma, Illustrator)에서 정리 작업이 필요함. AI가 생성한 로고는 형태 참고용으로만 사용하고, 실제 SVG 파일은 벡터로 재작업해야 확대/축소 시 품질이 보장됨.

셋째, 모든 사진형 이미지(B-1, B-2)에서 한국인의 얼굴이 등장하지 않도록 할 것. 손만 보이거나 뒷모습 정도가 최대치임. 실존 인물과 유사한 이미지가 생성되면 재생성해야 함.

넷째, 생성된 이미지는 반드시 WebP로 변환(품질 85%)하여 파일 사이즈를 최적화한 뒤 `public/images/` 경로에 저장할 것. 로고와 아이콘은 SVG로 별도 작업하여 저장함.

---

이 프롬프트 세트로 19개 이미지를 순차 생성하면, 디자인 가이드의 `public/images/` 디렉토리에 필요한 모든 핵심 에셋이 확보됨. 추가로 팀 소개 사진이나 실제 서비스 현장 사진은 촬영 기반으로 별도 확보가 필요하며, AI 생성 대상이 아님.

## images 폴더에 26.3.1작업해서 넣어둠

---

## 7. 초기 배포 시 제외 사항 (2026-03-01)

초기 Cloudflare Pages 배포의 기술적 안정성 확보를 위해 아래 기능들은 일시적으로 제외되었음. 사이트 정상 가동 확인 후 순차적으로 재구현 예정.

1. **카카오톡 상담 플로팅 버튼 (KakaoChat.astro)**:
   - 원인: Cloudflare 빌드 서버(리눅스) 및 Astro SSR 모드와의 빌드 호환성 이슈.
   - 조치: 컴포넌트 및 레이아웃(BaseLayout.astro)에서 코드 제거.
2. **자동 사이트맵 생성 (@astrojs/sitemap)**:
   - 원인: Hybrid/SSR 모드에서 빌드 시 reduce 관련 런타임 오류 발생.
   - 조치: astro.config.mjs에서 통합 비활성화.
3. **일부 API 라우트 고도화**:
   - 상담 신청(inquiry.ts) 및 뉴스레터(newsletter.ts)의 이메일 발송 로직은 현재 콘솔 로그 기반으로 안정화되어 있으며, Resend API 연동은 다음 단계에서 진행.

