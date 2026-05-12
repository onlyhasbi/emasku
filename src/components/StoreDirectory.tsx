import { createPortal } from "react-dom";
import {
  MapPinIcon,
  ChevronRightIcon,
  NavigationIcon,
  ShareIcon,
} from "../assets/icons";
import { findNearbyStores } from "../services/market";
import type { Store } from "../types/store";

export function StoreDirectory({
  realStores,
  setRealStores,
  isLoadingStores,
  setIsLoadingStores,
  showLocationModal,
  setShowLocationModal,
}: {
  realStores: Store[] | null;
  setRealStores: (stores: Store[] | null) => void;
  isLoadingStores: boolean;
  setIsLoadingStores: (loading: boolean) => void;
  showLocationModal: boolean;
  setShowLocationModal: (show: boolean) => void;
}) {
  const handleRequestLocation = async () => {
    setIsLoadingStores(true);
    setShowLocationModal(false);

    if (!navigator.geolocation) {
      alert("Geolokasi tidak didukung oleh browser Anda");
      setIsLoadingStores(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const stores = await (findNearbyStores as any)({
            data: { lat: latitude, lng: longitude },
          });
          setRealStores(stores as Store[]);
        } catch (error) {
          console.error("Failed to fetch stores:", error);
          alert("Gagal mengambil data toko terdekat.");
        } finally {
          setIsLoadingStores(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Gagal mengakses lokasi. Pastikan izin lokasi diberikan.");
        setIsLoadingStores(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleShare = async (store: Store) => {
    const shareText = `Toko Emas: ${store.name}\nAlamat: ${store.vicinity}\nRating: ${store.rating} ⭐\nCek harga emas di Emasku!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: store.name,
          text: shareText,
          url: store.googleMapsUri || window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      await navigator.clipboard.writeText(
        `${shareText}\n${store.googleMapsUri || ""}`,
      );
      alert("Link toko berhasil disalin ke clipboard!");
    }
  };

  return (
    <>
      <div className="w-full rise-in stagger-2">
        <div className="island-shell rounded-3xl border-(--line) relative overflow-hidden flex flex-col">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-gold/40 via-transparent to-transparent pointer-events-none" />

          <div className="relative p-8 pb-4 text-center border-b border-(--line)">

            <h2 className="display-title text-3xl font-bold text-(--sea-ink) mb-2">
              Store Directory
            </h2>
            <p className="text-sm text-(--sea-ink-soft) max-w-md mx-auto">
              Cari toko emas terdekat dengan harga buyback terbaik (spread
              terendah) di lokasi Anda.
            </p>
          </div>

          <div className="relative p-8">
            {isLoadingStores ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="h-12 w-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin"></div>
                <div className="text-center">
                  <p className="text-sm font-bold text-(--sea-ink)">
                    Mencari Toko Terdekat...
                  </p>
                  <p className="text-[10px] text-(--sea-ink-soft) uppercase tracking-widest mt-1">
                    Mengakses Satelit GPS
                  </p>
                </div>
              </div>
            ) : realStores ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-(--sea-ink-soft)">
                    Toko Ditemukan ({realStores.length})
                  </h3>
                  <button
                    onClick={() => {
                      localStorage.removeItem("emasku_cached_stores");
                      setRealStores(null);
                      handleRequestLocation();
                    }}
                    className="text-[10px] font-bold text-gold hover:underline"
                  >
                    Perbarui Lokasi
                  </button>
                </div>
                {realStores.length > 0 ? (
                  realStores.map((store) => (
                    <div
                      key={store.id}
                      className={`group rounded-2xl border ${store.isPartner ? "border-gold/30 bg-gold/5" : "border-(--line) bg-(--surface)"} p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden transition-all hover:scale-[1.01] hover:shadow-lg`}
                    >
                      {store.isPartner && (
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gold" />
                      )}
                      <div className={store.isPartner ? "pl-2" : ""}>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-(--sea-ink) text-lg leading-tight group-hover:text-gold transition-colors">
                            {store.name}
                          </h4>
                          {store.isPartner && (
                            <span className="bg-gold text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-(--sea-ink-soft) flex items-center gap-1.5 flex-wrap mb-3">
                          <span className="text-yellow-500 flex items-center">
                            {"★".repeat(Math.round(store.rating))}
                            {"☆".repeat(5 - Math.round(store.rating))}
                          </span>
                          <span className="font-bold">({store.rating})</span>
                          <span className="opacity-50">•</span>
                          <span className="line-clamp-1">{store.vicinity}</span>
                        </p>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 px-2 py-1 bg-black/5 dark:bg-white/5 rounded-lg text-[10px] font-bold text-(--sea-ink)">
                            <NavigationIcon className="w-3 h-3 text-gold" />
                            {store.distance || "0 km"}
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 bg-black/5 dark:bg-white/5 rounded-lg text-[10px] font-bold text-(--sea-ink)">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            {store.duration || "5 mnt"}
                          </div>
                          <div className="flex gap-2 ml-auto">
                            <button
                              onClick={() => handleShare(store)}
                              className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-(--sea-ink-soft) hover:text-gold transition-colors"
                              title="Bagikan"
                            >
                              <ShareIcon className="w-4 h-4" />
                            </button>
                            {store.googleMapsUri && (
                              <a
                                href={store.googleMapsUri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-(--sea-ink-soft) hover:text-gold transition-colors"
                                title="Buka di Maps"
                              >
                                <MapPinIcon className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 border-t sm:border-t-0 border-(--line) pt-4 sm:pt-0">
                        {store.hasWebsite && (
                          <div className="text-left sm:text-right shrink-0">
                            <p className="text-[9px] uppercase font-bold text-(--sea-ink-soft) tracking-wider mb-0.5">
                              Est. Potongan
                            </p>
                            <p
                              className={`text-xl font-bold ${store.isPartner ? "text-green-600 dark:text-green-400" : "text-(--sea-ink)"}`}
                            >
                              ~ {store.estimatedSpread}%
                            </p>
                          </div>
                        )}
                        <div className="h-10 w-10 rounded-full border border-(--line) flex items-center justify-center text-(--sea-ink-soft) group-hover:bg-gold group-hover:text-white group-hover:border-gold transition-all ml-auto">
                          <ChevronRightIcon className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-sm text-(--sea-ink-soft)">
                      Tidak ada toko emas ditemukan dalam radius 5km.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-8 py-8 animate-fade-in">
                <div className="h-24 w-24 bg-gold/10 rounded-full flex items-center justify-center text-gold relative">
                  <div className="absolute inset-0 rounded-full bg-gold/10 animate-ping"></div>
                  <MapPinIcon className="h-10 w-10 relative z-10" />
                </div>
                <div className="text-center max-w-sm">
                  <h3 className="text-xl font-bold text-(--sea-ink) mb-3 tracking-tight">
                    Aktifkan Store Locator
                  </h3>
                  <p className="text-sm text-(--sea-ink-soft) leading-relaxed">
                    Emasku perlu mengakses koordinat GPS Anda untuk mencari toko
                    perhiasan terdekat dan menghitung estimasi keuntungan
                    terbaik.
                  </p>
                </div>
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="group flex items-center gap-3 rounded-2xl bg-zinc-900 dark:bg-white px-8 py-4 font-bold text-white dark:text-zinc-900 shadow-xl transition-all hover:scale-105 hover:shadow-gold/20 active:scale-95"
                >
                  <MapPinIcon className="h-5 w-5 text-gold" />
                  Buka Kunci Akses Lokasi
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showLocationModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in">
            <div className="island-shell w-full max-w-md overflow-hidden rounded-[2.5rem] shadow-2xl animate-scale-in border-gold/20 ring-1 ring-white/10">
              <div className="bg-gold p-10 text-center relative overflow-hidden">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-black/10 rounded-full blur-2xl"></div>

                <div className="relative z-10 h-20 w-20 bg-white rounded-3xl shadow-xl mx-auto flex items-center justify-center mb-6 rotate-3">
                  <MapPinIcon className="h-10 w-10 text-gold" />
                </div>
                <h3 className="relative z-10 text-2xl font-black text-yellow-950 tracking-tight leading-tight">
                  Izinkan Akses Lokasi
                </h3>
              </div>

              <div className="p-10 text-center bg-(--surface)">
                <div className="space-y-6 mb-10">
                  <div className="flex gap-4 text-left">
                    <div className="h-6 w-6 rounded-full bg-gold/20 flex items-center justify-center text-gold-dark text-[10px] font-bold shrink-0 mt-1">
                      1
                    </div>
                    <p className="text-sm text-(--sea-ink-soft) leading-relaxed">
                      <strong className="text-(--sea-ink)">
                        Mencari Toko Terdekat
                      </strong>
                      : Menampilkan toko emas sungguhan di sekitar Anda dalam
                      radius 5km.
                    </p>
                  </div>
                  <div className="flex gap-4 text-left">
                    <div className="h-6 w-6 rounded-full bg-gold/20 flex items-center justify-center text-gold-dark text-[10px] font-bold shrink-0 mt-1">
                      2
                    </div>
                    <p className="text-sm text-(--sea-ink-soft) leading-relaxed">
                      <strong className="text-(--sea-ink)">
                        Optimasi Spread
                      </strong>
                      : Memilih toko dengan potongan terendah agar Anda dapat
                      uang lebih banyak.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleRequestLocation}
                    className="w-full rounded-2xl bg-gold py-4 font-black text-yellow-950 shadow-lg shadow-gold/20 transition-all hover:brightness-110 active:scale-95"
                  >
                    Berikan Izin Lokasi
                  </button>
                  <button
                    onClick={() => setShowLocationModal(false)}
                    className="w-full py-3 text-sm font-bold text-(--sea-ink-soft) hover:text-(--sea-ink) transition-colors"
                  >
                    Nanti Saja
                  </button>
                </div>
                <p className="mt-8 text-[10px] text-(--sea-ink-soft) uppercase tracking-widest font-medium opacity-50">
                  Data lokasi hanya digunakan saat mencari toko
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
