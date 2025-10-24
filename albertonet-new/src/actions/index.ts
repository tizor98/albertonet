import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { sendNotification } from "@/core/usecases/SendNotification";
import { getLangFromUrl, useTranslations } from "@/config/i18n/utils";
import { isValidEmail } from "@/config/helper";
import type { ContactMessage } from "@/core/types";

export const server = {
    sendNotification: defineAction({
        input: z.object({
            name: z.string().optional(),
            email: z.string().optional(),
            message: z.string().optional(),
            isCompany: z.boolean().optional(),
        }),
        accept: "form",
        handler: async (sendContactInput, ctx) => {
            try {
                const errors: string[] = [];
                const lang = getLangFromUrl(
                    new URL(ctx.request.headers.get("referer") ?? ""),
                );
                const t = useTranslations(lang, "contact.error");

                if (sendContactInput.name?.length === 0) {
                    errors.push(t("nameIsBlank"));
                }

                if (!sendContactInput.email) {
                    errors.push(t("emailIsBlank"));
                } else if (!isValidEmail(sendContactInput.email)) {
                    errors.push(t("emailIsNotValid"));
                }

                if (
                    sendContactInput.message &&
                    sendContactInput.message.length < 10
                ) {
                    errors.push(t("messageToShort"));
                }

                if (0 < errors.length) {
                    throw new ActionError({
                        code: "BAD_REQUEST",
                        message: errors.join(";"),
                    });
                }

                await sendNotification(sendContactInput as ContactMessage);
            } catch (error) {
                if (error instanceof ActionError) {
                    throw error;
                }
                console.error(error);
                throw new ActionError({ code: "INTERNAL_SERVER_ERROR" });
            }
        },
    }),
};
