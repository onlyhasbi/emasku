import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState, useEffect } from 'react'
import { ScaleIcon, BadgeIcon, PercentIcon, StoreIcon } from '../components/icons'

// Purity Reference Table based on PRD and SNI Ranges
export const PURITY_TABLE = [
  { karat: '24K', hallmark: '990 - 999', purity: 0.999, label: 'Logam Mulia' },
  { karat: '23K', hallmark: '948 - 989', purity: 0.958, label: 'Emas Tua' },
  { karat: '22K', hallmark: '906 - 947', purity: 0.916, label: 'Standar Perhiasan (Tinggi)' },
  { karat: '21K', hallmark: '865 - 905', purity: 0.875, label: 'Emas Arab' },
  { karat: '20K', hallmark: '823 - 864', purity: 0.833, label: 'Emas Tua' },
  { karat: '19K', hallmark: '782 - 822', purity: 0.792, label: 'Emas Tua' },
  { karat: '18K', hallmark: '750 - 781', purity: 0.75, label: 'Standar Internasional' },
  { karat: '17K', hallmark: '700 - 749', purity: 0.708, label: 'Emas 70 (Populer)' },
  { karat: '16K', hallmark: '666 - 699', purity: 0.666, label: 'Emas Muda' },
  { karat: '14K', hallmark: '585 - 665', purity: 0.585, label: 'Emas Muda' },
  { karat: '12K', hallmark: '500 - 584', purity: 0.5, label: 'Emas Muda' },
  { karat: '10K', hallmark: '416 - 499', purity: 0.416, label: 'Emas Muda' },
  { karat: '9K', hallmark: '375 - 415', purity: 0.375, label: 'Emas Muda' },
  { karat: '8K', hallmark: '300 - 374', purity: 0.333, label: 'Kadar Terendah' },
]

// Server Function: Fetch Market Data
const getMarketData = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    // Fetch data secara paralel dari API eksternal
    const [goldRes, ratesRes] = await Promise.all([
      fetch('https://api.gold-api.com/price/XAU'),
      fetch('https://api.exchangerate-api.com/v4/latest/USD')
    ])
    
    if (!goldRes.ok || !ratesRes.ok) throw new Error('API response failed')

    const goldJson = await goldRes.json()
    const ratesJson = await ratesRes.json()
    
    const xauUsd = goldJson.price
    const usdIdr = ratesJson.rates.IDR
    
    // Logic & Core Engine (Algorithm) from PRD
    const pricePerGramUsd = xauUsd / 31.1035
    const price24kIdr = pricePerGramUsd * usdIdr
    
    return {
      xauUsd,
      usdIdr,
      price24kIdr,
      updatedAt: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
    }
  } catch (error) {
    console.error('Failed to fetch market data:', error)
    // Fallback data jika API bermasalah (Data Estimasi 2026)
    const fallbackXauUsd = 4715.20
    const fallbackUsdIdr = 17370
    return {
      xauUsd: fallbackXauUsd,
      usdIdr: fallbackUsdIdr,
      price24kIdr: (fallbackXauUsd / 31.1035) * fallbackUsdIdr,
      updatedAt: 'Offline Mode',
    }
  }
})

export const Route = createFileRoute('/')({
  component: App,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      k: search.k !== undefined && !isNaN(Number(search.k)) ? Number(search.k) : undefined,
      s: search.s !== undefined ? String(search.s) : undefined,
      w: search.w !== undefined ? String(search.w) : undefined,
      t: search.t === 'toko' ? 'toko' : 'kalkulator',
    }
  },
  loader: async () => {
    const marketData = await getMarketData()
    return { marketData }
  },
  head: () => ({
    meta: [
      { title: 'Emasku - Smart Gold Appraisal' },
      {
        name: 'description',
        content:
          'Alat taksir harga emas perhiasan dan Logam Mulia secara real-time yang akurat, transparan, dan mengedukasi.',
      },
    ],
  }),
})

