interface MarketData {
  xauUsd: number;
  usdIdr: number;
  price24kIdr: number;
  updatedAt: string;
}

export function MarketStatus({ marketData }: { marketData: MarketData }) {
  return (
    <section className="mb-8 grid gap-4 sm:grid-cols-3 rise-in stagger-1">
      <div className="island-shell rounded-2xl p-5 border-(--line)">
        <p className="island-kicker mb-1">XAU / USD</p>
        <h3 className="text-2xl font-bold text-(--sea-ink)">
          $
          {marketData.xauUsd.toLocaleString("id-ID", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </h3>
        <p className="text-xs text-(--sea-ink-soft)">Per Troy Oz</p>
      </div>
      <div className="island-shell rounded-2xl p-5 border-(--line)">
        <p className="island-kicker mb-1">USD / IDR</p>
        <h3 className="text-2xl font-bold text-(--sea-ink)">
          Rp {marketData.usdIdr.toLocaleString("id-ID")}
        </h3>
        <p className="text-xs text-(--sea-ink-soft)">Kurs Saat Ini</p>
      </div>
      <div className="island-shell rounded-2xl p-5 shadow-lg border-(--line)">
        <p className="text-[0.65rem] uppercase tracking-wider font-bold text-(--sea-ink-soft) mb-1">
          Harga Emas 24K (IDR/gr)
        </p>
        <h3 className="text-2xl font-bold text-(--sea-ink)">
          Rp {Math.round(marketData.price24kIdr).toLocaleString("id-ID")}
        </h3>
        <p className="text-[10px] text-(--sea-ink-soft)">
          Update: {marketData.updatedAt}
        </p>
      </div>
    </section>
  );
}
