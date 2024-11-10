"use server";
import { isValidEmail } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

interface FormState {
    email?: string;
    message?: string;
    name?: string;
    isCompany?: boolean;
    status: "pending" | "send" | "error";
    errors?: string[];
}

export async function sendMessage(
    state: FormState,
    formData: FormData,
): Promise<FormState> {
    await new Promise((r) => setTimeout(r, 1000));
    const t = await getTranslations("contact.error");

    const name = formData.get("name") ?? "";
    const email = formData.get("email") ?? "";
    const message = formData.get("message") ?? "";
    const isCompany = formData.get("isCompany");

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

    // TODO: Implement the message sending

    return {
        name: name.toString(),
        email: email.toString(),
        message: message.toString(),
        isCompany: isCompany?.toString() === "on",
        status:
            0 === errors.length
                ? "send"
                : 1 === errors.length
                  ? "error"
                  : "pending",
        errors,
    };
}
