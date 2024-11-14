import { PostService } from "@/domain/services/posts";
import PostDetail from "@/presentation/components/posts/post-detail";
import { notFound } from "next/navigation";

interface Props {
    params: Promise<{
        slug: string;
    }>;
}

export default async function BlogPost({ params }: Props) {
    const { slug } = await params;
    const post = await PostService.getPostBySlug(slug);

    if (!post) notFound();

    return (
        <main className="container mx-auto h-full flex flex-col items-center justify-start">
            <section id="post" className="max-w-6xl mt-10">
                <PostDetail post={post} />
            </section>
        </main>
    );
}
