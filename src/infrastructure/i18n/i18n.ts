export const i18n = {
    defaultLocale: "en",
    locale: ["es", "en"],
} as const;

export type Locale = (typeof i18n)["locale"][number];
