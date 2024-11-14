import type { TopPost } from "@/domain/types/post";
import { paths } from "@/infrastructure/paths";
import Link from "next/link";

interface Props {
    topPost: TopPost;
}

export default function TopPostCard({ topPost }: Props) {
    return (
        <Link href={paths.blogPost(topPost.slug)}>
            <div className="flex flex-col gap-1 px-6 py-3 border bg-white dark:bg-slate-700 rounded-xl">
                <h3 className="text-lg font-semibold line-clamp-2">
                    {topPost.title}
                </h3>
                <p className="text-xs tracking-tight font-light">
                    {topPost.publicationDate}
                </p>
                <div className="flex gap-1">
                    {topPost.categories.split(";").map((category) => {
                        return (
                            <p
                                key={category}
                                className="bg-blue-300 dark:bg-blue-800 text-black dark:text-white px-2 py-1 rounded-lg"
                            >
                                {category}
                            </p>
                        );
                    })}
                </div>
            </div>
        </Link>
    );
}
