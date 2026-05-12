export type Store = {
  id: string;
  name: string;
  rating: number;
  user_ratings_total: number;
  vicinity: string;
  distance?: string;
  duration?: string;
  googleMapsUri?: string;
  hasWebsite?: boolean;
  isPartner?: boolean;
  estimatedSpread?: string;
};
