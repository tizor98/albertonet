import { CLOUD_CERTIFICATION_URL } from "@/consts";

export const es = {
    generic: {
        underConstruction: "en progreso",
        completed: "completado",
        send: "enviar",
    },
    home: {
        projectLink: "Proyectos",
        blogLink: "Blog",
        contactLink: "Contacto",
        darkTheme: "Oscuro",
        lightTheme: "Claro",
        systemTheme: "Sistema",
        topProjects: "Top 3 proyectos",
        topPosts: "Top publicaciones",
        seeMore: "Ver más ...",
        hero: {
            title: "Hola, soy Alberto",
            point1: `Soy Desarrollador de Software <span class="font-bold underline">autodidacta</span> enfocado en Backend con Java y Golang, Frontend con React, Desarrollo móvil con React Native, y servicios en la nube con AWS (<a href="${CLOUD_CERTIFICATION_URL}" target="_blank"><span class="underline">Certified Developer - Associate</span></a>) y Cloudflare`,
            point2: `También soy <span class="font-bold underline">creador de contenido</span> y propietario de este lugar personal que estás visitando`,
            point3: `Aquí puedes encontrar blogs relacionados con la programación, revisar mis proyectos y <span class="font-bold underline">contactarme</span> para trabajos freelance o de tiempo completo`,
        },
    },
    error: {
        pageInConstruction: "¡¡Esta página se encuentra en construcción!!",
        comeBackSoon: "Vuelve pronto",
        goHomepage: "Ir a inicio",
        notFound: "404. Esta página no fue encontrado",
        internalError:
            "500. Un error inesperado ocurrió. Por favor intenta de nuevo después",
        goBack: "Volver a inicio",
    },
    projects: {
        seeRepo: "Ver repo",
        seeDeploy: "Ver despliegue",
    },
    contact: {
        isCompany: "¿El mensaje es de parte de una empresa?",
        name: "nombre",
        email: "correo",
        message: "mensaje",
        messageSend: "Tu mensaje fue enviado satisfactoriamente",
        messageError:
            "Un error inesperado ocurrió. Por favor instantalo más tarde",
        notification: {
            send: "¡¡Perfecto!! Tu mensaje fue enviado",
            goHome: "Ir a inicio",
            other: "Enviar otro mensaje",
        },
        error: {
            nameIsBlank: "El nombre no puede estar vacío",
            emailIsBlank: "El email no puede estar vacío",
            emailIsNotValid: "El email no es valido",
            messageToShort: "El mensaje debe ser de más de 10 letras",
        },
    },
    blog: {
        title: "Publicaciones",
        recent: "¡Nuevo!",
        lastUpdated: "Actualizado por última vez el",
    },
    metadata: {
        contact: "Contacto",
        send: "Notificado",
        blog: "Blog",
    },
} as const;
