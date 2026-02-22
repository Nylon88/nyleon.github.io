import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	schema: ({ image }) =>
		z
			.object({
				title: z.string(),
				description: z.string(),
				// Either `date` or `pubDate` can be used in frontmatter.
				date: z.coerce.date().optional(),
				pubDate: z.coerce.date().optional(),
				updatedDate: z.coerce.date().optional(),
				draft: z.boolean().default(false),
				tags: z.array(z.string().min(1)).default([]),
				heroImage: z.union([image(), z.string()]).optional(),
			})
			.refine((data) => data.date || data.pubDate, {
				message: 'Either `date` or `pubDate` is required.',
			})
			.transform((data) => ({
				title: data.title,
				description: data.description,
				pubDate: data.pubDate ?? data.date!,
				updatedDate: data.updatedDate,
				draft: data.draft,
				tags: data.tags,
				heroImage: data.heroImage,
			})),
});

export const collections = { blog };
