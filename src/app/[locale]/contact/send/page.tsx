import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/infrastructure/i18n/routing";
import ContactSendConfirmation from "@/presentation/components/contact/contact-confirmation";
import type { LocaleParam } from "../../layout";

export const dynamic = "force-static"; // Since it only change with the locales that are known at build time

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
        title: t("send"),
    };
}

export default async function ContactPage({ params }: LocaleParam) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <main className="container mx-auto h-full flex flex-col items-center justify-center gap-5">
            <ContactSendConfirmation />
        </main>
    );
}
