import { ProjectService } from "@/domain/services/project";
import ProjectCard from "../projects/project-card";
import Link from "next/link";
import { paths } from "@/config/paths";
import { Button } from "../ui/button";
import { ArrowBigRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { i18n } from "@/config/i18n/i18n";

export default async function TopProjectList() {
    const t = await getTranslations("home");
    const projects = await ProjectService.getTopProjects();

    if (0 === projects.length) return <></>;

    return (
        <section
            id="top-project-list"
            className="container flex flex-col items-center gap-5 px-8"
        >
            <h2 className="text-3xl font-semibold tracking-wide">
                {t("topProjects")}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {projects.map((project) => (
                    <ProjectCard
                        key={project.locale[i18n.defaultLocale].title}
                        project={project}
                    />
                ))}
            </div>
            <Button variant={"link"} className="self-start">
                <Link href={paths.projects()}>
                    <div className="flex items-center text-lg gap-1">
                        <ArrowBigRight />
                        <p>{t("seeMore")}</p>
                    </div>
                </Link>
            </Button>
        </section>
    );
}
