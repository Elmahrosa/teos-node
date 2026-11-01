import { Fragment } from "react";

// Wraps Latin domain tokens (.teos, saloma.eg, AYMAN.TEOS) in <bdi dir="ltr"> so the leading dot
// and the label cannot jump to the wrong side inside an Arabic (RTL) paragraph.
const TOKEN = /(\.[a-z]{2,10}\b|(?:[a-z0-9-]+\.)+[a-z]{2,10}\b)/gi;

export default function Bidi({ text }: { text: string }) {
  const parts = text.split(TOKEN);
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <bdi key={i} dir="ltr">{p}</bdi> : <Fragment key={i}>{p}</Fragment>))}
    </>
  );
}