function App() {
  const { marketData } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  
  // Appraisal State
  const [activeTab, setActiveTab] = useState<'kalkulator' | 'toko'>((search.t as 'kalkulator' | 'toko') || 'kalkulator')
  const [weight, setWeight] = useState<string>(search.w || '1')
  const [karatIndex, setKaratIndex] = useState<number>(search.k ?? 0)
  const [spread, setSpread] = useState<string>(search.s || '10') // Default 10%
  const [customStorePrice, setCustomStorePrice] = useState<string>('')

  // Sync state changes to URL
  useEffect(() => {
    navigate({
      search: (prev) => ({ ...prev, w: weight, k: karatIndex, s: spread, t: activeTab }),
      replace: true, // Replace history to prevent spamming back button
    })
  }, [weight, karatIndex, spread, activeTab, navigate])

  const selectedKarat = PURITY_TABLE[karatIndex]
  
  // Logic Calculations
  const numWeight = Number(weight) || 0
  const numSpread = Number(spread) || 0

  const trueGoldWeight = numWeight * selectedKarat.purity
  const intrinsicValue = trueGoldWeight * marketData.price24kIdr
  const buybackEstimate = intrinsicValue * (1 - numSpread / 100)
  const intrinsicPerGram = marketData.price24kIdr * selectedKarat.purity

  // Sync custom store price field when spread or intrinsic value changes
  useEffect(() => {
    if (document.activeElement?.id !== 'custom-price-input') {
      const currentStorePrice = intrinsicPerGram * (1 - numSpread / 100)
      setCustomStorePrice(Math.round(currentStorePrice).toString())
    }
  }, [numSpread, intrinsicPerGram])

  const handleCustomPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Hanya ambil angka dan hilangkan angka nol di depan (misal: 06 jadi 6)
    let rawValue = e.target.value.replace(/\D/g, '')
    if (rawValue.length > 1 && rawValue.startsWith('0')) {
      rawValue = rawValue.replace(/^0+/, '')
      if (rawValue === '') rawValue = '0'
    }
    setCustomStorePrice(rawValue)
    if (rawValue === '') return
    const price = Number(rawValue)
    if (!isNaN(price) && intrinsicPerGram > 0) {
      let calculatedSpread = 100 - (price / intrinsicPerGram) * 100
      if (calculatedSpread < 0) calculatedSpread = 0
      if (calculatedSpread > 50) calculatedSpread = 50
      setSpread((Math.round(calculatedSpread * 100) / 100).toString())
    }
  }

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valString = e.target.value
    if (valString.length > 1 && valString.startsWith('0') && !valString.startsWith('0.')) {
      valString = valString.replace(/^0+/, '')
    }
    setWeight(valString)
  }

  const handleSpreadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valString = e.target.value
    if (valString.length > 1 && valString.startsWith('0') && !valString.startsWith('0.')) {
      valString = valString.replace(/^0+/, '')
    }
    // Prevent strictly negative inputs via manual type
    if (valString.startsWith('-')) valString = '0'
    setSpread(valString)
  }

  const formatCurrencyInput = (val: string) => {
    if (!val) return ''
    const num = Number(val)
    if (isNaN(num)) return val
    return num.toLocaleString('id-ID')
  }

  return (
    <main className="page-wrap px-4 pb-12 pt-8">
      {/* Screen 1: Market Dashboard */}
      <section className="mb-8 grid gap-4 sm:grid-cols-3 rise-in stagger-1">
        <div className="island-shell rounded-2xl p-5 border-(--line)">
          <p className="island-kicker mb-1">XAU / USD</p>
          <h3 className="text-2xl font-bold text-(--sea-ink)">
            ${marketData.xauUsd.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-(--sea-ink-soft)">Per Troy Oz</p>
        </div>
        <div className="island-shell rounded-2xl p-5 border-(--line)">
          <p className="island-kicker mb-1">USD / IDR</p>
          <h3 className="text-2xl font-bold text-(--sea-ink)">
            Rp {marketData.usdIdr.toLocaleString('id-ID')}
          </h3>
          <p className="text-xs text-(--sea-ink-soft)">Kurs Saat Ini</p>
        </div>
        <div className="island-shell rounded-2xl p-5 shadow-lg border-(--line)">
          <p className="text-[0.65rem] uppercase tracking-wider font-bold text-(--sea-ink-soft) mb-1">Harga Emas 24K (IDR/gr)</p>
          <h3 className="text-2xl font-bold text-(--sea-ink)">
            Rp {Math.round(marketData.price24kIdr).toLocaleString('id-ID')}
          </h3>
          <p className="text-[10px] text-(--sea-ink-soft)">Update: {marketData.updatedAt}</p>
        </div>
      </section>

      <div className="flex flex-col md:flex-row gap-8 rise-in stagger-2">
        {/* Left Sidebar for Tabs */}
        <aside className="w-full md:w-48 shrink-0">
          <div className="flex flex-row md:flex-col gap-2 sticky top-8">
            <button 
              onClick={() => setActiveTab('kalkulator')}
              className={`flex-1 md:w-full text-left rounded-xl px-4 py-3 text-sm font-bold transition-all flex items-center justify-center md:justify-start gap-3 ${activeTab === 'kalkulator' ? 'bg-(--surface) text-(--sea-ink) shadow-md ring-1 ring-black/5 dark:ring-white/10' : 'text-(--sea-ink-soft) hover:text-(--sea-ink) hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
              <svg className="w-5 h-5 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              <span>Kalkulator</span>
            </button>
            <button 
              onClick={() => setActiveTab('toko')}
              className={`flex-1 md:w-full text-left rounded-xl px-4 py-3 text-sm font-bold transition-all flex items-center justify-center md:justify-start gap-3 ${activeTab === 'toko' ? 'bg-(--surface) text-(--sea-ink) shadow-md ring-1 ring-black/5 dark:ring-white/10' : 'text-(--sea-ink-soft) hover:text-(--sea-ink) hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
              <svg className="w-5 h-5 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span>Direktori</span>
            </button>
          </div>
        </aside>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'kalkulator' && (
            <div className="grid gap-8 xl:grid-cols-2">
          {/* Screen 2: Smart Appraisal Input */}
          <section className="island-shell rounded-3xl p-8 rise-in stagger-2 border-(--line)">
          <div className="mb-6">
            <h2 className="display-title text-3xl font-bold text-(--sea-ink) mb-2">Valuasi Perhiasan</h2>
            <p className="text-sm text-(--sea-ink-soft)">Lengkapi spesifikasi aset emas Anda untuk mendapatkan taksiran nilai yang akurat dan transparan.</p>
          </div>

          <div className="space-y-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-(--sea-ink)">
                  <ScaleIcon className="h-4 w-4 text-gold" />
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
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-(--sea-ink-soft)">gr</span>
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-(--sea-ink)">
                  <BadgeIcon className="h-4 w-4 text-gold" />
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
                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 rounded-2xl bg-black/5 p-5 dark:bg-white/5 border border-(--line)">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-bold text-(--sea-ink)">
                    <PercentIcon className="h-4 w-4 text-gold" />
                    Potongan (Spread)
                  </label>
                  <div className="flex items-center gap-0.5 rounded-md bg-transparent px-2 py-1">
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
                  <StoreIcon className="h-4 w-4 text-gold" />
                  Harga Buyback Toko (Per Gram)
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-(--sea-ink-soft)">Rp</span>
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
                <p className="mt-2 text-xs text-(--sea-ink-soft)">
                  Persentase Spread akan terkalibrasi secara otomatis berdasarkan nominal yang Anda masukkan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Screen 3: Valuation Breakdown */}
        <section className="flex flex-col gap-6 rise-in stagger-3">
          <div className="island-shell overflow-hidden rounded-3xl relative shadow-[0_10px_40px_rgba(201,162,39,0.15)] ring-1 ring-gold/30">
            {/* Soft Glow Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-transparent pointer-events-none"></div>
            
            <div className="absolute -top-10 -right-10 p-4 text-gold opacity-10 pointer-events-none">
              <svg width="240" height="240" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
              </svg>
            </div>
            
            <div className="relative z-10 p-8">
              <p className="text-(--kicker) uppercase tracking-[0.2em] font-bold text-[0.65rem] mb-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse"></span>
                Estimasi Harga Terima
              </p>
              <h2 className="text-4xl sm:text-5xl font-black text-(--sea-ink) mb-8 tracking-tight drop-shadow-sm">
                Rp {Math.round(buybackEstimate).toLocaleString('id-ID')}
              </h2>

              <div className="relative">
                <div className="absolute -left-8 right-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>
                
                <div className="grid grid-cols-2 gap-6 pt-6 relative">
                  <div className="relative">
                    <div className="absolute -right-3 top-0 bottom-0 w-px bg-(--line)"></div>
                    <p className="text-[10px] uppercase text-(--sea-ink-soft) mb-1 font-bold tracking-wider">Berat Emas Murni</p>
                    <p className="text-xl font-bold text-(--sea-ink)">{trueGoldWeight.toFixed(3)} <span className="text-sm font-normal text-(--sea-ink-soft)">gr</span></p>
                  </div>
                  <div className="pl-3">
                    <p className="text-[10px] uppercase text-(--sea-ink-soft) mb-1 font-bold tracking-wider">Nilai Intrinsik</p>
                    <p className="text-xl font-bold text-(--sea-ink)">Rp {Math.round(intrinsicValue).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="island-shell rounded-2xl bg-(--bg-base) p-6 border-(--line) rise-in stagger-4">
            <div className="flex gap-4">
              <div className="shrink-0 h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center text-gold-dark text-sm font-serif font-bold">i</div>
              <div>
                <h4 className="text-sm font-bold text-(--sea-ink) mb-1">Catatan Penting</h4>
                <p className="text-xs text-(--sea-ink-soft) leading-relaxed">
                  Estimasi ini berdasarkan nilai intrinsik kandungan emas murni. 
                  <strong className="font-semibold text-(--sea-ink)"> Ongkos pembuatan, jasa tukang, dan berat batu permata tidak termasuk </strong> 
                  dalam perhitungan ini. Gunakan nilai ini sebagai referensi dasar.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      )}

          {activeTab === 'toko' && (
            <StoreDirectoryMockup />
          )}
        </div>
      </div>
    </main>
  )
}

function StoreDirectoryMockup() {
  return (
    <div className="w-full rise-in stagger-2">
      <div className="island-shell rounded-3xl p-8 border-(--line) relative overflow-hidden">
        {/* Soft Map-like Background Pattern or Gradient */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/40 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative text-center mb-10 mt-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full bg-gradient-to-r from-amber-200 to-gold text-yellow-900 text-[10px] font-bold uppercase tracking-widest shadow-sm">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
            Emasku PRO
          </div>
          <h2 className="display-title text-3xl font-bold text-(--sea-ink) mb-3">Temukan Toko Terdekat</h2>
          <p className="text-sm text-(--sea-ink-soft) max-w-md mx-auto mb-8">
            Dapatkan akses eksklusif ke direktori toko emas di sekitar Anda yang terbukti memberikan harga buyback terbaik (spread terendah).
          </p>
          <button 
            onClick={() => alert('Fitur ini masih dalam tahap pengembangan. Tunggu update Emasku berikutnya!')}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-white px-6 py-3 font-bold text-white dark:text-zinc-900 shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.2)]"
          >
            <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Buka Kunci Akses Lokasi (PRO)
          </button>
        </div>

        {/* Dummy List */}
        <div className="space-y-4 relative">
          
          <div className="rounded-2xl border border-gold/30 bg-gold/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden transition-all hover:bg-gold/10 cursor-pointer">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gold" />
            <div className="pl-2">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-(--sea-ink) text-lg">Toko Emas Mulia Makmur</h4>
                <span className="bg-gold text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Mitra Emasku
                </span>
              </div>
              <p className="text-xs text-(--sea-ink-soft) flex items-center gap-1.5">
                <span className="text-yellow-500">★★★★★</span> <span className="font-medium">(4.9)</span> • 1.2 km dari Anda
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10px] uppercase font-bold text-(--sea-ink-soft) tracking-wider mb-0.5">Est. Potongan (24K)</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">~ 2.5%</p>
            </div>
          </div>

          <div className="rounded-2xl border border-(--line) bg-(--bg-base) p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-90 transition-all hover:opacity-100 cursor-pointer">
            <div className="pl-2">
              <h4 className="font-bold text-(--sea-ink) text-lg mb-1">Toko Perhiasan Indah</h4>
              <p className="text-xs text-(--sea-ink-soft) flex items-center gap-1.5">
                <span className="text-yellow-500">★★★★☆</span> <span className="font-medium">(4.2)</span> • 2.5 km dari Anda
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10px] uppercase font-bold text-(--sea-ink-soft) tracking-wider mb-0.5">Est. Potongan (24K)</p>
              <p className="text-xl font-bold text-(--sea-ink)">~ 4.0%</p>
            </div>
          </div>
          
          <div className="rounded-2xl border border-(--line) bg-(--bg-base) p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-75 transition-all hover:opacity-100 cursor-pointer">
            <div className="pl-2">
              <h4 className="font-bold text-(--sea-ink) text-lg mb-1">Sinar Baru Gold</h4>
              <p className="text-xs text-(--sea-ink-soft) flex items-center gap-1.5">
                <span className="text-yellow-500">★★★★☆</span> <span className="font-medium">(4.0)</span> • 3.8 km dari Anda
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10px] uppercase font-bold text-(--sea-ink-soft) tracking-wider mb-0.5">Est. Potongan (24K)</p>
              <p className="text-xl font-bold text-(--sea-ink)">~ 5.5%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


