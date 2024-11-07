import { paths } from "@/config/paths";
import Link from "next/link";
import ThmeSwitcher from "./theme-switcher";

export default function Header() {
    return (
        <header className="w-full">
            <nav className="container mx-auto my-5 flex items-center justify-between">
                <Link href={paths.home()}>
                    <h1 className="font-semibold text-3xl">
                        <span className="text-yellow-700">{"</>"}</span>
                        albertonet
                    </h1>
                </Link>
                <div className="flex items-center justify-center gap-4">
                    <Link href={""}>Portfolio</Link>
                    <Link href={""}>Blog</Link>
                    <Link href={""}>Contact</Link>
                    <ThmeSwitcher />
                </div>
            </nav>
        </header>
    );
}
