"use client";
import { useTranslations } from "next-intl";
import { useContactForm } from "../../hooks/useContactForm";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";

export default function ContactForm() {
    const t = useTranslations();
    const { formState, action, isFormLoading } = useContactForm();

    return (
        <section
            id="contact-form"
            className="w-full h-full px-10 flex items-start justify-center"
        >
            <form
                action={action}
                className="w-full max-w-xl flex flex-col gap-5 mt-10 lg:mt-32"
            >
                <Input
                    name="name"
                    type="text"
                    placeholder={t("contact.name")}
                    defaultValue={formState.name}
                    disabled={isFormLoading}
                    required
                />
                <Input
                    name="email"
                    type="email"
                    placeholder={t("contact.email")}
                    defaultValue={formState.email}
                    disabled={isFormLoading}
                    required
                />
                <Textarea
                    name="message"
                    minLength={10}
                    placeholder={t("contact.message")}
                    defaultValue={formState.message}
                    disabled={isFormLoading}
                    required
                />
                <div className="w-full flex gap-3 items-center justify-between">
                    <Label htmlFor="isCompany">{t("contact.isCompany")}</Label>
                    <Switch
                        id="isCompany"
                        name="isCompany"
                        defaultChecked={formState.isCompany}
                        disabled={isFormLoading}
                    />
                </div>
                {formState.errors && 0 < formState.errors.length && (
                    <div className="text-red-500 flex flex-col gap-0 text-sm tracking-tight">
                        {formState.errors.map((error) => (
                            <p key={error}>{error}</p>
                        ))}
                    </div>
                )}
                <Button className="capitalize" disabled={isFormLoading}>
                    {t("generic.send")}
                </Button>
            </form>
        </section>
    );
}
