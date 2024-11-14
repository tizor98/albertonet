export type Post = {
    title: string;
    categories: string[];
    description: string;
    slug: string;
    content: string;
    image?: string;
    publicationDate: Date;
    lastModifiedDate: Date | undefined;
};

export type TopPost = {
    slug: string;
    title: string;
    categories: string;
    publicationDate: string;
};
