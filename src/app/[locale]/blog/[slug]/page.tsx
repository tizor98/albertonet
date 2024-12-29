import { PostService } from "@/domain/services/posts";
import PostDetail from "@/presentation/components/posts/post-detail";
import { notFound } from "next/navigation";
import type { Locale } from "@/infrastructure/i18n";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/infrastructure/i18n/routing";
import type { Metadata } from "next";
import { BASE_URL } from "@/infrastructure/contants";
import { paths } from "@/infrastructure/paths";

export const revalidate = 2_592_000; // invalidate every month

export async function generateStaticParams(): Promise<
    {
        locale: "en" | "es";
        slug?: string;
    }[]
> {
    const slugs = await PostService.getPostsSlug();
    const locales = routing.locales.map((locale) => ({
        locale,
    }));
    if (!slugs || slugs.length === 0) return locales;
    return slugs.flatMap((slug) => {
        return locales.map(({ locale }) => ({
            locale,
            slug,
        }));
    });
}

export async function generateMetadata({
    params,
}: Props): Promise<Metadata | undefined> {
    const { slug } = await params;
    if (!slug) return;

    const post = await PostService.getPostBySlug(slug);

    if (!post) return;

    const title = post.title;
    const publishedTime = post.publicationDate;
    const description = post.description;
    const ogImage = post.image
        ? post.image
        : `${BASE_URL}/og?title=${encodeURIComponent(title)}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "article",
            publishedTime: publishedTime.toISOString().split("T")[0],
            url: `${BASE_URL}${paths.blogPost(post.slug)}`,
            images: [
                {
                    url: ogImage,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [ogImage],
        },
    };
}

interface Props {
    params: Promise<{
        slug: string;
        locale: Locale;
    }>;
}

export default async function BlogPost({ params }: Props) {
    const { slug, locale } = await params;
    setRequestLocale(locale);

    const post = await PostService.getPostBySlug(slug);

    if (!post) notFound();

    return (
        <main className="container mx-auto h-full flex flex-col items-center justify-start">
            <section id="post" className="max-w-full lg:max-w-6xl my-10 px-5">
                <PostDetail post={post} />
            </section>
        </main>
    );
}
