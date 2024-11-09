export type Project = {
    title: string;
    description: string;
    detail: string;
    inProgress: boolean;
    repoUrl?: string;
    deployUrl?: string;
    lastDeployDate?: Date;
    image?: string;
};
