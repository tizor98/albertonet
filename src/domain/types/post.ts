export type Post = {
    title: string;
    categories: Category[];
    description: string;
    slug: string;
};

export type Category = {
    name: string;
};
