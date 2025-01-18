import type { Post } from "@/domain/types/post";
import { parseFrontmatter } from "./storage-adapter-utils";
import { opendir, readFile } from "node:fs/promises";
import { join } from "node:path";

export class StorageAdapter {
    private postDir = join(process.cwd(), "public", "posts");

    async getPostPaths(): Promise<string[]> {
        const dir = await opendir(this.postDir);

        const objectList: string[] = [];

        for await (const dirent of dir) {
            if (!dirent.isFile()) continue;
            objectList.push(join(dirent.parentPath, dirent.name));
        }

        if (!objectList.length) return [];
        return objectList;
    }

    async getPostByPath(path: string): Promise<string | null> {
        try {
            const response = await readFile(path, { encoding: "utf-8" });
            return response;
        } catch {
            return null;
        }
    }

    async getPostBySlug(slug: string): Promise<string | null> {
        try {
            const response = await readFile(join(this.postDir, `${slug}.mdx`), {
                encoding: "utf-8",
            });
            return response;
        } catch {
            return null;
        }
    }

    async getTopPosts(): Promise<string | null> {
        try {
            const response = await readFile(
                join(this.postDir, "topPosts.json"),
                {
                    encoding: "utf-8",
                },
            );
            return response;
        } catch {
            return null;
        }
    }

    async fromObjectToPost(name: string, data: string): Promise<Post> {
        if (!data.length) {
            throw new Error(`Object content not found. For object: ${name}`);
        }

        const { metadata, content } = parseFrontmatter(data);

        const post: Post = {
            title: metadata.title,
            slug: name,
            description: metadata.description,
            categories: metadata.categories.split(";"),
            content: content,
            publicationDate: new Date(metadata.publicationDate),
            lastModifiedDate: new Date(metadata.lastModifiedDate),
        };
        if (metadata.image) {
            post.image = metadata.image;
        }
        return post;
    }
}

export const storageAdapter = new StorageAdapter();
