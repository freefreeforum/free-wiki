import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// The docs collection loads the Starlight-shaped markdown that `npm run
// sync-content` generates from the portable source of truth in `content/`.
// We extend Starlight's schema with the FREE Wiki's frontmatter contract
// (see docs/FREE_Wiki_Repo_Architecture.md) so components can read status,
// version, and translation/variant relationships.
export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        section: z.string().optional(),
        identifier: z.string().optional(),
        language: z.string().optional(),
        status: z
          .enum(['draft', 'published', 'translation', 'adopted', 'in-progress'])
          .optional(),
        version: z.string().optional(),
        last_updated: z.string().optional(),

        // Variant (chapter adaptation) relationship
        chapter: z.string().optional(),
        adopted_date: z.string().optional(),
        adapted_from: z.string().optional(),
        adapted_from_version: z.string().optional(),

        // Translation relationship
        translation_of: z.string().optional(),
        translated_from_version: z.string().optional(),
        translation_method: z
          .enum(['ai-generated', 'human', 'ai-then-human'])
          .optional(),
        human_verified: z.boolean().optional(),
        // Current version of the English canonical, stamped at sync time so the
        // staleness check is synchronous in the rendering layer.
        canonical_version: z.string().optional(),
      }),
    }),
  }),
};
