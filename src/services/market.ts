import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

// Haversine formula to calculate distance in km
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export const findNearbyStores = createServerFn({ method: "POST" }).handler(
  async (ctx: any) => {
    const { lat, lng } = z
      .object({ lat: z.number(), lng: z.number() })
      .parse(ctx.data);
    const API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!API_KEY) {
      console.error("Google Maps API Key is missing");
      return [];
    }

    const searchRadii = [5000, 15000, 50000]; // 5km, 15km, 50km (max)

    for (const radius of searchRadii) {
      try {
        const response = await fetch(
          "https://places.googleapis.com/v1/places:searchNearby",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": API_KEY,
              "X-Goog-FieldMask":
                "places.id,places.displayName,places.rating,places.userRatingCount,places.formattedAddress,places.googleMapsUri,places.websiteUri,places.location",
            },
            body: JSON.stringify({
              includedTypes: ["jewelry_store"],
              maxResultCount: 5,
              locationRestriction: {
                circle: {
                  center: { latitude: lat, longitude: lng },
                  radius: radius,
                },
              },
            }),
          },
        );

        const resData = await response.json();

        if (response.status !== 200) {
          console.error(
            `Google Places API (New) Error (${radius}m):`,
            resData.error?.message || response.statusText,
          );
          continue;
        }

        if (resData.places && resData.places.length > 0) {
          return resData.places.map((place: any) => {
            let distanceStr = undefined;
            let durationStr = undefined;

            if (place.location) {
              const distKm = calculateDistance(
                lat,
                lng,
                place.location.latitude,
                place.location.longitude,
              );
              distanceStr = distKm.toFixed(1) + " km";

              // Assume average speed of 20 km/h in city
              const durationMins = Math.ceil((distKm / 20) * 60);
              durationStr = durationMins + " mnt";
            }

            return {
              id: place.id,
              name: place.displayName?.text || "Toko Emas",
              rating: place.rating || 0,
              user_ratings_total: place.userRatingCount || 0,
              vicinity: place.formattedAddress || "",
              distance: distanceStr,
              duration: durationStr,
              googleMapsUri: place.googleMapsUri,
              hasWebsite: !!place.websiteUri,
              isPartner: Math.random() > 0.8,
              estimatedSpread: (Math.random() * (5.5 - 2.0) + 2.0).toFixed(1),
            };
          });
        }
      } catch (error) {
        console.error(`Error fetching stores at radius ${radius}:`, error);
      }
    }

    return [];
  },
);
