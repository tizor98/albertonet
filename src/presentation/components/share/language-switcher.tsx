"use client";
import { Languages } from "lucide-react";
import { Button } from "@/presentation/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/presentation/components/ui/dropdown-menu";
import { changeLanguage } from "@/presentation/actions/language";
import { useLocale } from "next-intl";
import type { Locale } from "@/infrastructure/i18n/i18n";

export default function LanguageSwitcher() {
    const locale = useLocale() as Locale;
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-xl">
                    <Languages className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Change language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    disabled={locale === "en"}
                    onClick={() => changeLanguage("en")}
                >
                    English
                </DropdownMenuItem>
                <DropdownMenuItem
                    disabled={locale === "es"}
                    onClick={() => changeLanguage("es")}
                >
                    Español
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
