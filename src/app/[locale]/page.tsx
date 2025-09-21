import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { routing } from "@/infrastructure/i18n/routing";
import Hero from "@/presentation/components/home/hero";
import TopPostsList from "@/presentation/components/home/top-post-list";
import TopProjectList from "@/presentation/components/home/top-project-list";
import type { LocaleParam } from "./layout";

export const revalidate = 2_592_000; // invalidate every month

export const dynamicParams = false; // to 404 on unknown paths on locale param

export async function generateStaticParams() {
    return routing.locales.map((locale) => ({
        locale,
    }));
}

export default async function Home({ params }: LocaleParam) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <main className="w-full flex flex-col items-center justify-start gap-10 mb-10">
            <Hero />
            <Suspense>
                <TopPostsList />
            </Suspense>
            <Suspense>
                <TopProjectList />
            </Suspense>
        </main>
    );
}
