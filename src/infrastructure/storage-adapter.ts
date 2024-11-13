import type { Post } from "@/domain/types/post";
import {
    GetObjectCommand,
    type GetObjectCommandOutput,
    ListObjectsCommand,
    S3Client,
} from "@aws-sdk/client-s3";

const BUCKET_NAME = process.env.MY_BUCKET_NAME ?? "";

const s3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY ?? "",
    },
    region: process.env.MY_AWS_REGION ?? "",
});

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

    async getObjectByPath(path: string): Promise<GetObjectCommandOutput> {
        const getCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: path,
        });
        return this.s3Client.send(getCommand);
    }

    async getObjectByPrefixAndName(
        prefix: string,
        name: string,
    ): Promise<GetObjectCommandOutput> {
        const getCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `${prefix}${name}`,
        });

        return this.s3Client.send(getCommand);
    }

    async fromObjectToPost(
        name: string,
        data: GetObjectCommandOutput,
    ): Promise<Post> {
        if (
            !data.Metadata ||
            !data.Metadata.categories ||
            !data.Metadata.title ||
            !data.Metadata.publicationdate
        ) {
            throw new Error(
                `Object metadata not found, and needed to parse to a post. For object: ${name}`,
            );
        }
        return {
            title: data.Metadata.title,
            slug: name,
            description: data.Metadata.description,
            categories: data.Metadata.categories.split(";"),
            content: (await data.Body?.transformToString()) as string,
            publicationDate: new Date(data.Metadata.publicationdate),
            lastModifiedDate: data.LastModified,
        };
    }
}

export const storageAdapter = new StorageAdapter(s3Client);
