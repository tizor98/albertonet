import type { Post } from "../types/post";
import { downloadData, list } from "aws-amplify/storage";

const BUCKET_NAME_FROM_BACKEND = "albertonet-bucket";

export const PostService = {
    async getTopPosts(): Promise<Post[]> {
        await new Promise((r) => setTimeout(r, 2000));
        const topPosts = await list({
            path: "posts/top",
            options: {
                bucket: BUCKET_NAME_FROM_BACKEND,
                listAll: true,
            },
        });

        console.log(topPosts);

        const postsPath = topPosts.items.map((item) => item.path);

        const getPostPromises: Promise<Post>[] = [];
        for (const path of postsPath) {
            getPostPromises.push(this.getPostByPath(path));
        }

        const posts = await Promise.all(getPostPromises);

        return posts;
    },

    async getPostBySlug(slug: string): Promise<Post> {
        const data = await downloadData({
            path: `posts/${slug}`,
            options: {
                bucket: BUCKET_NAME_FROM_BACKEND,
            },
        }).result;

        if (!data.metadata) {
            throw new Error(`Post metadata not found for post ${slug}`);
        }

        return fromObjectToPost(slug, data);
    },

    async getPostByPath(path: string): Promise<Post> {
        const data = await downloadData({
            path,
            options: {
                bucket: BUCKET_NAME_FROM_BACKEND,
            },
        }).result;

        if (!data.metadata) {
            throw new Error(`Post metadata not found for post ${path}`);
        }

        return fromObjectToPost(
            path.split("/").at(path.split("/").length - 1) ?? "",
            data,
        );
    },
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const fromObjectToPost = async (slug: string, data: any): Promise<Post> => {
    return {
        title: data.metadata.title,
        slug,
        description: data.metadata.description,
        categories: data.metadata.categories.split(";"),
        content: await data.body.text(),
        publicationDate: new Date(data.metadata.publicationDate),
        lastModifiedDate: data.lastModified,
    };
};
