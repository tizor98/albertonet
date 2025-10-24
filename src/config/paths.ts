export const paths = {
    home(lang: string) {
        return `/${lang}/`;
    },
    blog(lang: string) {
        return `/${lang}/blog`;
    },
    blogPost(lang: string, slug: string) {
        return `/${lang}/blog/${slug}`;
    },
    contact(lang: string) {
        return `/${lang}/contact`;
    },
    contactSend(lang: string) {
        return `/${lang}/contact/send`;
    },
};
