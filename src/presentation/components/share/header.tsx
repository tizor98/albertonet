import { paths } from "@/config/paths";
import Link from "next/link";
import ThemeSwitcher from "./theme-switcher";
import NavMobile from "./nav-mobile";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./language-switcher";

export default function Header() {
    const t = useTranslations("home");
    return (
        <header className="w-full">
            <nav className="container mx-auto mb-1 md:mb-5 mt-5 px-7 md:px-10 flex items-center justify-between">
                <Link href={paths.home()}>
                    <h1 className="font-semibold text-2xl md:text-3xl dark:text-white">
                        <span className="text-yellow-700 dark:invert">
                            {"</>"}
                        </span>
                        albertonet
                    </h1>
                </Link>
                <div
                    id="navbar-default"
                    className="hidden lg:flex items-center justify-center gap-4"
                >
                    <Link
                        className="hover:text-blue-800 dark:hover:text-blue-400 duration-150"
                        href={paths.projects()}
                    >
                        {t("projectLink")}
                    </Link>
                    <Link
                        className="hover:text-blue-800 dark:hover:text-blue-400 duration-150"
                        href={paths.blog()}
                    >
                        {t("blogLink")}
                    </Link>
                    <Link
                        className="hover:text-blue-800 dark:hover:text-blue-400 duration-150"
                        href={paths.contact()}
                    >
                        {t("contactLink")}
                    </Link>
                    <LanguageSwitcher />
                    <ThemeSwitcher />
                </div>
                <NavMobile />
            </nav>
        </header>
    );
}
