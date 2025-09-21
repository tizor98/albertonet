import type { MetadataRoute } from "next";
import { BASE_URL } from "@/infrastructure/contants";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}
