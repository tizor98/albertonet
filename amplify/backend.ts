import { defineBackend } from "@aws-amplify/backend";
import { sendMessage } from "./functions/send-message/resource";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { backendBucket } from "./storage/resource";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
    sendMessage,
    backendBucket,
});

backend.addOutput({
    custom: {
        FUNCTION_NAME: backend.sendMessage.resources.lambda.functionName,
    },
});

const allowSendEmails = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["ses:SendEmail", "ses:SendRawEmail"],
    resources: ["*"],
});

backend.sendMessage.resources.lambda.addToRolePolicy(allowSendEmails);
