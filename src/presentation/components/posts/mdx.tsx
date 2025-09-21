import { Link } from "@/infrastructure/i18n/routing";
import { MDXRemote, type MDXRemoteProps } from "next-mdx-remote/rsc";
import Image from "next/image";
import React from "react";
import { highlight } from "sugar-high";

function Table({ data }: { data: { headers: any[]; rows: any[] } }) {
    const headers = data.headers.map((header: any) => (
        <th key={header}>{header}</th>
    ));
    const rows = data.rows.map((row: any[]) => (
        <tr key={row.length}>
            {row.map((cell) => (
                <td key={cell}>{cell}</td>
            ))}
        </tr>
    ));

    return (
        <table>
            <thead>
                <tr>{headers}</tr>
            </thead>
            <tbody>{rows}</tbody>
        </table>
    );
}

function CustomLink(props: any) {
    const href = props.href;

    if (href.startsWith("/") || href.startsWith("#")) {
        return (
            <Link
                className="text-blue-700 dark:text-blue-400"
                href={href}
                {...props}
            >
                {props.children}
            </Link>
        );
    }

    return (
        <Link
            className="text-blue-700 dark:text-blue-400"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            {...props}
        >
            {props.children}
        </Link>
    );
}

function RoundedImage(props: any) {
    return <Image alt={props.alt} className="rounded-lg" {...props} />;
}

function Code({ children, ...props }: any) {
    const codeHTML = highlight(children);
    return <code dangerouslySetInnerHTML={{ __html: codeHTML }} {...props} />;
}

function slugify(str: string) {
    return str
        .toString()
        .toLowerCase()
        .trim() // Remove whitespace from both ends of a string
        .replace(/\s+/g, "-") // Replace spaces with -
        .replace(/&/g, "-and-") // Replace & with 'and'
        .replace(/[^\w-]+/g, "") // Remove all non-word characters except for -
        .replace(/--+/g, "-"); // Replace multiple - with single -
}

function createHeading(level: number) {
    const Heading = ({ children }: { children: string }) => {
        const slug = slugify(children);
        return React.createElement(
            `h${level}`,
            { id: slug },
            [
                React.createElement("a", {
                    href: `#${slug}`,
                    key: `link-${slug}`,
                    className: "anchor",
                }),
            ],
            children,
        );
    };

    Heading.displayName = `Heading${level}`;

    return Heading;
}

const components = {
    h1: createHeading(1),
    h2: createHeading(2),
    h3: createHeading(3),
    h4: createHeading(4),
    h5: createHeading(5),
    h6: createHeading(6),
    Image: RoundedImage,
    a: CustomLink,
    code: Code,
    Table,
};

export function CustomMDX(props: MDXRemoteProps) {
    return (
        <MDXRemote
            {...props}
            components={{ ...components, ...(props.components || {}) } as never}
        />
    );
}
