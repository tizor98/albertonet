import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/presentation/components/share/header";
import { getLocale, getMessages } from "next-intl/server";
import { BASE_URL } from "@/infrastructure/contants";
import Providers from "@/presentation/components/share/providers";
import { Toaster } from "@/presentation/components/ui/sonner";

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
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const locale = await getLocale();
    const msg = await getMessages();

    return (
        <html suppressHydrationWarning lang={locale}>
            <Head />
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

const Head = () => {
    return (
        <head>
            <link
                rel="apple-touch-icon"
                sizes="180x180"
                href="/static/apple-touch-icon.png"
            />
            <link
                rel="icon"
                type="image/png"
                sizes="32x32"
                href="/static/favicon-32x32.png"
            />
            <link
                rel="icon"
                type="image/png"
                sizes="16x16"
                href="/static/favicon-16x16.png"
            />
            <link rel="manifest" href="/site.webmanifest" />
        </head>
    );
};
