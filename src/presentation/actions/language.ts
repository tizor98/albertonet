"use server";

import { NEXT_LOCALE } from "@/config/contants";
import type { Locale } from "@/config/i18n/i18n";
import { cookies } from "next/headers";

export async function changeLanguage(locale: Locale) {
    const c = await cookies();

    if (!locale || (locale !== "en" && locale !== "es")) return;
    c.set(NEXT_LOCALE, locale);
}
