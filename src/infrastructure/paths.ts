export const paths = {
    home() {
        return "/";
    },
    blog() {
        return "/blog";
    },
    blogPost(slug: string) {
        return `/blog/${slug}`;
    },
    contact() {
        return "/contact";
    },
    contactSend() {
        return "/contact/send";
    },
};
