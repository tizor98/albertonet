import PostList from "@/presentation/components/posts/post-list";

export default function BlogPage() {
    return (
        <main className="container mx-auto h-full flex flex-col items-center justify-center gap-5">
            <PostList />
        </main>
    );
}
