import { defineFunction, secret } from "@aws-amplify/backend";

export const sendMessage = defineFunction({
    environment: {
        EMAIL_DESTINATION: secret("EMAIL_DESTINATION"),
        EMAIL_SOURCE: secret("EMAIL_SOURCE"),
    },
});
