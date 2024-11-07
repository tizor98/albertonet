import { useEffect, useState } from "react";

const THEME_KEY = "albertonet-theme-key";

export type Theme = "light" | "dark";

export const useTheme = (): {
    theme: Theme;
    changeTheme: (theme: Theme) => void;
} => {
    const localTheme = window.localStorage.getItem(THEME_KEY) ?? "light";
    const [theme, setTheme] = useState<Theme>(
        localTheme === "dark" ? "dark" : "light",
    );

    useEffect(() => {
        if (localTheme === "dark") {
            document.querySelector("html")?.classList.add("dark");
        } else {
            document.querySelector("html")?.classList.remove("dark");
        }
    }, [localTheme]);

    const changeTheme = (newTheme: Theme) => {
        switch (newTheme) {
            case "dark":
                document.querySelector("html")?.classList.add("dark");
                window.localStorage.setItem(THEME_KEY, "dark");
                break;
            case "light":
                document.querySelector("html")?.classList.remove("dark");
                window.localStorage.setItem(THEME_KEY, "light");
                break;
        }

        setTheme(newTheme);
    };

    return {
        theme,
        changeTheme,
    };
};
