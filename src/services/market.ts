import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Store } from "../types/store";

export const getMarketData = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const [goldRes, ratesRes] = await Promise.all([
        fetch("https://api.gold-api.com/price/XAU"),
        fetch("https://api.frankfurter.app/latest?from=USD&to=IDR"),
      ]);

      if (!goldRes.ok || !ratesRes.ok) throw new Error("API response failed");

      const goldJson = await goldRes.json();
      const ratesJson = await ratesRes.json();

      const xauUsd = goldJson.price;
      const usdIdr = ratesJson.rates.IDR;

      const pricePerGramUsd = xauUsd / 31.1035;
      const price24kIdr = pricePerGramUsd * usdIdr;

      return {
        xauUsd,
        usdIdr,
        price24kIdr,
        updatedAt: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };
    } catch (error) {
      console.error("Failed to fetch market data:", error);
      const fallbackXauUsd = 4715.2;
      const fallbackUsdIdr = 17370;
      return {
        xauUsd: fallbackXauUsd,
        usdIdr: fallbackUsdIdr,
        price24kIdr: (fallbackXauUsd / 31.1035) * fallbackUsdIdr,
        updatedAt: "Offline Mode",
      };
    }
  },
);

// Helper for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const findNearbyStores = createServerFn({ method: "POST" }).handler(
  async (ctx: any) => {
    const { lat, lng, radius, specificQuery } = z
      .object({ 
        lat: z.number(), 
        lng: z.number(),
        radius: z.number().optional().default(15000),
        specificQuery: z.string().optional()
      })
      .parse(ctx.data);
      
    const API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!API_KEY) {
      console.error("Google Maps API Key is missing");
      return [];
    }

    try {
      const isLargeRadius = radius > 50000;
      const endpoint = "https://places.googleapis.com/v1/places:searchText";
      const query = specificQuery || "Toko Emas OR Jewelry OR Logam Mulia OR Perhiasan";

      const body = isLargeRadius 
        ? (() => {
            const latDelta = radius / 111000;
            const lngDelta = radius / (111000 * Math.cos(lat * (Math.PI / 180)));
            return {
              textQuery: query,
              maxResultCount: 20,
              locationRestriction: {
                rectangle: {
                  low: { latitude: lat - latDelta, longitude: lng - lngDelta },
                  high: { latitude: lat + latDelta, longitude: lng + lngDelta },
                },
              },
            };
          })()
        : {
            textQuery: query,
            maxResultCount: 20,
            locationBias: {
              circle: {
                center: { latitude: lat, longitude: lng },
                radius: radius,
              },
            },
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": "places.id,places.displayName,places.rating,places.userRatingCount,places.formattedAddress,places.googleMapsUri,places.websiteUri,places.location,places.photos,places.regularOpeningHours,places.internationalPhoneNumber",
        },
        body: JSON.stringify(body),
      });

      const resData = await response.json();
      
      if (response.status !== 200) {
        console.error("Google Places API Error:", resData.error?.message || response.statusText);
        return [];
      }

      if (resData.places && resData.places.length > 0) {
        let validPlaces = resData.places;
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (GEMINI_API_KEY) {
          try {
            const placesList = validPlaces.map((p: any) => ({
              id: p.id,
              name: p.displayName?.text || "",
              address: p.formattedAddress || "",
              review_count: p.userRatingCount || 0,
            }));

            const prompt = `Anda adalah asisten AI yang memfilter toko perhiasan/emas.
Diberikan array JSON tempat dari Google Maps: ${JSON.stringify(placesList)}
Tugas: Kembalikan HANYA array JSON berisi string 'id' dari tempat yang JELAS merupakan toko emas, perhiasan, atau layanan jual beli logam mulia.
Gunakan 'address' untuk konteks (pasar perhiasan, mall, dll). Jika 'review_count' adalah 0 DAN namanya meragukan, buang.
Abaikan warung makan, toko pakaian, salon, bengkel, rumah sakit, dll.
Format balasan HANYA array JSON murni: ["id1", "id2"]`;

            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
                }),
              },
            );

            const geminiData = await geminiRes.json();
            const textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
              const validIds = JSON.parse(textResponse);
              if (Array.isArray(validIds)) {
                validPlaces = validPlaces.filter((p: any) => validIds.includes(p.id));
              }
            }
          } catch (e) {
            console.error("Gemini filter error:", e);
          }
        }
        
        const formatAddress = (address: string) => {
          if (!address) return "";
          const parts = address.split(', ');
          const cityIndex = parts.findIndex(p => p.startsWith('Kota ') || p.startsWith('Kabupaten '));
          if (cityIndex !== -1) {
            return parts.slice(0, cityIndex + 1).join(', ');
          }
          if (parts.length > 3 && parts[parts.length - 1].toLowerCase() === 'indonesia') {
            return parts.slice(0, parts.length - 2).join(', ');
          }
          return address;
        };

        const radiusKm = radius / 1000;
        const stores = validPlaces
          .map((place: any) => {
            const distKm = place.location
              ? calculateDistance(lat, lng, place.location.latitude, place.location.longitude)
              : 0;
            return {
              id: place.id,
              name: place.displayName?.text || "Toko Emas",
              rating: place.rating || 0,
              userRatingCount: place.userRatingCount || 0,
              vicinity: formatAddress(place.formattedAddress),
              distance: distKm.toFixed(1) + " km",
              duration: Math.ceil((distKm / 20) * 60) + " mnt",
              rawDistance: distKm,
              googleMapsUri: place.googleMapsUri,
              websiteUri: place.websiteUri,
              hasWebsite: !!place.websiteUri,
              photoName: place.photos?.[0]?.name,
              isOpen: place.regularOpeningHours?.openNow,
              phone: place.internationalPhoneNumber,
              isPartner: place.rating >= 4.5 && place.userRatingCount > 10,
              estimatedSpread: place.rating >= 4.5 ? 2.5 : 3.0,
            };
          })
          .filter((s: Store) => (s.rawDistance || 0) <= radiusKm);

        return stores.sort((a: Store, b: Store) => (a.rawDistance || 0) - (b.rawDistance || 0));
      }
      return [];
    } catch (error) {
      console.error("findNearbyStores exception:", error);
      return [];
    }
  },
);

