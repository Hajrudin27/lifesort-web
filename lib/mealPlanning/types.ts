export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface RecipeIngredient {
  name: string;
  amount: string;
}

export interface Recipe {
  id: string;
  name: string;
  mealType: MealType;
  ingredients: RecipeIngredient[];
}

export interface GlobalStandardPrice {
  id: string;
  productName: string;
  store: string;
  price: number;
}

export interface GlobalOffer {
  id: string;
  productName: string;
  store: string;
  offerPrice: number;
  validFrom: string;
  validTo: string;
}