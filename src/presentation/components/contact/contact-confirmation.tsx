"use client";
import { Link } from "@/infrastructure/i18n/routing";
import { paths } from "@/infrastructure/paths";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";

export default function ContactSendConfirmation() {
    const t = useTranslations("contact");

    useEffect(() => {
        toast.success(t("messageSend"));
    });

    return (
        <section
            id="contact-notification"
            className="w-full min-h-96 flex items-center justify-center"
        >
            <div className="flex flex-col gap-5 text-center">
                <h2>{t("notification.send")}</h2>
                <div className="flex gap-3">
                    <Link href={paths.home()}>
                        <Button type="submit">
                            {t("notification.goHome")}
                        </Button>
                    </Link>
                    <Link href={paths.contact()}>
                        <Button variant={"secondary"}>
                            {t("notification.other")}
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
