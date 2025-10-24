import { CLOUD_CERTIFICATION_URL } from "@/consts";

export const en = {
    generic: {
        underConstruction: "in progress",
        completed: "completed",
        send: "send",
    },
    home: {
        projectLink: "Projects",
        blogLink: "Blog",
        contactLink: "Contact",
        darkTheme: "Dark",
        lightTheme: "Light",
        systemTheme: "System",
        topProjects: "Top 3 projects",
        topPosts: "Top blog posts",
        seeMore: "See more ...",
        hero: {
            title: "Hi, I'm Alberto",
            point1: `I'm a <span class="font-bold underline">self-taught</span> Software Developer focused on Backend with Java and Golang, Frontend with React, Mobile development with React Native, and cloud services with AWS (<a href="${CLOUD_CERTIFICATION_URL}" target="_blank"><span class="underline">Certified Developer - Associate</span></a>) and Cloudflare`,
            point2: `I'm also a <span class="font-bold underline">content creator</span> and owner of this personal space you're visiting`,
            point3: `Here you can find programming-related blogs, review my projects, and <span class="font-bold underline">contact me</span> for freelance or full-time jobs`,
        },
    },
    error: {
        pageInConstruction: "¡¡This page is under construction!!",
        comeBackSoon: "Come back soon",
        goHomepage: "Go to homepage",
        notFound: "404. This page was not found",
        internalError:
            "500. An unexpected error ocurred. Please try again later",
        goBack: "Go back to home",
    },
    projects: {
        seeRepo: "See repo",
        seeDeploy: "See deploy",
    },
    contact: {
        isCompany: "The message is from a company?",
        name: "name",
        email: "email",
        message: "message",
        messageSend: "Your message was send successfully",
        messageError: "An unexpected error ocurr. Please try again later",
        notification: {
            send: "¡¡Perfect!! Your message was send",
            goHome: "Go home",
            other: "Send other message",
        },
        error: {
            nameIsBlank: "Name can not be blank",
            emailIsBlank: "Email can not be blank",
            emailIsNotValid: "Email is not valid",
            messageToShort: "Message must be at least of 10 characters",
        },
    },
    blog: {
        title: "Posts",
        recent: "¡New!",
        lastUpdated: "Last updated on",
    },
    metadata: {
        contact: "Contact",
        send: "Contacted",
        blog: "Blog",
    },
} as const;
