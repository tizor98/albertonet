import { paths } from "@/config/paths";
import { Button } from "@/presentation/components/ui/button";
import Link from "next/link";

export default function DefaultNotFound() {
    return (
        <section className="container mx-auto min-h-96 flex flex-col items-center justify-center gap-5">
            <h2 className="text-red-500 font-semibold text-2xl">
                404. This page was not found 😢
            </h2>
            <Link href={paths.home()}>
                <Button variant={"default"}>Go back to home</Button>
            </Link>
        </section>
    );
}
