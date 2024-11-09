import type en from "@/config/messages/en.json";

type Messages = typeof en;

declare global {
    // Use type safe message keys with `next-intl`
    interface IntlMessages extends Messages {}
}
