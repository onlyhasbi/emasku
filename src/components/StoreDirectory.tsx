import { useState, useEffect } from "react";
import {
  MapPin,
  ChevronRight,
  SlidersHorizontal,
  Navigation,
  Search,
  RefreshCcw,
} from "lucide-react";
import { findNearbyStores, getLiveStorePrice } from "../services/market";
import type { Store, LivePrice } from "../types/store";
import { isRealWebsite } from "../utils/storeUtils";
import { StoreCard } from "./StoreCard";
import { LocationModal } from "./LocationModal";



export function StoreDirectory({
  realStores,
  setRealStores,
  isLoadingStores,
  setIsLoadingStores,
  showLocationModal,
  setShowLocationModal,
  marketData,
}: {
  realStores: Store[] | null;
  setRealStores: (stores: Store[] | null) => void;
  isLoadingStores: boolean;
  setIsLoadingStores: (loading: boolean) => void;
  showLocationModal: boolean;
  setShowLocationModal: (show: boolean) => void;
  marketData: any;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'distance_asc' | 'distance_desc' | 'name_asc' | 'name_desc' | 'reviews_desc'>('distance_asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRadius, setSearchRadius] = useState(50000);
  const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>({});
  const [loadingPrices, setLoadingPrices] = useState<Record<string, boolean>>({});
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [websiteOnly, setWebsiteOnly] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Handle clicking outside the filter menu to close it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showFilters && !(e.target as Element).closest('.filter-menu-container')) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);
  const itemsPerPage = 5;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.action-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  const filteredStores = realStores 
    ? realStores.filter(store => {
        const matchSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          store.vicinity.toLowerCase().includes(searchQuery.toLowerCase());
        return matchSearch && (!websiteOnly || isRealWebsite(store.websiteUri));
      })
    : [];

  const sortedStores = [...filteredStores].sort((a, b) => {
    switch (sortBy) {
      case 'distance_asc': return (a.rawDistance || 0) - (b.rawDistance || 0);
      case 'distance_desc': return (b.rawDistance || 0) - (a.rawDistance || 0);
      case 'name_asc': return a.name.localeCompare(b.name);
      case 'name_desc': return b.name.localeCompare(a.name);
      case 'reviews_desc': return (b.userRatingCount || 0) - (a.userRatingCount || 0);
      default: return 0;
    }
  });

  const totalPages = Math.ceil(sortedStores.length / itemsPerPage);
  const currentStores = sortedStores.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleRequestLocation = async (radiusOverride?: number, specificQuery?: string) => {
    setIsLoadingStores(true);
    setShowLocationModal(false);

    const fetchStores = async (lat: number, lng: number) => {
      const currentRadius = radiusOverride || searchRadius;
      try {
        const stores = await (findNearbyStores as any)({
          data: { lat, lng, radius: currentRadius, specificQuery },
        });
        setRealStores(stores as Store[]);
        setCurrentPage(1);
      } catch (error) {
        console.error("Failed to fetch stores:", error);
      } finally {
        setIsLoadingStores(false);
      }
    };

    if (userLocation) {
      await fetchStores(userLocation.lat, userLocation.lng);
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolokasi tidak didukung oleh browser Anda");
      setIsLoadingStores(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        await fetchStores(latitude, longitude);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLoadingStores(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const checkStorePrice = async (store: Store) => {
    setLoadingPrices((prev) => ({ ...prev, [store.id]: true }));
    try {
      const data = await (getLiveStorePrice as any)({
        data: { storeName: store.name, websiteUrl: store.websiteUri },
      });
      if (data?.sellPrice) {
        const buyback = data.sellPrice;
        const worldPrice = marketData.price24kIdr;
        const calculatedSpread = (((worldPrice - buyback) / worldPrice) * 100).toFixed(1);
        data.spread = Number(calculatedSpread);
        setLivePrices((prev) => ({ ...prev, [store.id]: data }));
      } else {
        setLivePrices((prev) => ({ ...prev, [store.id]: { buyPrice: null, sellPrice: 0, spread: 0, lastUpdated: "Tidak ada data", source: "" } }));
      }
    } catch (e) {
      console.error("Manual price check failed:", e);
    } finally {
      setLoadingPrices((prev) => ({ ...prev, [store.id]: false }));
    }
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
      } catch (err) { console.error(err); }
    } else {
      await navigator.clipboard.writeText(`${shareText}\n${store.googleMapsUri || ""}`);
      alert("Link toko berhasil disalin!");
    }
  };

  return (
    <>
      <div className="w-full rise-in stagger-2">
        <div className="island-shell rounded-md border-(--line) relative flex flex-col">
          <div className="absolute inset-0 overflow-hidden rounded-md pointer-events-none">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-gold/40 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Header Section — only shown before first search */}
          {!realStores && !isLoadingStores && (
            <div className="relative p-8 pb-4 text-center border-b border-(--line)">
              <h2 className="display-title text-3xl font-bold text-(--sea-ink) mb-2">Store Directory</h2>
              <p className="text-sm text-(--sea-ink-soft) max-w-md mx-auto">Cari toko emas yang ada disekitarmu</p>
            </div>
          )}

          <div className="relative p-8 flex-1 flex flex-col">
            {isLoadingStores ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] gap-4">
                <div className="h-12 w-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
                <p className="text-sm font-bold text-(--sea-ink)">Mencari Toko Terdekat...</p>
              </div>
            ) : realStores ? (
              <div className="space-y-6">
                {/* Search & Filter Header */}
                <div className="flex items-center gap-2 sm:gap-3 relative z-20">
                  <div className="relative flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder="Cari nama toko..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="w-full h-11 px-4 pl-10 rounded-md border border-(--line) bg-(--surface) text-sm outline-none focus:border-gold transition-colors text-(--sea-ink)"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-(--sea-ink-soft)">
                      <Search className="w-4 h-4" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    <div className="relative filter-menu-container">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2.5 rounded-full flex items-center justify-center transition-colors ${showFilters ? "text-amber-600 bg-amber-50" : "text-(--sea-ink-soft) hover:text-(--sea-ink) hover:bg-black/5"}`}
                        title="Filter & Pengurutan"
                      >
                        <SlidersHorizontal className="w-5 h-5" />
                      </button>
                      
                      {showFilters && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 p-4 z-20 flex flex-col gap-4">
                          <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Urut berdasarkan</label>
                            <div className="flex flex-col gap-1">
                              {[
                                { value: 'distance_asc', label: 'Terdekat' },
                                { value: 'distance_desc', label: 'Terjauh' },
                                { value: 'reviews_desc', label: 'Populer' }
                              ].map(opt => (
                                <button
                                  key={opt.value}
                                  onClick={() => setSortBy(opt.value as typeof sortBy)}
                                  className={`text-left flex items-center justify-between px-3 py-2 rounded-md text-xs font-bold transition-colors ${sortBy === opt.value ? 'bg-amber-50 text-amber-600' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                  {opt.label}
                                  {sortBy === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="pt-4 border-t border-slate-100">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Radius (KM)</label>
                            <div className="flex flex-wrap gap-2">
                              {[
                                { value: 5000, label: '5' },
                                { value: 15000, label: '15' },
                                { value: 50000, label: '50' },
                                { value: 100000, label: '100' }
                              ].map(opt => (
                                <button
                                  key={opt.value}
                                  onClick={() => {
                                    setSearchRadius(opt.value);
                                    setLivePrices({});
                                    handleRequestLocation(opt.value);
                                  }}
                                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${searchRadius === opt.value ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-100">
                            <label className="flex items-center justify-between cursor-pointer group">
                              <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Ada Website</span>
                              <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${websiteOnly ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${websiteOnly ? 'translate-x-4' : 'translate-x-0'}`} />
                              </div>
                              <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={websiteOnly}
                                onChange={() => { setWebsiteOnly(!websiteOnly); setCurrentPage(1); }}
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setLivePrices({});
                        handleRequestLocation();
                      }}
                      title="Refresh toko"
                      className="p-2.5 rounded-full flex items-center justify-center text-(--sea-ink-soft) hover:text-(--sea-ink) hover:bg-black/5 transition-colors active:scale-95"
                    >
                      <RefreshCcw className="w-[18px] h-[18px]" />
                    </button>
                  </div>
                </div>

                {/* Results List */}
                <div className="flex flex-col gap-4">
                  {sortedStores.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 bg-gold/10 rounded-md flex items-center justify-center mb-4">
                        <MapPin className="w-8 h-8 text-gold" />
                      </div>
                      <h3 className="text-lg font-bold text-(--sea-ink) mb-2">Toko Tidak Ditemukan</h3>
                      <p className="text-sm text-(--sea-ink-soft) mb-6">
                        {searchQuery
                          ? `Tidak ada toko "${searchQuery}" ditemukan.`
                          : `Tidak ada toko emas ditemukan dalam radius ${searchRadius / 1000}km.`}
                      </p>
                      {searchQuery && (
                        <button
                          onClick={() => handleRequestLocation(100000, searchQuery)}
                          className="px-6 py-2.5 bg-gold text-white rounded-md text-sm font-black"
                        >
                          Cari "{searchQuery}" Secara Luas
                        </button>
                      )}
                    </div>
                  ) : (
                    currentStores.map((store) => (
                      <StoreCard
                        key={store.id}
                        store={store}
                        livePrice={livePrices[store.id]}
                        isLoadingPrice={loadingPrices[store.id] || false}
                        activeMenuId={activeMenuId}
                        setActiveMenuId={setActiveMenuId}
                        onCheckPrice={checkStorePrice}
                        onShare={handleShare}
                      />
                    ))
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-6 pt-6">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                      disabled={currentPage === 1} 
                      className="p-1.5 text-(--sea-ink-soft) hover:text-(--sea-ink) disabled:opacity-20 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${currentPage === page ? 'bg-amber-500 w-6' : 'bg-(--line) hover:bg-(--sea-ink-soft)/40'}`}
                        />
                      ))}
                    </div>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                      disabled={currentPage === totalPages} 
                      className="p-1.5 text-(--sea-ink-soft) hover:text-(--sea-ink) disabled:opacity-20 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[300px] text-center max-w-md mx-auto">
                <div className="w-20 h-20 bg-gold/5 rounded-md flex items-center justify-center mb-6"><Navigation className="w-10 h-10 text-gold/40" /></div>
                <h3 className="text-xl font-bold text-(--sea-ink) mb-2">Toko Terdekat Anda</h3>
                <p className="text-sm text-(--sea-ink-soft) mb-8">Izinkan akses lokasi untuk mencari toko perhiasan emas terbaik di sekitar lokasi Anda saat ini.</p>
                <button onClick={() => handleRequestLocation()} className="px-8 py-3 bg-gold text-white rounded-md font-black shadow-lg shadow-gold/20">CARI SEKARANG</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <LocationModal 
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onRequestLocation={() => handleRequestLocation()}
      />
    </>
  );
}
