import { routing } from "@/infrastructure/i18n/routing";
import PostList from "@/presentation/components/posts/post-list";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
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

    return (
        <main className="container mx-auto h-full flex flex-col items-center justify-center gap-5">
            <PostList />
        </main>
    );
}
