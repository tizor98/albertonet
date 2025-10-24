import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import awsAmplify from "astro-aws-amplify";

import tailwindcss from "@tailwindcss/vite";

import expressiveCode from "astro-expressive-code";

// https://astro.build/config
export default defineConfig({
    site: "https://albertonet.com",
    output: "server",
    adapter: awsAmplify(),
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
