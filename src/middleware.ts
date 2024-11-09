import { NextResponse, type NextRequest } from "next/server";
import { NEXT_LOCALE } from "./config/contants";
import { i18n, type Locale } from "./config/i18n/i18n";

export async function middleware(request: NextRequest) {
    if (request.cookies.has(NEXT_LOCALE)) return;

    let locale: Locale | undefined;

    const h = request.headers;
    const language = h.get("Accept-Language");
    if (language?.includes("es")) {
        locale = "es";
    } else if (language?.includes("en")) {
        locale = "en";
    }

    if (!locale || (locale !== "en" && locale !== "es")) {
        locale = i18n.defaultLocale;
    }

    const response = NextResponse.next();
    response.cookies.set(NEXT_LOCALE, locale);
    return response;
}

export const config = {
    // Matcher ignoring `/_next/` and `/api/` and `/static`
    matcher: ["/((?!api|static|_next/static|_next/image|site.webmanifest).*)"],
};
