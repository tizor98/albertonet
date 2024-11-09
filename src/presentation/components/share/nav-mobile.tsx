"use client";
import { Menu, X } from "lucide-react";
import ThemeSwitcher from "./theme-switcher";
import { Button } from "../ui/button";
import { useState } from "react";
import Link from "next/link";
import { paths } from "@/config/paths";

export default function NavMobile() {
    const [active, setActive] = useState(false);

    const onClick = () => {
        setActive(!active);
    };

    return (
        <div className="lg:hidden flex items-center gap-2">
            <Button
                onClick={onClick}
                variant={"ghost"}
                className="p-0 w-10 h-10"
            >
                {active ? <X /> : <Menu />}
            </Button>
            <ThemeSwitcher />
            {active && (
                <Button
                    onClick={onClick}
                    variant={"ghost"}
                    className="absolute z-0 top-0 h-full left-0 right-0 mt-20 p-10 flex flex-col items-start justify-start gap-5 text-2xl bg-zinc-100 dark:bg-zinc-900 cursor-default"
                >
                    <Link
                        className="z-10 hover:text-blue-800 dark:hover:text-blue-400 duration-150"
                        href={paths.projects()}
                    >
                        Projects
                    </Link>
                    <Link
                        className="z-10 hover:text-blue-800 dark:hover:text-blue-400 duration-150"
                        href={paths.blog()}
                    >
                        Blog
                    </Link>
                    <Link
                        className="z-10 hover:text-blue-800 dark:hover:text-blue-400 duration-150"
                        href={paths.contact()}
                    >
                        Contact
                    </Link>
                </Button>
            )}
        </div>
    );
}
