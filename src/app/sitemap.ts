import type { MetadataRoute } from "next";
import { PostService } from "@/domain/services/posts";
import { BASE_URL } from "@/infrastructure/contants";
import { paths } from "@/infrastructure/paths";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const blogs = await PostService.getPosts();

    const blogRoutes: MetadataRoute.Sitemap = blogs.map((post) => ({
        url: `${BASE_URL}${paths.blogPost(post.slug)}`,
        lastModified: post.lastModifiedDate,
        alternates: {
            languages: {
                es: "es",
                en: "en",
            },
        },
    }));

    const routes: MetadataRoute.Sitemap = [
        paths.home(),
        paths.contact(),
        paths.contactSend(),
        paths.blog(),
    ].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date().toISOString().split("T")[0],
        alternates: {
            languages: {
                es: "es",
                en: "en",
            },
        },
    }));

    return [...routes, ...blogRoutes];
}
