import { Poppins } from "next/font/google";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Toaster } from "sonner";
import { i18n } from "@/infrastructure/i18n";
import Header from "@/presentation/components/share/header";
import NotFoundGeneric from "@/presentation/components/share/not-found-generic";
import Providers from "@/presentation/components/share/providers";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    display: "swap",
    variable: "--font-poppins",
});

export const dynamic = "force-static";

export default async function GlobalDefaultNotFound() {
    const msg = await getMessages();

    setRequestLocale(i18n.defaultLocale);
    return (
        <html suppressHydrationWarning lang="en">
            <body
                className={`${poppins.variable} antialiased scroll-smooth bg-zinc-100 dark:bg-zinc-900`}
            >
                <Providers msg={msg}>
                    <Header />
                    <NotFoundGeneric />
                    <Toaster />
                </Providers>
            </body>
        </html>
    );
}
