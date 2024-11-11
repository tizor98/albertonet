import { paths } from "@/infrastructure/paths";
import { sendMessage } from "@/presentation/actions/contact";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

export function useContactForm() {
    const t = useTranslations("contact");
    const router = useRouter();

    const [formState, action, isPending] = useActionState(sendMessage, {
        status: "pending",
    });

    useEffect(() => {
        if (formState.status === "send") {
            toast.success(t("messageSend"));
            router.push(paths.contactSend());
        } else if (formState.status === "error") {
            toast.error(t("messageError"));
        }
    }, [formState.status, router.push, t]);

    const isFormLoading = isPending || formState.status === "send";

    return {
        formState,
        action,
        isFormLoading,
    };
}
