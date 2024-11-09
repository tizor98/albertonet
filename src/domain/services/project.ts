import type { Project } from "../types/project";

export const ProjectService = {
    async getTopProjects(): Promise<Project[]> {
        return dummyData;
    },
};

const dummyData: Project[] = [
    {
        title: "genpass",
        description: "CLI tool to generate and manage passwords locally",
        detail: "It manages and creates passwords locally. You can optionally set up users to store those.\n\nIf you use users, all information is store in a local sqlite3 database.\n\nGenpass by default encrypts the generated passwords and the entities for which the passwords are generated with the user password. Which in turn is saved in a hash form in a local database.\n\nThis projects is develop using the Cobra library. For more information visit https://github.com/spf13/cobra.",
        inProgress: false,
        repoUrl: "https://github.com/tizor98/genpass",
    },
    {
        title: "albertonet.com",
        description: "Blog, learning, and personal website ",
        detail: "Albertonet is a space where I can present my software development portfolio, including full-stack web applications, mobile apps, and other projects I've built over the years.\nAdditionally, I use the site as a blog to write about programming, technology, industry trends, and personal reflections on being a software developer. You can find:\n\nPortfolio: A curated list of my professional software development projects.\nBlog: A section where I share articles, tutorials, and thoughts on software development, best practices, and more.\nContact: A form where visitors can reach out to discuss potential collaborations, job opportunities, or simply ask questions about my work.",
        inProgress: true,
        repoUrl: "https://github.com/tizor98/albertonet",
        deployUrl: "https://www.albertonet.com/",
        lastDeployDate: new Date(),
    },
    {
        title: "mypods",
        description:
            "Mobile app to use any apple airpods with any android smartphone",
        detail: "mypods is a mobile app that allows you to seamlessly connect any Apple AirPods with any Android smartphone.\n\nWith a user-friendly interface and easy setup, mypods makes it possible to pair and enjoy all the features of your AirPods, even on non-Apple devices.",
        inProgress: true,
    },
];
