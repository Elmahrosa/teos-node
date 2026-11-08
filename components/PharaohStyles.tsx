// Design-only CSS for the Pharaoh layout. Inline <style> is allowed by the CSP
// (style-src includes 'unsafe-inline'). No logic, no price data here.
export default function PharaohStyles() {
  return (
    <style>{`
      .pharaoh-cards{display:grid;grid-template-columns:1fr;gap:14px}
      @media(min-width:720px){.pharaoh-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
      .pharaoh-tier-grid{display:grid;grid-template-columns:1fr;gap:16px}
      @media(min-width:820px){.pharaoh-tier-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      .pharaoh-frame{position:relative;border:3px double #ca8a04;box-shadow:0 0 0 1px rgba(122,101,64,.9) inset,0 0 42px rgba(234,179,8,.12)}
      .pharaoh-frame::before{content:"";position:absolute;inset:6px;border:1px solid rgba(234,179,8,.32);pointer-events:none}
      .pharaoh-hiero{height:12px;background-image:repeating-linear-gradient(90deg,#ca8a04 0 2px,transparent 2px 16px);opacity:.32}
      .pharaoh-sticky{position:fixed;left:0;right:0;bottom:0;z-index:60;padding:10px 14px;background:linear-gradient(180deg,rgba(10,8,6,.92),#0a0806);border-top:2px solid #ca8a04;box-shadow:0 -8px 24px rgba(0,0,0,.6)}
      .pharaoh-sticky-inner{max-width:1000px;margin:0 auto;display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap}
      .pharaoh-buy{background:linear-gradient(90deg,#b45309,#eab308);color:#000;border:2px solid #713f12;border-radius:6px;padding:14px 28px;font-size:18px;font-weight:900;letter-spacing:.02em;cursor:pointer;box-shadow:0 0 24px rgba(234,179,8,.35),0 6px 14px rgba(0,0,0,.55)}
      .pharaoh-buy:disabled{opacity:.55;cursor:not-allowed;box-shadow:none}
      .pharaoh-card{background:linear-gradient(160deg,#241f1a,#12100d);border:2px solid #ca8a04;border-radius:8px;padding:16px;box-shadow:0 10px 26px rgba(0,0,0,.55),inset 0 1px 0 rgba(254,243,199,.12)}
      .pharaoh-card-badge{display:inline-block;padding:3px 10px;border-radius:9999px;font-size:11px;font-weight:800;letter-spacing:.08em}
      @media(max-width:719px){.pharaoh-sticky .pharaoh-buy{width:100%}}
    `}</style>
  );
}
