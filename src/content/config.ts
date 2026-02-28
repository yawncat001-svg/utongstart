import { defineCollection, z } from 'astro:content';

// 성공사례 (cases) 컬렉션
const casesCollection = defineCollection({
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
      metric2Label:  z.string().optional(),
      metric2Value:  z.string().optional(),
    }),
    publishedAt:     z.coerce.date(),
    featured:        z.boolean().default(false),
    tags:            z.array(z.string()),
  }),
});

// 블로그 (blog) 컬렉션
const blogCollection = defineCollection({
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
    featured:    z.boolean().default(false),
  }),
});


export const collections = {
  'cases': casesCollection,
  'blog': blogCollection,
};
