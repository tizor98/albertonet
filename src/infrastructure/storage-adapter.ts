import type { Post } from "@/domain/types/post";
import {
    GetObjectCommand,
    type GetObjectCommandOutput,
    ListObjectsCommand,
    S3Client,
    type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getObjectClientOpts, parseFrontmatter } from "./storage-adapter-utils";

const BUCKET_NAME = process.env.MY_BUCKET_NAME ?? "";

const s3ClientOpts: S3ClientConfig = getObjectClientOpts();
const s3Client = new S3Client(s3ClientOpts);

export class StorageAdapter {
    constructor(private readonly s3Client: S3Client) {}

    async getObjectsPath(prefix: string, maxItems = 5): Promise<string[]> {
        const listCommand = new ListObjectsCommand({
            Bucket: BUCKET_NAME,
            Prefix: prefix,
            MaxKeys: maxItems,
        });

        const objectList = await this.s3Client.send(listCommand);

        if (!objectList.Contents) return [];

        const objectsPath =
            objectList.Contents.filter((item) => undefined !== item.Key).map(
                (item) => item.Key,
            ) ?? [];

        return objectsPath as string[];
    }

    async getObjectByPath(
        path: string,
    ): Promise<GetObjectCommandOutput | null> {
        const getCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: path,
        });

        try {
            const response = await this.s3Client.send(getCommand);
            return response;
        } catch {
            return null;
        }
    }

    async getObjectByPrefixAndName(
        prefix: string,
        name: string,
    ): Promise<GetObjectCommandOutput | null> {
        const getCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `${prefix}${name}`,
        });

        try {
            const response = await this.s3Client.send(getCommand);
            return response;
        } catch {
            return null;
        }
    }

    async fromObjectToPost(
        name: string,
        data: GetObjectCommandOutput,
    ): Promise<Post> {
        if (!data.Body) {
            throw new Error(
                `Object body not found, and needed to parse to a post. For object: ${name}`,
            );
        }

        const rawContent = await data.Body.transformToString();
        const { metadata, content } = parseFrontmatter(rawContent);

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

export const storageAdapter = new StorageAdapter(s3Client);
