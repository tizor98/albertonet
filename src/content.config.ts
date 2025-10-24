import {
    type CollectionEntry,
    defineCollection,
    type ImageFunction,
    z,
} from "astro:content";
import { glob } from "astro/loaders";

const postSchema = (lang: string, image: ImageFunction) =>
    z.object({
        slug: z.string(),
        lang: z.enum([lang]),
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        categories: z.string().default("Uncategorized"),
        heroImage: image().optional(),
    });

const blogEn = defineCollection({
    // Load Markdown and MDX files in the `src/content/blog/` directory.
    loader: glob({ base: "./src/content/blog/en", pattern: "**/*.{md,mdx}" }),
    // Type-check frontmatter using a schema
    schema: ({ image }) => postSchema("en", image),
});

const blogEs = defineCollection({
    // Load Markdown and MDX files in the `src/content/blog/` directory.
    loader: glob({ base: "./src/content/blog/es", pattern: "**/*.{md,mdx}" }),
    // Type-check frontmatter using a schema
    schema: ({ image }) => postSchema("es", image),
});

export const collections = { blogEn, blogEs };

export type PostEntry = CollectionEntry<"blogEn"> | CollectionEntry<"blogEs">;
