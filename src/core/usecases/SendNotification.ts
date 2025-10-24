import { messageAdapter } from "@/infra/MessageAdapter";
import type { ContactMessage } from "../types";

export async function sendNotification(
    contactInput: ContactMessage,
): Promise<void> {
    return messageAdapter.sendContactEmail(contactInput);
}
