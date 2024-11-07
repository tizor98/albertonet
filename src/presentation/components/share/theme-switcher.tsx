"use client";
import { useTheme } from "@/presentation/hooks/useTheme";
import Image from "next/image";

export default function ThmeSwitcher() {
    const { theme, changeTheme } = useTheme();

    const onClick = () => {
        changeTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <button
            type="submit"
            className="focus:outline-none hover:ring-4 hover:ring-gray-600 dark:hover:ring-gray-700  text-gray-500 md:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm p-2"
            onClick={onClick}
        >
            {/* Moon */}
            <Image
                className="dark:hidden"
                width={20}
                height={20}
                src={"/moon.svg"}
                alt="Moon icon"
            />

            {/* Sun */}
            <Image
                className="hidden dark:block"
                width={20}
                height={20}
                src={"/sun.svg"}
                alt="Sun icon"
            />
        </button>
    );
}
