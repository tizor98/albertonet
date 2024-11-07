import { useState } from "react";

const THEME_KEY = "albertonet-theme-key";

export type Theme = "light" | "dark";

export const useTheme = (): {
    theme: Theme;
    changeTheme: (theme: Theme) => void;
} => {
    const localTheme = localStorage.getItem(THEME_KEY) ?? "light";

    const [theme, setTheme] = useState<Theme>(
        localTheme === "dark" ? "dark" : "light",
    );

    if (theme === "dark") {
        document.querySelector("html")?.classList.add("dark");
    }

    const changeTheme = (newTheme: Theme) => {
        switch (newTheme) {
            case "dark":
                document.querySelector("html")?.classList.add("dark");
                localStorage.setItem(THEME_KEY, "dark");
                break;
            case "light":
                document.querySelector("html")?.classList.remove("dark");
                localStorage.setItem(THEME_KEY, "light");
                break;
        }

        setTheme(newTheme);
    };

    return {
        theme,
        changeTheme,
    };
};
