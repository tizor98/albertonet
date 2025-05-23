import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "../globals.css";
import { BASE_URL } from "@/infrastructure/contants";
import type { Locale } from "@/infrastructure/i18n";
import { routing } from "@/infrastructure/i18n/routing";
import Header from "@/presentation/components/share/header";
import Providers from "@/presentation/components/share/providers";
import { Toaster } from "@/presentation/components/ui/sonner";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    display: "swap",
    variable: "--font-poppins",
});

export const metadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
        default: "albertonet",
        template: "%s | albertonet",
    },
    description: "Personal blog and comunity around software development.",
    openGraph: {
        title: "albertonet",
        description: "Personal blog and comunity around software development.",
        url: new URL(BASE_URL),
        siteName: "albertonet",
        locale: "en",
        alternateLocale: "es",
        type: "website",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    creator: "Alberto Ortiz",
};

export const dynamic = "force-static"; // Since it only change with the locales that are known at build time

export async function generateStaticParams() {
    return routing.locales.map((locale) => ({
        locale,
    }));
}

export default async function RootLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
}> &
    LocaleParam) {
    const { locale } = await params;

    // Ensure that the incoming `locale` is valid
    if (!routing.locales.includes(locale as Locale)) {
        notFound();
    }
    setRequestLocale(locale);

    const msg = await getMessages();

    return (
        <html suppressHydrationWarning lang={locale}>
            <body
                className={`${poppins.variable} antialiased scroll-smooth bg-zinc-100 dark:bg-zinc-900`}
            >
                <Providers msg={msg}>
                    <Header />
                    {children}
                    <Toaster />
                </Providers>
            </body>
        </html>
    );
}

export interface LocaleParam {
    params: Promise<{
        locale: string;
    }>;
}
