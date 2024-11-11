"use server";

import { NEXT_LOCALE } from "@/infrastructure/contants";
import type { Locale } from "@/infrastructure/i18n/i18n";
import { cookies } from "next/headers";

export async function changeLanguage(locale: Locale) {
    const c = await cookies();

    if (!locale || (locale !== "en" && locale !== "es")) return;
    c.set(NEXT_LOCALE, locale);
}
