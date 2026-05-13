import React, { useState } from "react";
import { Scale, Badge, Percent, Store, Gem, Info } from "lucide-react";
import { PURITY_TABLE } from "../constants/purity";

interface GoldCalculatorProps {
  weight: string;
  setWeight: (w: string) => void;
  karatIndex: number;
  setKaratIndex: (k: number) => void;
  spread: string;
  setSpread: (s: string) => void;
  customStorePrice: string;
  setCustomStorePrice: (p: string) => void;
  intrinsicPerGram: number;
  buybackEstimate: number;
  trueGoldWeight: number;
  intrinsicValue: number;
}

export function GoldCalculator({
  weight,
  setWeight,
  karatIndex,
  setKaratIndex,
  spread,
  setSpread,
  customStorePrice,
  setCustomStorePrice,
  intrinsicPerGram,
  buybackEstimate,
  trueGoldWeight,
  intrinsicValue,
}: GoldCalculatorProps) {
  const [showInfo, setShowInfo] = useState(false);
  

  const handleCustomPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/\D/g, "");
    if (rawValue.length > 1 && rawValue.startsWith("0"))
      rawValue = rawValue.replace(/^0+/, "");
    setCustomStorePrice(rawValue);
    if (rawValue === "") return;
    const price = Number(rawValue);
    if (!isNaN(price) && intrinsicPerGram > 0) {
      let calculatedSpread = 100 - (price / intrinsicPerGram) * 100;
      if (calculatedSpread < 0) calculatedSpread = 0;
      if (calculatedSpread > 50) calculatedSpread = 50;
      setSpread((Math.round(calculatedSpread * 100) / 100).toString());
    }
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valString = e.target.value;
    if (
      valString.length > 1 &&
      valString.startsWith("0") &&
      !valString.startsWith("0.")
    )
      valString = valString.replace(/^0+/, "");
    setWeight(valString);
  };

  const handleSpreadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valString = e.target.value;
    if (
      valString.length > 1 &&
      valString.startsWith("0") &&
      !valString.startsWith("0.")
    )
      valString = valString.replace(/^0+/, "");
    if (valString.startsWith("-")) valString = "0";
    setSpread(valString);
  };

  const formatCurrencyInput = (val: string) => {
    if (!val) return "";
    const num = Number(val);
    if (isNaN(num)) return val;
    return num.toLocaleString("id-ID");
  };

  const numSpread = Number(spread) || 0;

  return (
    <div className="grid gap-8 xl:grid-cols-2">
      <section className="island-shell rounded-3xl p-8 rise-in stagger-2 border-(--line)">
        <div className="mb-6">
          <h2 className="display-title text-3xl font-bold text-(--sea-ink) mb-2">
            Valuasi Perhiasan
          </h2>
          <p className="text-sm text-(--sea-ink-soft)">
            Lengkapi spesifikasi aset emas Anda untuk mendapatkan taksiran nilai
            yang akurat.
          </p>
        </div>

        <div className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-(--sea-ink)">
                <Scale className="h-4 w-4 text-gold" />
                Berat Emas (Gram)
              </label>
              <div className="relative group">
                <input
                  type="number"
                  value={weight}
                  onChange={handleWeightChange}
                  className="w-full appearance-none rounded-xl border border-(--line) bg-(--bg-base) px-4 py-3 text-lg font-bold text-(--sea-ink) outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold group-hover:border-gold/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  placeholder="0.00"
                  step="0.01"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-(--sea-ink-soft)">
                  gr
                </span>
              </div>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-(--sea-ink)">
                <Badge className="h-4 w-4 text-gold" />
                Pilih Kadar (Karat)
              </label>
              <div className="relative group">
                <select
                  value={karatIndex}
                  onChange={(e) => setKaratIndex(Number(e.target.value))}
                  className="w-full appearance-none rounded-xl border border-(--line) bg-(--bg-base) pl-4 pr-10 py-3 font-medium text-(--sea-ink) outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold group-hover:border-gold/50 truncate"
                >
                  {PURITY_TABLE.map((item, index) => (
                    <option key={item.karat} value={index}>
                      {item.karat} ({item.hallmark})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-(--sea-ink)">
                  <svg
                    className="h-4 w-4 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 rounded-2xl bg-black/5 p-5 dark:bg-white/5 border border-(--line)">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-bold text-(--sea-ink)">
                  <Percent className="h-4 w-4 text-gold" />
                  Potongan (Spread)
                </label>
                <div className="flex items-center gap-0.5 px-2 py-1">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={spread}
                    onChange={handleSpreadChange}
                    className="w-12 appearance-none bg-transparent text-right text-sm font-bold text-(--sea-ink) outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <span className="text-sm font-bold text-(--sea-ink)">%</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="0.1"
                value={numSpread}
                onChange={(e) => setSpread(e.target.value)}
                className="w-full accent-gold hover:accent-gold-light"
              />
              <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-wider text-(--sea-ink-soft)">
                <span>Min 0%</span>
                <span>Max 50%</span>
              </div>
            </div>

            <div className="border-t border-(--line) pt-4">
              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-(--sea-ink)">
                <Store className="h-4 w-4 text-gold" />
                Harga Buyback Toko (Per Gram)
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-(--sea-ink-soft)">
                  Rp
                </span>
                <input
                  id="custom-price-input"
                  type="text"
                  inputMode="numeric"
                  value={formatCurrencyInput(customStorePrice)}
                  onChange={handleCustomPriceChange}
                  className="w-full rounded-xl border border-(--line) bg-(--surface) py-3 pl-12 pr-4 text-lg font-bold text-(--sea-ink) outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold group-hover:border-gold/50"
                  placeholder="Contoh: 1.200.000"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6 rise-in stagger-3">
        <div className="island-shell rounded-3xl relative shadow-[0_10px_40px_rgba(201,162,39,0.15)] ring-1 ring-gold/30">
          {/* Decorative layer with clipping */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            <div className="absolute inset-0 bg-linear-to-br from-gold/10 to-transparent"></div>
            <div className="absolute -top-10 -right-10 p-4 text-gold opacity-10">
              <Gem
                width={240}
                height={240}
                strokeWidth={1}
              />
            </div>
          </div>
          <div className="relative z-10 p-8">
            <p className="text-(--kicker) uppercase tracking-[0.2em] font-bold text-[0.65rem] mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse"></span>
              Estimasi Harga Terima
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-(--sea-ink) mb-8 tracking-tight drop-shadow-sm">
              Rp {Math.round(buybackEstimate).toLocaleString("id-ID")}
            </h2>
            <div className="relative">
              <div className="absolute -left-8 right-0 top-0 h-px bg-linear-to-r from-transparent via-gold/30 to-transparent"></div>
              <div className="grid grid-cols-2 gap-6 pt-6 relative">
                <div className="relative">
                  <div className="absolute -right-3 top-0 bottom-0 w-px bg-(--line)"></div>
                  <p className="text-[10px] uppercase text-(--sea-ink-soft) mb-1 font-bold tracking-wider">
                    Berat Emas Murni
                  </p>
                  <p className="text-xl font-bold text-(--sea-ink)">
                    {trueGoldWeight.toFixed(3)}{" "}
                    <span className="text-sm font-normal text-(--sea-ink-soft)">
                      gr
                    </span>
                  </p>
                </div>
                <div className="pl-3">
                  <p className="text-[10px] uppercase text-(--sea-ink-soft) mb-1 font-bold tracking-wider flex items-center gap-1 relative">
                    Nilai Intrinsik
                    <button 
                      onClick={() => setShowInfo(!showInfo)}
                      className="flex items-center text-slate-400 hover:text-gold transition-colors focus:outline-none"
                    >
                      <Info className="w-3.5 h-3.5 cursor-help" />
                    </button>
                    
                    {showInfo && (
                      <div className="absolute bottom-full left-0 mb-2 w-48 bg-(--sea-ink) text-(--bg-base) text-[10px] p-3 rounded-lg shadow-xl z-50 normal-case leading-relaxed animate-in fade-in zoom-in duration-200 border border-(--line)">
                        <div className="absolute bottom-0 left-4 translate-y-1/2 rotate-45 w-2 h-2 bg-(--sea-ink) border-r border-b border-(--line)"></div>
                        Nilai dasar emas murni (24K) sesuai harga pasar dunia saat ini, sebelum dipotong spread/keuntungan toko.
                      </div>
                    )}
                  </p>
                  <p className="text-xl font-bold text-(--sea-ink)">
                    Rp {Math.round(intrinsicValue).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="island-shell rounded-2xl bg-(--bg-base) p-6 border-(--line) rise-in stagger-4">
          <div className="flex gap-4">
            <div className="shrink-0 h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center text-gold-dark text-sm font-serif font-bold">
              i
            </div>
            <div>
              <h4 className="text-sm font-bold text-(--sea-ink) mb-1">
                Catatan Penting
              </h4>
              <p className="text-xs text-(--sea-ink-soft) leading-relaxed">
                Estimasi ini berdasarkan nilai intrinsik kandungan emas murni.
                <strong className="font-semibold text-(--sea-ink)">
                  {" "}
                  Ongkos pembuatan dan berat permata tidak termasuk
                </strong>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
