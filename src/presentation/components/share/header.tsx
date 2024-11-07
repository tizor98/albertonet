import Link from "next/link";

export default function Header() {
    return (
        <header className="w-full">
            <nav className="container mx-auto my-5 flex items-center justify-between">
                <h1 className="font-semibold text-4xl">
                    <span className="text-yellow-700">{"</>"}</span>
                    albertonet
                </h1>
                <div className="flex items-center justify-center gap-4">
                    <Link href={""}>Portfolio</Link>
                    <Link href={""}>Blog</Link>
                    <Link href={""}>Contact</Link>
                </div>
            </nav>
        </header>
    );
}
