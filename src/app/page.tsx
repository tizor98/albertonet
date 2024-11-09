import Hero from "@/presentation/components/home/hero";
import TopPostsList from "@/presentation/components/home/top-post-list";
import TopProjectList from "@/presentation/components/home/top-project-list";

export default function Home() {
    return (
        <main className="w-full flex flex-col items-center justify-start gap-10 mb-10">
            <Hero />
            <TopPostsList />
            <TopProjectList />
        </main>
    );
}
