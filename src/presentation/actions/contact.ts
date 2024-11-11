"use server";
import { isValidEmail } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import { MessageService } from "@/domain/services/message";

type FormStateStatus = "pending" | "send" | "error";

interface FormState {
    email?: string;
    message?: string;
    name?: string;
    isCompany?: boolean;
    status: FormStateStatus;
    errors?: string[];
}

export async function sendMessage(
    state: FormState,
    formData: FormData,
): Promise<FormState> {
    const t = await getTranslations("contact.error");

    const name = formData.get("name") ?? "";
    const email = formData.get("email") ?? "";
    const message = formData.get("message") ?? "";
    const isCompany = formData.get("isCompany") ?? "";

    const errors: string[] = [];

    if (name.toString().length === 0) {
        errors.push(t("nameIsBlank"));
    }

    if (email.toString().length === 0) {
        errors.push(t("emailIsBlank"));
    } else if (!isValidEmail(email.toString())) {
        errors.push(t("emailIsNotValid"));
    }

    if (message.toString().length < 10) {
        errors.push(t("messageToShort"));
    }

    let status: FormStateStatus = "pending";
    try {
        await MessageService.sendMessagge(
            JSON.stringify({
                name,
                email,
                message,
                isCompany: isCompany.toString() === "on",
            }),
        );
        status = "send";
    } catch (error) {
        console.error(error);
        status = "error";
    }

    return {
        name: name.toString(),
        email: email.toString(),
        message: message.toString(),
        isCompany: isCompany?.toString() === "on",
        status,
        errors,
    };
}
