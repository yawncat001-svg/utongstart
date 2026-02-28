-- Migration: 0001_create_inquiries.sql
-- Create Date: 2026-03-01

CREATE TABLE inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    service_type TEXT NOT NULL,
    product_category TEXT,
    budget_range TEXT,
    message TEXT,
    referral_source TEXT,
    status TEXT DEFAULT 'new',
    admin_note TEXT
);

CREATE TABLE newsletter_subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    is_active INTEGER DEFAULT 1
);
