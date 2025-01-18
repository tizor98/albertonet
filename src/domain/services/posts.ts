import type { Post, TopPost } from "../types/post";
import { storageAdapter } from "@/infrastructure/storage-adapter";

export const PostService = {
    async getPosts(): Promise<Post[]> {
        const postsPath = await storageAdapter.getObjectsPath("posts/");

        const getPostPromises: Promise<Post | null>[] = [];
        for (const path of postsPath) {
            if (!path.endsWith(".mdx")) continue;
            getPostPromises.push(this.getPostByPath(path));
        }

        const posts = await Promise.all(getPostPromises);

        return posts.filter(Boolean) as Post[];
    },

    async getPostsSlug(): Promise<string[]> {
        const postsPath = await storageAdapter.getObjectsPath("posts/");

        const slugs: string[] = [];
        for (const path of postsPath) {
            if (!path.endsWith(".mdx")) continue;
            const slug = path.split("/").at(-1)?.replace(".mdx", "");
            if (slug) {
                slugs.push(slug);
            }
        }
        return slugs;
    },

    async getTopPosts(): Promise<TopPost[]> {
        const object = await storageAdapter.getObjectByPrefixAndName(
            "posts/top/",
            "topPosts.json",
        );
        if (!object) {
            console.warn("Top posts definition was not found");
            return [];
        }

        const topPostsJson = await object.Body?.transformToString();
        const topPosts: TopPost[] = JSON.parse(topPostsJson ?? "");
        return topPosts;
    },

    async getPostBySlug(slug: string): Promise<Post | null> {
        const object = await storageAdapter.getObjectByPrefixAndName(
            "posts/",
            `${slug}.mdx`,
        );

        if (!object) return null;

        return storageAdapter.fromObjectToPost(slug, object);
    },

    async getPostByPath(path: string): Promise<Post | null> {
        const object = await storageAdapter.getObjectByPath(path);

        if (!object) return null;

        return storageAdapter.fromObjectToPost(
            path.split("/").at(-1)?.replace(".mdx", "") ?? "",
            object,
        );
    },
};
