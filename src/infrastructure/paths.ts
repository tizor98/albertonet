export const paths = {
    home() {
        return "/";
    },
    projects() {
        return "/projects";
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
