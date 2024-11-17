"use client";
import { Languages } from "lucide-react";
import { Button } from "@/presentation/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/presentation/components/ui/dropdown-menu";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/infrastructure/i18n/routing";
import type { Locale } from "@/infrastructure/i18n";
import { useTransition } from "react";
import { useParams } from "next/navigation";

export default function LanguageSwitcher() {
    const [isPending, startTransition] = useTransition();
    const pathname = usePathname();
    const params = useParams();
    const router = useRouter();

    const onChangeLanguage = (newLocale: Locale) => {
        startTransition(() => {
            // params is not known by typescript, but we are sure that this is valid. So we put never
            router.replace({ pathname, params } as never, {
                locale: newLocale,
            });
        });
    };

    const locale = useLocale;
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
                    disabled={locale() === "en" || isPending}
                    onClick={() => onChangeLanguage("en")}
                >
                    English
                </DropdownMenuItem>
                <DropdownMenuItem
                    disabled={locale() === "es" || isPending}
                    onClick={() => onChangeLanguage("es")}
                >
                    Español
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
