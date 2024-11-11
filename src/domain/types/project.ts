import type { Locale } from "@/infrastructure/i18n/i18n";

export type Project = {
    inProgress: boolean;
    repoUrl?: string;
    deployUrl?: string;
    lastDeployDate?: Date;
    image?: string;
    locale: Record<Locale, ProjectDetail>;
};

export type ProjectDetail = {
    title: string;
    description: string;
    detail: string;
};
