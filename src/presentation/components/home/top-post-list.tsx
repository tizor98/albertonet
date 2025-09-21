import { ArrowBigRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PostService } from "@/domain/services/posts";
import { Link } from "@/infrastructure/i18n/routing";
import { paths } from "@/infrastructure/paths";
import { Button } from "../ui/button";
import PostCard from "./top-post-card";

export default async function TopPostsList() {
    const t = await getTranslations("home");
    const topPosts = await PostService.getTopPosts();

    if (0 === topPosts.length) return;

    return (
        <section
            id="top-posts-list"
            className="container flex flex-col items-center gap-5 px-8"
        >
            <h2 className="text-3xl font-semibold tracking-wide">
                {t("topPosts")}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {topPosts.map((topPost) => (
                    <PostCard key={topPost.slug} topPost={topPost} />
                ))}
            </div>
            <Button variant={"link"} className="self-start">
                <Link href={paths.blog()}>
                    <div className="flex items-center text-lg gap-1">
                        <ArrowBigRight />
                        <p>{t("seeMore")}</p>
                    </div>
                </Link>
            </Button>
        </section>
    );
}
