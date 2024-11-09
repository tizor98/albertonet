import { Fragment, useId } from "react";

export default function TextWithSpaces({ text }: { text: string }) {
    const textList = text.split("\n");
    return (
        <>
            {textList.map((linea, index) => (
                <Fragment key={useId()}>
                    {linea}
                    {index < textList.length - 1 && <br />}{" "}
                </Fragment>
            ))}
        </>
    );
}
