import { Fragment } from "react";

export default function TextWithSpaces({ text }: { text: string }) {
    const textList = text.split("\n");
    return (
        <>
            {textList.map((linea, index) => (
                <Fragment key={`${index}-${linea.length}`}>
                    {linea}
                    {index < textList.length - 1 && <br />}{" "}
                </Fragment>
            ))}
        </>
    );
}
