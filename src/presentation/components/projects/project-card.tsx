import type { Project } from "@/domain/types/project";
import { Button } from "../ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../ui/card";
import Link from "next/link";
import TextWithSpaces from "../ui/text-with-spaces";
import { CircleCheck, Construction } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { i18n, type Locale } from "@/config/i18n/i18n";

interface Props {
    project: Project;
    className?: string;
}

export default function ProjectCard({ project, className }: Props) {
    const l = useLocale() as Locale;
    const t = useTranslations();
    return (
        <Card className={cn("min-h-full", className)}>
            <CardHeader>
                <CardTitle className="flex justify-between items-start gap-1">
                    <p className="flex-1">
                        {project.locale[l].title ??
                            project.locale[i18n.defaultLocale].title}
                    </p>
                    <div className="flex gap-1 items-center justify-end w-36">
                        {project.inProgress ? (
                            <>
                                <Construction className="text-yellow-400" />
                                <span className="text-xs">
                                    {t("generic.underConstruction")}
                                </span>
                            </>
                        ) : (
                            <>
                                <CircleCheck className="text-green-500" />
                                <span className="text-xs">
                                    {t("generic.completed")}
                                </span>
                            </>
                        )}
                    </div>
                </CardTitle>
                <CardDescription>
                    {project.locale[l].description ??
                        project.locale[i18n.defaultLocale].description}
                </CardDescription>
            </CardHeader>
            <CardContent className="text-sm font-light">
                <TextWithSpaces
                    text={
                        project.locale[l].detail ??
                        project.locale[i18n.defaultLocale].detail
                    }
                />
            </CardContent>
            <CardFooter className="flex justify-between">
                {project.repoUrl && (
                    <Button variant="outline">
                        <Link target="_blank" href={project.repoUrl}>
                            {t("projects.seeRepo")}
                        </Link>
                    </Button>
                )}
                {project.deployUrl && (
                    <Button>
                        <Link target="_blank" href={project.deployUrl}>
                            {t("projects.seeDeploy")}
                        </Link>
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
