import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { routing } from "@/infrastructure/i18n/routing";
import PostCardSkeleton from "@/presentation/components/posts/post-card-skeleton";
import PostList from "@/presentation/components/posts/post-list";
import type { LocaleParam } from "../layout";

export const revalidate = 2_592_000; // invalidate every month

export const dynamicParams = false; // to 404 on unknown paths on locale param

export async function generateStaticParams() {
    return routing.locales.map((locale) => ({
        locale,
    }));
}

export async function generateMetadata({
    params,
}: LocaleParam): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "metadata" });

    return {
        title: t("blog"),
    };
}

export default async function BlogPage({ params }: LocaleParam) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations("blog");

    return (
        <main className="container mx-auto h-full flex flex-col items-center justify-center gap-5">
            <section
                id="top-posts-list"
                className="container flex flex-col items-center gap-5 px-8"
            >
                <h2 className="text-3xl font-semibold tracking-wide">
                    {t("title")}
                </h2>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    <Suspense fallback={<PostCardSkeleton />}>
                        <PostList />
                    </Suspense>
                </div>
            </section>
        </main>
    );
}
