import type { Post } from "../types/post";
import { storageAdapter } from "@/infrastructure/storage-adapter";

export const PostService = {
    async getTopPosts(): Promise<Post[]> {
        await new Promise((r) => setTimeout(r, 2000));

        const postsPath = await storageAdapter.getObjectsPath("posts/top");

        const getPostPromises: Promise<Post>[] = [];
        for (const path of postsPath) {
            if (!path.endsWith(".mdx")) continue;
            getPostPromises.push(this.getPostByPath(path));
        }

        const posts = await Promise.all(getPostPromises);

        return posts;
    },

    async getPostBySlug(slug: string): Promise<Post> {
        const object = await storageAdapter.getObjectByPrefixAndName(
            "posts/",
            slug,
        );

        return storageAdapter.fromObjectToPost(slug, object);
    },

    async getPostByPath(path: string): Promise<Post> {
        const object = await storageAdapter.getObjectByPath(path);
        console.log(object);

        return storageAdapter.fromObjectToPost(
            path.split("/").at(path.split("/").length - 1) ?? "",
            object,
        );
    },
};
