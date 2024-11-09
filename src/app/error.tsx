"use client";
import { paths } from "@/config/paths";
import { Button } from "@/presentation/components/ui/button";
import Link from "next/link";

export default function DefaultNotFound() {
    return (
        <main className="container mx-auto min-h-[600px] flex flex-col items-center justify-center gap-5">
            <h2 className="text-red-500 font-bold text-2xl">
                500. An unexpected error ocurred. Please try again later
            </h2>
            <Link href={paths.home()}>
                <Button variant={"default"}>Go back to home</Button>
            </Link>
        </main>
    );
}
