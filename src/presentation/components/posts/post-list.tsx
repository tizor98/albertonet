import { use } from "react";
import { PostService } from "@/domain/services/posts";
import PostCard from "./post-card";

export default function PostList() {
    const topPosts = use(PostService.getPosts());
    return (
        <>
            {topPosts
                .sort(
                    (a, b) =>
                        b.publicationDate.getTime() -
                        a.publicationDate.getTime(),
                )
                .map((post) => (
                    <PostCard key={post.slug} post={post} />
                ))}
        </>
    );
}
