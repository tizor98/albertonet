import { defineStorage } from "@aws-amplify/backend";

export const backendBucket = defineStorage({
    name: "albertonet-bucket",
    versioned: true,
});
