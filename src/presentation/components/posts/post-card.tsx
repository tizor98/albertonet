import type { Post } from "@/domain/types/post";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../ui/card";
import Link from "next/link";
import { paths } from "@/infrastructure/paths";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface Props {
    post: Post;
    className?: string;
}

export default function PostCard({ post, className }: Props) {
    const t = useTranslations("blog");

    return (
        <Link href={paths.blogPost(post.slug)}>
            <Card className={cn("min-h-fit md:min-h-full relative", className)}>
                <div className="absolute top-1 right-1 flex gap-1 items-center justify-end w-36">
                    {new Date().getTime() - post.publicationDate.getTime() <
                        1000 * 60 * 60 * 24 * 7 * 30 && (
                        <>
                            <Star className="fill-black dark:fill-white" />
                            <span className="text-xs">{t("recent")}</span>
                        </>
                    )}
                </div>
                <CardHeader className="pb-3">
                    <CardTitle className="flex justify-start items-start pr-9">
                        <p className="flex-1 line-clamp-2">{post.title}</p>
                    </CardTitle>
                    <CardDescription>
                        {post.publicationDate.toLocaleDateString()}
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-sm lg:text-base font-medium pb-3">
                    <p className="line-clamp-4">{post.description}</p>
                </CardContent>
                <CardFooter className="flex justify-start gap-3">
                    {post.categories.map((category) => {
                        return (
                            <p
                                key={category}
                                className="bg-blue-300 dark:bg-blue-800 text-black dark:text-white px-2 py-1 rounded-lg"
                            >
                                {category}
                            </p>
                        );
                    })}
                </CardFooter>
            </Card>
        </Link>
    );
}
