import { type AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import type { PropsWithChildren } from "react";
import ThemeProvider from "./theme-provider";

interface Props extends PropsWithChildren {
    msg: AbstractIntlMessages;
}

export default function Providers({ children, msg }: Props) {
    return (
        <NextIntlClientProvider messages={msg}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                {children}
            </ThemeProvider>
        </NextIntlClientProvider>
    );
}