export const getLiveStorePrice = createServerFn({ method: "POST" }).handler(
  async (ctx: any) => {
    const { storeName, websiteUrl } = z
      .object({
        storeName: z.string(),
        websiteUrl: z.string(),
      })
      .parse(ctx.data);

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return null;
    }

    const prompt = `Tugas: Cari harga buyback emas perhiasan 24 karat (kadar 99.9%) HARI INI dari toko "${storeName}".

Website resmi (jika ada): ${websiteUrl}

ATURAN PENTING:
- Coba temukan harga yang tertera di website resmi tersebut.
- Jika tidak ada di website, kamu boleh mencari info harga toko tersebut dari pencarian web (artikel berita lokal terpercaya atau info terupdate lainnya).
- JANGAN ambil data dari Instagram, Facebook, Linktree, TikTok, atau media sosial lainnya.
- Jika sama sekali tidak ada informasi harga buyback toko tersebut, kembalikan null untuk semua harga.

Kembalikan respons dalam format JSON berikut (tanpa markdown, tanpa komentar):
{
  "buyPrice": null,
  "sellPrice": <harga buyback per gram dalam Rupiah, atau null jika tidak ditemukan>,
  "spread": <persentase spread jika tersedia, atau null>,
  "lastUpdated": "<tanggal data, contoh: 12 Mei 2025>",
  "source": "<sumber data (URL website atau artikel)>"
}`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            tools: [{ google_search: {} }],
            generationConfig: { temperature: 0.1 },
          }),
        },
      );

      if (!response.ok) {
        console.error("Gemini API error:", response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return null;

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("[Live Price] No JSON found in Gemini response");
        return null;
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("getLiveStorePrice error:", error);
      return null;
    }
  },
);
