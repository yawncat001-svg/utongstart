import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  driver: "d1-http", // Cloudflare D1 driver
  dbCredentials: {
    // 로컬 개발 시 wrangler.toml에 정의된 D1_DATABASE 바인딩 사용
    // 이 설정은 실제 데이터베이스가 아닌 Drizzle Kit의 타입 추론 및 마이그레이션 생성에 사용됩니다.
    // 실제 런타임 환경에서는 Astro와 Cloudflare Pages의 바인딩을 통해 D1에 접근합니다.
    wranglerConfigPath: './wrangler.toml',
    dbName: 'utongstart-db',
  }
});
