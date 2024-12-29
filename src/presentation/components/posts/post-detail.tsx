import type { Post } from "@/domain/types/post";
import { BASE_URL } from "@/infrastructure/contants";
import { CustomMDX } from "./mdx";

interface Props {
    post: Post;
}

export default function PostDetail({ post }: Props) {
    return (
        <>
            <script
                type="application/ld+json"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BlogPosting",
                        headline: post.title,
                        datePublished: post.publicationDate,
                        dateModified: post.lastModifiedDate,
                        description: post.description,
                        image: post.image
                            ? `${BASE_URL}/${post.image}`
                            : `/og?title=${encodeURIComponent(post.title)}`,
                        url: `${BASE_URL}/blog/${post.slug}`,
                        author: {
                            "@type": "Person",
                            name: "Alberto Ortiz",
                        },
                    }),
                }}
            />
            <h1 className="title font-semibold text-2xl tracking-tighter">
                {post.title}
            </h1>
            <div className="flex flex-col justify-center items-start mt-2 mb-8 text-sm">
                <p>Alberto Ortiz</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {post.publicationDate.toLocaleDateString()}
                </p>
            </div>
            <article className="prose">
                <CustomMDX source={post.content} />
            </article>
        </>
    );
}
