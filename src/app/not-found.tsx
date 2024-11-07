import { paths } from "@/config/paths";
import Link from "next/link";

export default function DefaultNotFound() {
    return (
        <section className="container mx-auto min-h-96 flex flex-col items-center justify-center">
            <h2 className="text-red-500 font-semibold text-2xl">
                404. This page was not found
            </h2>
            <Link className="underline" href={paths.home()}>
                Go back to home
            </Link>
        </section>
    );
}
