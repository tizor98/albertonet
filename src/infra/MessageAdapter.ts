import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type { ContactMessage } from "@/core/types";

const source = import.meta.env.EMAIL_SOURCE ?? "";
const recipient = import.meta.env.EMAIL_DESTINATION ?? "";

const emailClient = new SESClient({
    credentials: {
        accessKeyId: import.meta.env.MY_AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: import.meta.env.MY_AWS_SECRET_ACCESS_KEY ?? "",
    },
    region: import.meta.env.MY_AWS_REGION ?? "",
});

export class MessageAdapter {
    constructor(private readonly emailClient: SESClient) {}

    public async sendContactEmail(data: ContactMessage): Promise<void> {
        if (source.length === 0 || recipient.length === 0) {
            console.warn(
                "A source or recipient must be been defined before sending emails",
            );
            return;
        }

        const command = new SendEmailCommand({
            Source: source,
            Destination: {
                ToAddresses: [recipient],
            },
            Message: {
                Body: {
                    Text: { Data: data.message },
                },
                Subject: {
                    Data: `${data.isCompany ? "IS COMPANY | " : ""}${data.name} ${data.email}`,
                },
            },
        });

        try {
            const result = await this.emailClient.send(command);
            console.log(`Email sent to ${recipient}: ${result.MessageId}`);
        } catch (error) {
            console.error(`Error sending email to ${recipient}: ${error}`);
            throw new Error(`Failed to send email to ${recipient}`, {
                cause: error,
            });
        }
    }
}

export const messageAdapter = new MessageAdapter(emailClient);
