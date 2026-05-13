import {
  MapPin,
  Navigation,
  Share2,
  Phone,
  Star,
  CornerUpRight,
  MoreVertical,
  Eye,
} from "lucide-react";
import type { Store, LivePrice } from "../types/store";
import { getSocialMedia, isRealWebsite, LinkIcon, formatStoreName } from "../utils/storeUtils";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface StoreCardProps {
  store: Store;
  livePrice?: LivePrice;
  isLoadingPrice: boolean;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  onCheckPrice: (store: Store) => void;
  onShare: (store: Store) => void;
}

export function StoreCard({
  store,
  livePrice,
  isLoadingPrice,
  activeMenuId,
  setActiveMenuId,
  onCheckPrice,
  onShare,
}: StoreCardProps) {
  const extraActions = [];
  if (store.phone) {
    extraActions.push({ type: 'phone', url: `tel:${store.phone}`, icon: <Phone className="w-4 h-4" />, label: 'Telepon', textClass: 'text-amber-500' });
  }
  if (store.websiteUri) {
    extraActions.push({ type: 'website', url: store.websiteUri, icon: <LinkIcon url={store.websiteUri} />, label: getSocialMedia(store.websiteUri)?.label || "Website", textClass: 'text-amber-500' });
  }
  extraActions.push({ type: 'share', action: () => onShare(store), icon: <Share2 className="w-4 h-4" />, label: 'Bagikan', textClass: 'text-slate-500' });

  const hasMoreThanOne = extraActions.length > 1;

  return (
    <div className="group relative flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 rounded-md border border-(--line) bg-(--surface) transition-all duration-300 hover:shadow-lg">
      {/* LEFT: Photo */}
      <div className="w-full h-48 sm:w-40 sm:h-40 shrink-0 rounded-md overflow-hidden bg-black/5">
        {store.photoName ? (
          <img 
            src={`https://places.googleapis.com/v1/${store.photoName}/media?maxHeightPx=400&maxWidthPx=400&key=${GOOGLE_MAPS_API_KEY}`}
            alt={store.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><MapPin className="w-8 h-8 text-gold/30" /></div>
        )}
      </div>

      {/* RIGHT: Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        
        {/* Info */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h4 className="text-lg sm:text-xl font-bold text-(--sea-ink) truncate" title={store.name}>{formatStoreName(store.name)}</h4>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase text-white shadow-sm shrink-0 ${store.isOpen ? "bg-emerald-500" : "bg-rose-500"}`}>
              {store.isOpen ? "BUKA" : "TUTUP"}
            </span>
          </div>
          
          <p className="text-xs sm:text-sm text-(--sea-ink-soft) truncate">{store.vicinity}</p>
          
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-amber-600 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-500" /> {store.rating} <span className="text-amber-600/60 font-medium">({store.userRatingCount})</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
              <Navigation className="w-3.5 h-3.5" /> {store.distance}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <a href={store.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name + " " + store.vicinity)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white! rounded-md hover:bg-amber-600 transition-colors" title="Direction">
              <CornerUpRight className="w-4 h-4" /> 
              <span className="text-[11px] sm:text-xs font-bold">Direction</span>
            </a>
            
            {hasMoreThanOne ? (
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === store.id ? null : store.id);
                  }}
                  className="p-2 bg-slate-50 text-slate-500 rounded-md hover:bg-slate-100 transition-colors action-menu-container"
                  title="Lainnya"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                
                {activeMenuId === store.id && (
                  <div className="absolute bottom-full left-0 mb-2 w-36 bg-white rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-1.5 z-10 flex flex-col gap-0.5">
                    {extraActions.map((act, idx) => act.url ? (
                      <a key={idx} href={act.url} target={act.type === 'website' ? "_blank" : undefined} rel={act.type === 'website' ? "noopener noreferrer" : undefined} className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700 mx-1 rounded-md">
                        <span className={act.textClass}>{act.icon}</span> {act.label}
                      </a>
                    ) : (
                      <button key={idx} onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); act.action!(); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700 mx-1 rounded-md text-left">
                        <span className={act.textClass}>{act.icon}</span> {act.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              extraActions.map((act, idx) => act.url ? (
                <a key={idx} href={act.url} target={act.type === 'website' ? "_blank" : undefined} rel={act.type === 'website' ? "noopener noreferrer" : undefined} className={`p-2 bg-slate-50 ${act.textClass} rounded-md hover:bg-slate-100 transition-colors`} title={act.label}>
                  {act.icon}
                </a>
              ) : (
                <button key={idx} onClick={(e) => { e.stopPropagation(); act.action!(); }} className={`p-2 bg-slate-50 ${act.textClass} rounded-md hover:bg-slate-100 transition-colors`} title={act.label}>
                  {act.icon}
                </button>
              ))
            )}
          </div>

          <div className="shrink-0">
            {isLoadingPrice ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-bold text-(--sea-ink-soft)">Mengecek...</span>
              </div>
            ) : livePrice ? (
              livePrice.sellPrice ? (
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[9px] font-bold text-(--sea-ink-soft) uppercase tracking-wider">Buyback {livePrice.spread}%</span>
                  <span className="text-base font-black text-gold leading-none">Rp {livePrice.sellPrice!.toLocaleString('id-ID')}<span className="text-xs font-bold text-gold/60">/g</span></span>
                </div>
              ) : store.phone ? (
                <a href={`tel:${store.phone}`} className="flex items-center gap-1.5 text-(--sea-ink-soft) text-[11px] font-bold hover:text-gold transition-colors">
                  <Phone className="w-3 h-3" />
                  Hubungi Toko
                </a>
              ) : (
                <span className="text-[10px] text-(--sea-ink-soft)/40 font-bold">—</span>
              )
            ) : isRealWebsite(store.websiteUri) ? (
              <button 
                onClick={() => onCheckPrice(store)}
                className="flex items-center gap-1.5 text-(--sea-ink-soft) text-xs font-bold hover:text-gold transition-colors pr-2"
              >
                <Eye className="w-3 h-3" strokeWidth={2.5} />
                Buyback
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
