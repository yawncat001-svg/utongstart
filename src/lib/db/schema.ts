import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

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
  status:           text('status').default('new'), // 'new', 'contacted', 'in-progress', 'completed', 'cancelled'
  adminNote:        text('admin_note'),
});

export const newsletterSubscribers = sqliteTable('newsletter_subscribers', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  email:     text('email').notNull().unique(),
  name:      text('name'),
  isActive:  integer('is_active').default(1), // 1=활성, 0=해지
});
