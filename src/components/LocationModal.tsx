import { createPortal } from "react-dom";
import { MapPin } from "lucide-react";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestLocation: () => void;
}

export function LocationModal({ isOpen, onClose, onRequestLocation }: LocationModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-(--surface) w-full max-w-md rounded-md p-8 border border-(--line) shadow-2xl scale-in">
        <div className="w-20 h-20 bg-gold/10 rounded-md flex items-center justify-center mb-6 mx-auto"><MapPin className="w-10 h-10 text-gold" /></div>
        <h3 className="text-2xl font-black text-center text-(--sea-ink) mb-3">Izinkan Lokasi</h3>
        <p className="text-center text-(--sea-ink-soft) text-sm mb-8 leading-relaxed">
          Kami memerlukan akses lokasi Anda secara otomatis untuk mencari toko emas fisik terdekat.
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={onRequestLocation} className="w-full py-4 bg-gold text-white rounded-md font-black shadow-lg shadow-gold/20 active:scale-[0.98] transition-transform">BERIKAN IZIN</button>
          <button onClick={onClose} className="w-full py-4 bg-transparent text-(--sea-ink-soft) rounded-md font-bold hover:bg-black/5">NANTI SAJA</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
