import { ArrowBigLeft, Construction } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/infrastructure/i18n/routing";
import { paths } from "@/infrastructure/paths";
import { Button } from "../ui/button";

export default function PageInConstruction() {
    const t = useTranslations("error");
    return (
        <main className="container mx-auto min-h-[600px] flex flex-col items-center justify-center gap-5">
            <h2 className="text-yellow-500 font-bold text-2xl flex flex-col items-center text-center gap-1">
                <Construction className="text-yellow-400" size={50} />
                {t("pageInConstruction")}
            </h2>
            <p className="text-lg font-semibold">{t("comeBackSoon")}</p>
            <Link href={paths.home()}>
                <Button variant={"default"}>
                    <ArrowBigLeft />
                    {t("goHomepage")}
                </Button>
            </Link>
        </main>
    );
}
