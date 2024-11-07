import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/presentation/components/share/header";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    display: "swap",
    variable: "--font-poppins",
});

export const metadata: Metadata = {
    title: "albertonet",
    description: "Main Website for albertonet mark.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body
                className={`${poppins.variable} antialiased scroll-smooth dark:invert bg-zinc-100 dark:bg-zinc-900`}
            >
                <Header />
                {children}
            </body>
        </html>
    );
}
