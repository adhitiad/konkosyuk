/**
 * Tipe-tipe review dan rating.
 */

export interface ReviewCardData {
  id: string;
  type: "tenant" | "property";
  rating: number;
  cleanliness: number;
  security: number;
  accuracy: number;
  communication: number;
  valueForMoney: number;
  comment: string;
  createdAt: Date;
  reviewerName: string;
  reviewerImage: string;
  propertyName: string;
  reply?: {
    id: string;
    content: string;
    createdAt: Date;
  };
}

export interface PropertyRatingsData {
  averageRating: number;
  totalReviews: number;
  cleanliness: number;
  security: number;
  accuracy: number;
  communication: number;
  valueForMoney: number;
  ratingDistribution: Record<number, number>;
  recentReviews: ReviewCardData[];
}

export type ReviewInput = {
  rating: number;
  cleanliness: number;
  security: number;
  accuracy: number;
  communication: number;
  valueForMoney: number;
  comment: string;
  propertyId: string;
};
