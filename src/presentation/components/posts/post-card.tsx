import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Post } from "@/domain/types/post";
import { Link } from "@/infrastructure/i18n/routing";
import { paths } from "@/infrastructure/paths";
import { cn } from "@/lib/utils";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../ui/card";

interface Props {
    post: Post;
    className?: string;
}

export default function PostCard({ post, className }: Props) {
    const t = useTranslations("blog");

    return (
        <Card className={cn("min-h-fit md:min-h-full relative", className)}>
            <div className="absolute top-1 right-1 flex gap-1 items-center justify-end w-36">
                {Date.now() - post.publicationDate.getTime() <
                    1000 * 60 * 60 * 24 * 7 * 30 && (
                    <>
                        <Star className="fill-black dark:fill-white" />
                        <span className="text-xs">{t("recent")}</span>
                    </>
                )}
            </div>
            <CardHeader className="pb-3">
                <CardTitle className="flex justify-start items-start pr-9">
                    <Link href={paths.blogPost(post.slug)}>
                        <p className="flex-1 line-clamp-2 hover:text-blue-500 dark:hover:text-blue-800 duration-150">
                            {post.title}
                        </p>
                    </Link>
                </CardTitle>
                <CardDescription>
                    <div>
                        <p>Alberto Ortiz</p>
                        <p>{post.publicationDate.toLocaleDateString()}</p>
                    </div>
                </CardDescription>
            </CardHeader>
            <CardContent className="text-sm lg:text-base font-medium pb-3">
                <p className="line-clamp-4">{post.description}</p>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-start gap-2 text-sm">
                {post.categories.map((category) => {
                    return (
                        <p
                            key={category}
                            className="bg-blue-300 dark:bg-blue-800 text-center text-black dark:text-white px-2 py-1 rounded-lg"
                        >
                            {category}
                        </p>
                    );
                })}
            </CardFooter>
        </Card>
    );
}
