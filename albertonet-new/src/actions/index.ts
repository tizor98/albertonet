import { defineAction } from "astro:actions";
import { z } from "astro:schema";

export const server = {
    sendNotification: defineAction({
        input: z.object({
            name: z.string().max(164),
            email: z.string().email(),
            message: z.string(),
            isCompany: z.boolean(),
        }),
        handler: async ({ name, email, message, isCompany }) => {
            return {
                message: "Your message was send successfully",
                errros: ["error"],
            };
        },
    }),
};
