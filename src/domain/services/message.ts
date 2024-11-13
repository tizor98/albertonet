import { workerAdapter } from "@/infrastructure/serverless-adapter";

export const MessageService = {
    async sendMessagge(data: string): Promise<void> {
        workerAdapter.sendEmail(data);
    },
};
