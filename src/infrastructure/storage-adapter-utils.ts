export type ParseMetadata = {
    title: string;
    description: string;
    categories: string;
    publicationDate: string;
    lastModifiedDate: string;
    image?: string;
};

export function parseFrontmatter(fileContent: string) {
    const frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
    const match = frontmatterRegex.exec(fileContent);
    const frontMatterBlock = match![1];
    const content = fileContent.replace(frontmatterRegex, "").trim();
    const frontMatterLines = frontMatterBlock.trim().split("\n");
    const metadata: Partial<ParseMetadata> = {};

    for (const line of frontMatterLines) {
        const [key, ...valueArr] = line.split(": ");
        let value = valueArr.join(": ").trim();
        value = value.replace(/^['"](.*)['"]$/, "$1"); // Remove quotes
        metadata[key.trim() as keyof ParseMetadata] = value;
    }

    return { metadata: metadata as ParseMetadata, content };
}

export function getObjectClientOpts() {
    const s3ClientOpts: any = {
        credentials: {
            accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID ?? "",
            secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY ?? "",
        },
        region: process.env.MY_AWS_REGION ?? "",
    };

    if (process.env.NODE_ENV === "development") {
        s3ClientOpts.endpoint = process.env.LOCAL_OBJECT_BUCKET_ENDPOINT;
    }
    return s3ClientOpts;
}
