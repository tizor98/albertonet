// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
    site: "https://albertonet.com",
    integrations: [mdx(), sitemap()],
    i18n: {
        defaultLocale: "en",
        locales: ["en", "es"],
    },
    vite: {
        plugins: [tailwindcss()],
    },
});
