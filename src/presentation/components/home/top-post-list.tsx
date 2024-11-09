import { PostService } from "@/domain/services/posts";
import { Button } from "../ui/button";
import { ArrowBigRight } from "lucide-react";
import { paths } from "@/config/paths";
import PostCard from "../posts/post-card";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function TopPostsList() {
    const t = await getTranslations("home");
    const posts = await PostService.getTopPosts();

    if (0 === posts.length) return <></>;

    return (
        <section
            id="top-posts-list"
            className="container flex flex-col items-center gap-5 px-8"
        >
            <h2 className="text-3xl font-semibold tracking-wide">
                {t("topPosts")}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {posts.map((post) => (
                    <PostCard key={post.title} post={post} />
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
