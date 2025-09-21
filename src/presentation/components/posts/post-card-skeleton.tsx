import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export default function PostCardSkeleton() {
    return (
        <Card className={"h-[300] w-[900] min-h-fit md:min-h-full relative"}>
            <CardHeader className="pb-3">
                <CardTitle className="flex justify-start items-start pr-9">
                    <Skeleton className="w-[800] h-[50] flex-1 line-clamp-2 hover:text-blue-500 dark:hover:text-blue-800 duration-150" />
                </CardTitle>
                <CardDescription>
                    <Skeleton className="w-[80] h-[20] " />
                </CardDescription>
            </CardHeader>
            <CardContent className="text-sm lg:text-base font-medium pb-3">
                <Skeleton className="w-[800] h-[80] line-clamp-4" />
            </CardContent>
            <CardFooter className="flex flex-wrap justify-start gap-2 text-sm">
                <Skeleton className="w-[800] h-[40] bg-blue-300 dark:bg-blue-800 text-center text-black dark:text-white px-2 py-1 rounded-lg" />
            </CardFooter>
        </Card>
    );
}
