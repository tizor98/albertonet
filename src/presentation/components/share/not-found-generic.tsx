import { useTranslations } from "next-intl";
import { Link } from "@/infrastructure/i18n/routing";
import { paths } from "@/infrastructure/paths";
import { Button } from "../ui/button";

export default function NotFoundGeneric() {
    const t = useTranslations("error");

    return (
        <main className="container mx-auto min-h-[600px] flex flex-col items-center justify-center gap-5">
            <h2 className="text-red-500 font-bold text-2xl">
                {t("notFound")} 😢
            </h2>
            <Link href={paths.home()}>
                <Button variant={"default"}>{t("goBack")}</Button>
            </Link>
        </main>
    );
}
