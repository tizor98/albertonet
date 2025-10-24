import type { availableLanguages } from "@/config/i18n/messages";

export type Project = {
    inProgress: boolean;
    repoUrl?: string;
    deployUrl?: string;
    lastDeployDate?: Date;
    image?: string;
    locale: Record<(typeof availableLanguages)[number], ProjectDetail>;
};

export type ProjectDetail = {
    title: string;
    description: string;
    detail: string;
};

export type ContactMessage = {
    name: string;
    email: string;
    message: string;
    isCompany: boolean;
};
