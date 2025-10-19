import { en } from "./en";
import { es } from "./es";

export const languages = {
    es: "Español",
    en: "English",
};

export const availableLanguages = Object.keys(languages);

export const DEFAULT_LANG = "en";

export const messages = {
    en: en,
    es: es,
} as const;
