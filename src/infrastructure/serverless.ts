import { LambdaClient } from "@aws-sdk/client-lambda";
import outputs from "../../amplify_outputs.json";

export const SERVERLESS_SEND_MESSAGE_NAME = outputs.custom.FUNCTION_NAME ?? "";

export const serverlessClient = new LambdaClient();
