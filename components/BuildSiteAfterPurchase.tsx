'use client';

export default function BuildSiteAfterPurchase({ domain }: { domain: string }) {
  return (
    <div
      style={{
        marginTop: 4,
        padding: 14,
        borderRadius: 16,
        background: '#18181b',
        border: '1px solid rgba(234,179,8,0.5)',
      }}
    >
      <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
        صفحة هوية النطاق فقط - بدون بناء موقع حاليا
      </div>
      <div
        dir="ltr"
        style={{
          color: '#a1a1aa',
          fontSize: 11,
          fontFamily: 'monospace',
          marginTop: 6,
        }}
      >
        {domain}
      </div>
    </div>
  );
}