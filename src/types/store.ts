export type Store = {
  id: string;
  name: string;
  rating: number;
  userRatingCount: number;
  vicinity: string;
  distance?: string;
  duration?: string;
  googleMapsUri?: string;
  websiteUri?: string;
  hasWebsite?: boolean;
  photoName?: string;
  isOpen?: boolean;
  phone?: string;
  isPartner?: boolean;
  rawDistance?: number;
  estimatedSpread?: number;
};

export type LivePrice = {
  buyPrice: number | null;
  sellPrice: number | null;
  spread: number | null;
  lastUpdated: string;
  source: string;
};
