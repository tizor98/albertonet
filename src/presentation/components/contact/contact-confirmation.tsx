import { Link } from "@/infrastructure/i18n/routing";
import { Button } from "../ui/button";
import { paths } from "@/infrastructure/paths";
import { useTranslations } from "next-intl";

export default function ContactSendConfirmation() {
    const t = useTranslations();
    return (
        <section
            id="contact-notification"
            className="w-full min-h-96 flex items-center justify-center"
        >
            <div className="flex flex-col gap-5 text-center">
                <h2>{t("contact.notification.send")}</h2>
                <div className="flex gap-3">
                    <Link href={paths.home()}>
                        <Button type="submit">
                            {t("contact.notification.goHome")}
                        </Button>
                    </Link>
                    <Link href={paths.contact()}>
                        <Button variant={"secondary"}>
                            {t("contact.notification.other")}
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
