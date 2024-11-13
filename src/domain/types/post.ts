export type Post = {
    title: string;
    categories: string[];
    description: string;
    slug: string;
    content: string;
    publicationDate: Date;
    lastModifiedDate: Date | undefined;
};
