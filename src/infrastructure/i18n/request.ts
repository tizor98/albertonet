import { getRequestConfig } from "next-intl/server";
import type { Locale } from ".";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
    let locale = await requestLocale;

    // Ensure that a valid locale is used
    if (!locale || !routing.locales.includes(locale as Locale)) {
        locale = routing.defaultLocale;
    }

    return {
        locale,
        messages: (await import(`@/infrastructure/messages/${locale}.json`))
            .default,
    };
});
