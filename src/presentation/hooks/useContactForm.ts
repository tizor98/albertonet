import { sendMessage } from "@/presentation/actions/contact";
import { useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

export function useContactForm() {
    const t = useTranslations("contact");

    const [formState, action, isPending] = useActionState(sendMessage, {
        status: "pending",
    });

    useEffect(() => {
        if (formState.status === "error") {
            toast.error(t("messageError"));
        }
    }, [formState.status, t]);

    const isFormLoading = isPending;

    return {
        formState,
        action,
        isFormLoading,
    };
}
