import { defaultLang, messages } from "./messages";

export function getUrlInNewLang(url: URL, newLang: keyof typeof messages) {
    const [, , ...rest] = url.pathname.split("/");
    return `/${newLang}/${rest.join("/")}${url.search}${url.hash}`;
}

export function getLangFromUrl(url: URL): keyof typeof messages {
    const [, lang] = url.pathname.split("/");
    if (lang in messages) return lang as keyof typeof messages;
    return defaultLang;
}

type Root = (typeof messages)[typeof defaultLang];

// Resolve a dot-separated path P on object T, returning the nested value type or never
type NestedProp<T, P extends string> = P extends `${infer Head}.${infer Rest}`
    ? Head extends keyof T
        ? NestedProp<T[Head], Rest>
        : never
    : P extends keyof T
      ? T[P]
      : never;

// Add: build a union of dot-separated nested keys for T (e.g. "home" | "home.hero" | "home.hero.title")
type Path<T> = T extends object
    ? {
          [K in Extract<keyof T, string>]: K | `${K}.${Path<T[K]>}`;
      }[Extract<keyof T, string>]
    : never;

// overload: no path -> key is complete key set
export function useTranslations(
    lang: keyof typeof messages,
): (key: Path<Root>) => string | undefined;
// overload: with dot path -> key is constrained to inner keys of that nested path
export function useTranslations<P extends Path<Root>>(
    lang: keyof typeof messages,
    path: P,
): (key?: Path<NestedProp<Root, P>>) => string | undefined;

export function useTranslations(lang: keyof typeof messages, path?: string) {
    return function t(key?: string) {
        let val = messages[lang as keyof typeof messages] as any;
        let fallback = messages[defaultLang] as any;
        if (path) {
            const parts = path.split(".");
            for (const p of parts) {
                val = val?.[p];
                fallback = fallback?.[p];
            }
        }
        if (!key) return val ?? fallback;
        const keyParts = key.split(".");
        for (const p of keyParts) {
            val = val?.[p];
            fallback = fallback?.[p];
        }
        return val ?? fallback;
    };
}
