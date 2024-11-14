import { PostService } from "@/domain/services/posts";
import { useTranslations } from "next-intl";
import { Suspense, use } from "react";
import PostCard from "./post-card";

export default function PostList() {
    const t = useTranslations("blog");
    const topPosts = use(PostService.getPosts());

    return (
        <section
            id="top-posts-list"
            className="container flex flex-col items-center gap-5 px-8"
        >
            <h2 className="text-3xl font-semibold tracking-wide">
                {t("title")}
            </h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <Suspense fallback={<div>Loading...</div>}>
                    {topPosts
                        .sort(
                            (a, b) =>
                                b.publicationDate.getTime() -
                                a.publicationDate.getTime(),
                        )
                        .map((post) => (
                            <PostCard key={post.slug} post={post} />
                        ))}
                </Suspense>
            </div>
        </section>
    );
}
