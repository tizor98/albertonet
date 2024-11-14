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
