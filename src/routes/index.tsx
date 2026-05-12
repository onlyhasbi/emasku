import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PURITY_TABLE } from "../constants/purity";
import { getMarketData } from "../services/market";
import { MarketStatus } from "../components/MarketStatus";
import { GoldCalculator } from "../components/GoldCalculator";
import { StoreDirectory } from "../components/StoreDirectory";
import type { Store } from "../types/store";
import { CalculatorIcon, MapPinIcon } from "../assets/icons";

export const Route = createFileRoute("/")({
  component: App,
  validateSearch: (search: Record<string, unknown>) => ({
    k:
      search.k !== undefined && !isNaN(Number(search.k))
        ? Number(search.k)
        : undefined,
    s: search.s !== undefined ? String(search.s) : undefined,
    w: search.w !== undefined ? String(search.w) : undefined,
    t: search.t === "toko" ? "toko" : "kalkulator",
  }),
  loader: async () => ({ marketData: await getMarketData() }),
  head: () => ({
    meta: [
      { title: "Emasku - Smart Gold Appraisal" },
      {
        name: "description",
        content:
          "Alat taksir harga emas perhiasan secara real-time yang akurat, transparan, dan mengedukasi.",
      },
    ],
  }),
});

function App() {
  const { marketData } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const [activeTab, setActiveTab] = useState<"kalkulator" | "toko">(
    (search.t as "kalkulator" | "toko") || "kalkulator",
  );
  const [weight, setWeight] = useState<string>(search.w || "1");
  const [karatIndex, setKaratIndex] = useState<number>(search.k ?? 0);
  const [spread, setSpread] = useState<string>(search.s || "5");
  const [customStorePrice, setCustomStorePrice] = useState<string>("");

  const [realStores, setRealStores] = useState<Store[] | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("emasku_cached_stores");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });

  useEffect(() => {
    if (realStores) {
      localStorage.setItem(
        "emasku_cached_stores",
        JSON.stringify(realStores),
      );
    } else {
      localStorage.removeItem("emasku_cached_stores");
    }
  }, [realStores]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    navigate({
      search: (prev) => ({
        ...prev,
        w: weight,
        k: karatIndex,
        s: spread,
        t: activeTab,
      }),
      replace: true,
    });
  }, [weight, karatIndex, spread, activeTab, navigate]);

  const selectedKarat = PURITY_TABLE[karatIndex];
  const numWeight = Number(weight) || 0;
  const numSpread = Number(spread) || 0;
  const trueGoldWeight = numWeight * selectedKarat.purity;
  const intrinsicValue = trueGoldWeight * marketData.price24kIdr;
  const buybackEstimate = intrinsicValue * (1 - numSpread / 100);
  const intrinsicPerGram = marketData.price24kIdr * selectedKarat.purity;

  useEffect(() => {
    if (document.activeElement?.id !== "custom-price-input") {
      const currentStorePrice = intrinsicPerGram * (1 - numSpread / 100);
      setCustomStorePrice(Math.round(currentStorePrice).toString());
    }
  }, [numSpread, intrinsicPerGram]);

  return (
    <main className="page-wrap px-4 pb-12 pt-8">
      <MarketStatus marketData={marketData} />

      <div className="flex flex-col md:flex-row gap-8 rise-in stagger-2">
        <aside className="w-full md:w-48 shrink-0">
          <div className="flex flex-row md:flex-col gap-2 sticky top-8">
            <TabButton
              active={activeTab === "kalkulator"}
              onClick={() => setActiveTab("kalkulator")}
              icon="calculator"
              label="Kalkulator"
            />
            <TabButton
              active={activeTab === "toko"}
              onClick={() => setActiveTab("toko")}
              icon="map"
              label="Direktori"
            />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {activeTab === "kalkulator" ? (
            <GoldCalculator
              weight={weight}
              setWeight={setWeight}
              karatIndex={karatIndex}
              setKaratIndex={setKaratIndex}
              spread={spread}
              setSpread={setSpread}
              customStorePrice={customStorePrice}
              setCustomStorePrice={setCustomStorePrice}
              intrinsicPerGram={intrinsicPerGram}
              buybackEstimate={buybackEstimate}
              trueGoldWeight={trueGoldWeight}
              intrinsicValue={intrinsicValue}
            />
          ) : (
            <StoreDirectory
              realStores={realStores}
              setRealStores={setRealStores}
              isLoadingStores={isLoadingStores}
              setIsLoadingStores={setIsLoadingStores}
              showLocationModal={showLocationModal}
              setShowLocationModal={setShowLocationModal}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: "calculator" | "map";
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 md:w-full text-left rounded-xl px-4 py-3 text-sm font-bold transition-all flex items-center justify-center md:justify-start gap-3 ${active ? "bg-(--surface) text-(--sea-ink) shadow-md ring-1 ring-black/5 dark:ring-white/10" : "text-(--sea-ink-soft) hover:text-(--sea-ink) hover:bg-black/5 dark:hover:bg-white/5"}`}
    >
      {icon === "calculator" ? (
        <CalculatorIcon className="w-5 h-5 hidden sm:block" />
      ) : (
        <MapPinIcon className="w-5 h-5 hidden sm:block" />
      )}
      <span>{label}</span>
    </button>
  );
}
