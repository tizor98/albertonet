import { paths } from "@/config/paths";
import { ArrowBigLeft, Construction } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

export default function PageInConstruction() {
    return (
        <main className="container mx-auto min-h-[600px] flex flex-col items-center justify-center gap-5">
            <h2 className="text-yellow-500 font-bold text-2xl flex flex-col items-center gap-1">
                <Construction className="text-yellow-400" size={50} />
                !!This page is under construction!!
            </h2>
            <p className="text-lg font-semibold">Come back later</p>
            <Link href={paths.home()}>
                <Button variant={"default"}>
                    <ArrowBigLeft />
                    Go to homepage
                </Button>
            </Link>
        </main>
    );
}
