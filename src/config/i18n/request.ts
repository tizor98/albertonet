import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { NEXT_LOCALE } from "../contants";
import { i18n, type Locale } from "./i18n";

export default getRequestConfig(async () => {
    const c = await cookies();
    const localeCookie = c.get(NEXT_LOCALE);

    let locale: Locale | undefined;
    if (localeCookie?.value) {
        locale = localeCookie.value as Locale;
    }

    if (!locale || (locale !== "en" && locale !== "es")) {
        locale = i18n.defaultLocale;
    }

    return {
        locale,
        messages: (await import(`@/config/messages/${locale}.json`)).default,
    };
});
