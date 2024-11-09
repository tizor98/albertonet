import type { Project } from "../types/project";

export const ProjectService = {
    async getTopProjects(): Promise<Project[]> {
        return dummyData;
    },
};

const dummyData: Project[] = [
    {
        locale: {
            en: {
                title: "genpass",
                description:
                    "CLI tool to generate and manage passwords locally",
                detail: "It manages and creates passwords locally. You can optionally set up users to store those.\n\nIf you use users, all information is store in a local sqlite3 database.\n\nGenpass by default encrypts the generated passwords and the entities for which the passwords are generated with the user password. Which in turn is saved in a hash form in a local database.\n\nThis projects is develop using the Cobra library. For more information visit https://github.com/spf13/cobra.",
            },
            es: {
                title: "genpass",
                description:
                    "Aplicación CLI para generar y gestionar contraseñas localmente",
                detail: "Gestiona y crea contraseñas localmente. Opcionalmente, puede configurar usuarios para almacenar those.\n\nIf utiliza los usuarios, toda la información se almacena en una base de datos local sqlite3.\n\nGenpass por defecto encripta las contraseñas generadas y las entidades para las que se generan las contraseñas con la contraseña de usuario. Que a su vez se guarda en forma de hash en una base de datos local.\n\nEste proyecto se desarrolla utilizando la librería Cobra. Para más información visite https://github.com/spf13/cobra.",
            },
        },
        inProgress: false,
        repoUrl: "https://github.com/tizor98/genpass",
    },
    {
        locale: {
            en: {
                title: "albertonet.com",
                description: "Blog, learning, and personal website",
                detail: "Albertonet is where I present my software development portfolio, including full-stack web applications, mobile apps, and other projects I've built over the years.\nAdditionally, I use the site as a blog to write about programming, technology, industry trends, and personal reflections on being a software developer. You can find:\n\nPortfolio: A curated list of my professional software development projects.\nBlog: A section where I share articles, tutorials, and thoughts on software development, best practices, and more.\nContact: A form where you can reach out to discuss potential collaborations, job opportunities, or simply ask questions about my work.",
            },
            es: {
                title: "albertonet.com",
                description: "Blog, aprendizaje y sitio web personal",
                detail: "Albertonet es donde presento mi portafolio de software, incluyendo aplicaciones web full-stack, aplicaciones móviles, y otros proyectos que he construido a lo largo de los años.\nAdemás, es un blog para escribir sobre programación, tecnología, tendencias de la industria, y reflexiones personales sobre ser un desarrollador de software. Puedes encontrar:\n\nProyectos: Una lista de mis proyectos profesionales de desarrollo de software. \nBlog: Una sección donde comparto artículos, tutoriales y reflexiones sobre desarrollo de software, buenas prácticas y mucho más.\nContacto: Un formulario donde puedes ponerte en contacto para discutir posibles colaboraciones, oportunidades de trabajo, o simplemente hacer preguntas acerca de mi trabajo.",
            },
        },
        inProgress: true,
        repoUrl: "https://github.com/tizor98/albertonet",
        deployUrl: "https://www.albertonet.com/",
        lastDeployDate: new Date(),
    },
    {
        locale: {
            en: {
                title: "mypods",
                description:
                    "Mobile app to use any apple airpods with any android smartphone",
                detail: "mypods is a mobile app that allows you to seamlessly connect any Apple AirPods with any Android smartphone.\n\nWith a user-friendly interface and easy setup, mypods makes it possible to pair and enjoy all the features of your AirPods, even on non-Apple devices.",
            },
            es: {
                title: "mypods",
                description:
                    "Aplicación móvil para usar cualquier airpods de apple con cualquier smartphone android",
                detail: "mypods es una aplicación móvil que te permite conectar sin problemas cualquier AirPods de Apple con cualquier smartphone Android.\n\nCon una interfaz fácil de usar y una configuración sencilla, mypods hace posible emparejar y disfrutar de todas las funciones de tus AirPods, incluso en dispositivos que no sean de Apple.",
            },
        },
        inProgress: true,
    },
];
