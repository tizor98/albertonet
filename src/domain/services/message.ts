import {
    serverlessClient,
    SERVERLESS_SEND_MESSAGE_NAME,
} from "@/infrastructure/serverless";
import { InvokeCommand } from "@aws-sdk/client-lambda";

export const MessageService = {
    async sendMessagge(data: string): Promise<void> {
        const sendMessageFunction = new InvokeCommand({
            FunctionName: SERVERLESS_SEND_MESSAGE_NAME,
            InvocationType: "RequestResponse",
            Payload: data,
        });

        let statusCode: { StatusCode: number };
        try {
            const response = await serverlessClient.send(sendMessageFunction);
            const statusCodeJson = new TextDecoder().decode(response.Payload);
            statusCode = JSON.parse(statusCodeJson);
        } catch (error) {
            throw new Error("Send message failed while parsing response", {
                cause: error,
            });
        }

        if (statusCode.StatusCode !== 200) {
            throw new Error(
                `Send message failed for status code: ${statusCode.StatusCode}`,
            );
        }

        return;
    },
};
