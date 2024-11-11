import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: ["class"],
    theme: {
        extend: {
            fontFamily: {
                poppins: "var(--font-poppins)",
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            colors: {},
        },
    },
    plugins: [require("tailwindcss-animate")],
};
export default config;
