import ContactSendConfirmation from "@/presentation/components/contact/contact-confirmation";
import type { LocaleParam } from "../../layout";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/infrastructure/i18n/routing";

export async function generateStaticParams() {
    return routing.locales.map((locale) => ({
        locale,
    }));
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
