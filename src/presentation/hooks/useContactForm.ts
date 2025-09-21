import { useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { sendMessage } from "@/presentation/actions/contact";

export function useContactForm() {
    const t = useTranslations("contact");

    const [formState, action, isPending] = useActionState(sendMessage, {
        status: "pending",
    });

    useEffect(() => {
        if (formState.status?.startsWith("error")) {
            toast.error(t("messageError"));
        }
    }, [formState.status, t]);

    return {
        formState,
        action,
        isFormLoading: isPending,
    };
}
