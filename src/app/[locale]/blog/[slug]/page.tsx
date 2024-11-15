import { PostService } from "@/domain/services/posts";
import PostDetail from "@/presentation/components/posts/post-detail";
import { notFound } from "next/navigation";
import type { Locale } from "@/infrastructure/i18n";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/infrastructure/i18n/routing";

export async function generateStaticParams() {
    const slugs = await PostService.getPostsSlug();
    const locales = routing.locales.map((locale) => ({
        locale,
    }));
    if (!slugs || slugs.length === 0) return locales;
    return slugs.flatMap((slug) => {
        return locales.map((locale) => ({
            locale,
            slug,
        }));
    });
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
            <section id="post" className="max-w-6xl mt-10">
                <PostDetail post={post} />
            </section>
        </main>
    );
}
