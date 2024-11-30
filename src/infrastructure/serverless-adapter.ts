import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import outputs from "../../amplify_outputs.json";

const SERVERLESS_SEND_MESSAGE_NAME = outputs.custom.FUNCTION_NAME ?? "";

const lambdaClient = new LambdaClient({
    credentials: {
        accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY ?? "",
    },
});

export class ServerlessWorkerAdapter {
    constructor(private readonly lambdaClient: LambdaClient) {}

    public async sendEmail(data: string): Promise<void> {
        const invokeCommand = new InvokeCommand({
            FunctionName: SERVERLESS_SEND_MESSAGE_NAME,
            InvocationType: "RequestResponse",
            Payload: data,
        });

        let statusCode: { StatusCode: number };
        try {
            const response = await this.lambdaClient.send(invokeCommand);
            const statusCodeJson = new TextDecoder().decode(response.Payload);
            statusCode = JSON.parse(statusCodeJson);
        } catch (error) {
            throw new Error(
                "Send message failed while sending and parsing response",
                {
                    cause: error,
                },
            );
        }

        if (statusCode.StatusCode !== 200) {
            throw new Error(
                `Send message failed with status code: ${statusCode.StatusCode}`,
            );
        }
    }
}

export const workerAdapter = new ServerlessWorkerAdapter(lambdaClient);
