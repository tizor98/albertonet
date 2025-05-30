import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";
import { i18n } from ".";

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: i18n.locale,

    // Used when no locale matches
    defaultLocale: i18n.defaultLocale,
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
    createNavigation(routing);
