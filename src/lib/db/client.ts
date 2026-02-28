import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

// Astro 런타임 환경에 D1_DATABASE 바인딩이 있다고 가정합니다.
interface Env {
  D1_DATABASE: D1Database;
}

// Drizzle ORM 인스턴스를 가져오는 함수
export function getDB(env: Env): DrizzleD1Database {
  return drizzle(env.D1_DATABASE, { schema });
}

// TODO: 문의, 뉴스레터 관련 CRUD 함수들 추가
// 아래는 예시입니다.

// 문의 (Inquiry) 관련 타입 정의
export type Inquiry = typeof schema.inquiries.$inferSelect; // SELECT 결과 타입
export type NewInquiry = typeof schema.inquiries.$inferInsert; // INSERT 시 사용될 타입

// 새로운 문의를 DB에 삽입
export async function insertInquiry(db: DrizzleD1Database, data: NewInquiry): Promise<Inquiry> {
  const result = await db.insert(schema.inquiries).values(data).returning().get();
  return result;
}

// 뉴스레터 구독자 (Newsletter Subscriber) 관련 타입 정의
export type NewsletterSubscriber = typeof schema.newsletterSubscribers.$inferSelect;
export type NewNewsletterSubscriber = typeof schema.newsletterSubscribers.$inferInsert;

// 새로운 뉴스레터 구독자를 DB에 삽입
export async function insertNewsletterSubscriber(db: DrizzleD1Database, data: NewNewsletterSubscriber): Promise<NewsletterSubscriber> {
  const result = await db.insert(schema.newsletterSubscribers).values(data).returning().get();
  return result;
}

// D1Database type for Astro Runtime (locals.runtime.env)
declare global {
  namespace App {
    interface Locals {
      runtime: {
        env: Env;
      };
    }
  }
}
