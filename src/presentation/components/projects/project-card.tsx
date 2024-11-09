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

interface Props {
    project: Project;
    className?: string;
}

export default function ProjectCard({ project, className }: Props) {
    return (
        <Card className={cn("min-h-full", className)}>
            <CardHeader>
                <CardTitle className="flex justify-between items-start gap-1">
                    <p className="flex-1">{project.title}</p>
                    <div className="flex gap-1 items-center justify-end w-36">
                        {project.inProgress ? (
                            <>
                                <Construction className="text-yellow-400" />
                                <span className="text-xs">
                                    under construction
                                </span>
                            </>
                        ) : (
                            <>
                                <CircleCheck className="text-green-500" />
                                <span className="text-xs">completed</span>
                            </>
                        )}
                    </div>
                </CardTitle>
                <CardDescription>{project.description}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm font-light">
                <TextWithSpaces text={project.detail} />
            </CardContent>
            <CardFooter className="flex justify-between">
                {project.repoUrl && (
                    <Button variant="outline">
                        <Link target="_blank" href={project.repoUrl}>
                            See repo
                        </Link>
                    </Button>
                )}
                {project.deployUrl && (
                    <Button>
                        <Link target="_blank" href={project.deployUrl}>
                            See deploy
                        </Link>
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
