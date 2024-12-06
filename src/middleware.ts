import createMiddleware from "next-intl/middleware";
import { routing } from "@/infrastructure/i18n/routing";

export default createMiddleware(routing);

export const config = {
    // Match only internationalized pathnames
    matcher: ["/", "/(es|en)/:path*"],
};
