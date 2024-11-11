import type { Handler } from "aws-lambda";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { env } from "$amplify/env/send-message";

const emailClient = new SESClient({
    region: env.AWS_REGION,
});

const errorResponse = {
    StatusCode: 500,
};

interface SendMessageEvent {
    name: string;
    email: string;
    message: string;
    isCompany: boolean;
}

export const handler: Handler = async (event: SendMessageEvent, context) => {
    console.log("Lambda executing");

    const recipient = env.EMAIL_DESTINATION;
    const source = env.EMAIL_SOURCE;

    if (!recipient || !source) return errorResponse;

    try {
        await sendEmail(event, recipient, source);
    } catch (error) {
        return errorResponse;
    }

    return {
        StatusCode: 200,
    };
};

const sendEmail = async (
    event: SendMessageEvent,
    recipient: string,
    source: string,
) => {
    const command = new SendEmailCommand({
        Source: source,
        Destination: {
            ToAddresses: [recipient],
        },
        Message: {
            Body: {
                Text: { Data: event.message },
            },
            Subject: {
                Data: `${event.isCompany ? "IS COMPANY | " : ""}${event.name} ${event.email}`,
            },
        },
    });

    try {
        const result = await emailClient.send(command);
        console.log(`Email sent to ${recipient}: ${result.MessageId}`);
    } catch (error) {
        console.error(`Error sending email to ${recipient}: ${error}`);
        throw new Error(`Failed to send email to ${recipient}`, {
            cause: error,
        });
    }
};
