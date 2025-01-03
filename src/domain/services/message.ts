import { messageAdapter } from "@/infrastructure/message-adapter";
import type { ContactMessage } from "../types/message";

export const MessageService = {
    async sendContactNotification(data: ContactMessage): Promise<void> {
        return messageAdapter.sendContactEmail(data);
    },
};
