"use client";
import { paths } from "@/infrastructure/paths";
import { Button } from "@/presentation/components/ui/button";
import "./globals.css";
import Link from "next/link";

export const dynamic = "force-static";

export default function DefaultGlobalError() {
    return (
        <html lang="en">
            <body className="antialiased scroll-smooth bg-zinc-100 dark:bg-zinc-900">
                <main className="container mx-auto min-h-[600px] flex flex-col items-center justify-center gap-5">
                    <h2 className="text-red-500 font-bold text-2xl">
                        500. An unexpected error ocurred. Please try again later
                    </h2>
                    <Link href={paths.home()}>
                        <Button variant={"default"}>Go back to home</Button>
                    </Link>
                </main>
            </body>
        </html>
    );
}
