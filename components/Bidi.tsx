import { Fragment } from "react";

// Wraps Latin runs in <bdi dir="ltr"> so dots, domains, prices and brand names cannot jump to the
// wrong side of an Arabic (RTL) sentence. In Arabic text every Latin run is wrapped (teos, TEOS, SOL,
// saloma.eg, Metaplex Core). In other text only domain-like tokens (.teos, saloma.eg) are wrapped.
const HAS_AR = /[\u0600-\u06FF]/;
const DOMAIN = /(\.[a-z]{2,10}\b|(?:[a-z0-9-]+\.)+[a-z]{2,10}\b)/gi;
const WORD = "[A-Za-z][A-Za-z0-9]*(?:[./_@:+-][A-Za-z0-9]+)*";
const LATIN = new RegExp(`(\\.[a-z]{2,10}\\b|${WORD}(?: ${WORD})*)`, "g");

export default function Bidi({ text }: { text: string }) {
  const parts = text.split(HAS_AR.test(text) ? LATIN : DOMAIN);
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <bdi key={i} dir="ltr">{p}</bdi> : <Fragment key={i}>{p}</Fragment>))}
    </>
  );
}
