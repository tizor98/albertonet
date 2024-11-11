import { LambdaClient } from "@aws-sdk/client-lambda";
import outputs from "../../amplify_outputs.json";
import { Amplify } from "aws-amplify";

Amplify.configure(outputs);

export const SERVERLESS_SEND_MESSAGE_NAME = outputs.custom.FUNCTION_NAME ?? "";

export const serverlessClient = new LambdaClient({
    credentials: {
        accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY ?? "",
    },
});
