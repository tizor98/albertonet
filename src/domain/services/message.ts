import { workerAdapter } from "@/infrastructure/serverless-adapter";

export const MessageService = {
    async sendMessagge(data: string): Promise<void> {
        return workerAdapter.sendEmail(data);
    },
};
