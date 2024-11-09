import { paths } from "@/config/paths";
import Link from "next/link";
import ThemeSwitcher from "./theme-switcher";
import NavMobile from "./nav-mobile";

export default function Header() {
    return (
        <header className="w-full">
            <nav className="container mx-auto my-5 px-10 flex items-center justify-between">
                <Link href={paths.home()}>
                    <h1 className="font-semibold text-3xl dark:text-white">
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
                        Projects
                    </Link>
                    <Link
                        className="hover:text-blue-800 dark:hover:text-blue-400 duration-150"
                        href={paths.blog()}
                    >
                        Blog
                    </Link>
                    <Link
                        className="hover:text-blue-800 dark:hover:text-blue-400 duration-150"
                        href={paths.contact()}
                    >
                        Contact
                    </Link>
                    <ThemeSwitcher />
                </div>
                <NavMobile />
            </nav>
        </header>
    );
}
