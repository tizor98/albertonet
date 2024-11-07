"use client";
import { useTheme } from "@/presentation/hooks/useTheme";
import { Moon, Sun } from "lucide-react";

export default function ThemeSwitcher() {
    const { theme, changeTheme } = useTheme();

    const onClick = () => {
        changeTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <button
            type="submit"
            className="focus:outline-none hover:ring-4 hover:ring-gray-300 dark:hover:ring-gray-700  text-gray-500 md:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg text-sm p-2"
            onClick={onClick}
        >
            <Sun className="hidden dark:block h-[1.2rem] w-[1.2rem]" />
            <Moon className="dark:hidden h-[1.2rem] w-[1.2rem]" />
        </button>
    );
}
