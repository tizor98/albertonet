import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import expressiveCode from "astro-expressive-code";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
    site: "https://www.albertonet.com",
    output: "server",
    adapter: vercel({
        webAnalytics: {
            enabled: true,
        },
    }),
    integrations: [
        expressiveCode({
            themes: ["dracula"],
            defaultProps: {
                frame: "auto",
            },
        }),
        mdx(),
        sitemap(),
    ],
    vite: {
        plugins: [tailwindcss()],
    },
});
