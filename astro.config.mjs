import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import expressiveCode from "astro-expressive-code";

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
    experimental: {
        failOnPrerenderConflict: true,
        fonts: [
            {
                provider: fontProviders.google(),
                name: "Poppins",
                cssVariable: "--font-poppins",
                weights: [400, 500, 600, 700],
            },
        ],
    },
});
