import { en } from "./en";
import { es } from "./es";

export const languages = {
    es: "Español",
    en: "English",
};

export const defaultLang = "en";

export const messages = {
    en: en,
    es: es,
} as const;
