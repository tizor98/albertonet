"use client";
import { paths } from "@/config/paths";
import Link from "next/link";
import dynamic from "next/dynamic";

const DynamicThemeSwitcherWithNoSSR = dynamic(
    () => import("@/presentation/components/share/theme-switcher"),
    {
        ssr: false,
    },
);

export default function Header() {
    return (
        <header className="w-full">
            <nav className="container mx-auto my-5 flex items-center justify-between">
                <Link href={paths.home()}>
                    <h1 className="font-semibold text-3xl">
                        <span className="text-yellow-700">{"</>"}</span>
                        albertonet
                    </h1>
                </Link>
                <div className="flex items-center justify-center gap-4">
                    <Link href={paths.projects()}>Projects</Link>
                    <Link href={paths.blog()}>Blog</Link>
                    <Link href={paths.contact()}>Contact</Link>
                    <DynamicThemeSwitcherWithNoSSR />
                </div>
            </nav>
        </header>
    );
}
