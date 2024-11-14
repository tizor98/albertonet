"use client";
import { Menu, X } from "lucide-react";
import ThemeSwitcher from "./theme-switcher";
import { Button } from "../ui/button";
import { useState } from "react";
import Link from "next/link";
import { paths } from "@/infrastructure/paths";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./language-switcher";

export default function NavMobile() {
    const t = useTranslations("home");
    const [active, setActive] = useState(false);

    const onClick = () => {
        setActive(!active);
    };

    return (
        <div className="lg:hidden flex items-center gap-1">
            <Button
                onClick={onClick}
                variant={"ghost"}
                className="p-0 w-10 h-10"
            >
                {active ? <X /> : <Menu />}
            </Button>
            <LanguageSwitcher />
            <ThemeSwitcher />
            {active && (
                <Button
                    onClick={onClick}
                    variant={"ghost"}
                    className="absolute z-50 top-0 h-fit border border-zinc-400 rounded-3xl left-0 right-0 mt-20 p-10 flex flex-col items-start justify-start gap-5 text-2xl text-white dark:text-black bg-zinc-900 dark:bg-zinc-100 cursor-default"
                >
                    <Link
                        className="z-50 hover:text-blue-800 dark:hover:text-blue-400 duration-150"
                        href={paths.projects()}
                    >
                        {t("projectLink")}
                    </Link>
                    <Link
                        className="z-50 hover:text-blue-800 dark:hover:text-blue-400 duration-150"
                        href={paths.blog()}
                    >
                        {t("blogLink")}
                    </Link>
                    <Link
                        className="z-50 hover:text-blue-800 dark:hover:text-blue-400 duration-150"
                        href={paths.contact()}
                    >
                        {t("contactLink")}
                    </Link>
                </Button>
            )}
        </div>
    );
}
