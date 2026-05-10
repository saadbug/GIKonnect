// src/app/lib/foodData.ts
import { supabase } from './supabase';

// --- TYPES ---
export type Review = {
  id: string;
  item_id: string;
  user_email: string;
  user_name: string;
  user_label?: string;
  rating: number;
  comment: string;
  created_at: any;
};

export type MessComment = {
  id: string;
  user_email: string;
  user_name: string;
  user_label?: string;
  comment: string;
  created_at: any;
};

export type MenuItem = {
  id: string;
  name: string;
  price: number; 
  category: string; 
  image: string;
  description?: string;
  variations?: {
    id: string;
    name: string;
    price: number;
  }[];
};

export type Venue = {
  id: string;
  name: string;
  type: "Restaurant" | "Cafe" | "Mess" | "Beverage";
  image: string;
  description: string;
  phoneNumber?: string;
};

// --- DATABASE FETCH FUNCTIONS ---

/**
 * Fetches all GIKI campus dining venues directly from Postgres.
 */
export async function fetchVenues(): Promise<Venue[]> {
  const { data, error } = await supabase
    .from('venues')
    .select('*');

  if (error) {
    console.error('Error fetching venues from Supabase:', error.message);
    return [];
  }

  // Map snake_case from DB to camelCase for the frontend if needed
  return data.map((v: any) => ({
    id: v.id,
    name: v.name,
    type: v.type,
    image: v.image_url,
    description: v.description,
    phoneNumber: v.phone_number
  }));
}

/**
 * Fetches menu items for a specific venue, automatically joining their variations
 * from the 3NF item_variations table.
 */
export async function fetchMenuItemsByVenue(venueId: string): Promise<MenuItem[]> {
  // We use Supabase's relationship syntax to fetch variations at the same time
  const { data, error } = await supabase
    .from('menu_items')
    .select(`
      id,
      name,
      base_price,
      category,
      image_url,
      description,
      item_variations (
        id,
        name,
        price
      )
    `)
    .eq('venue_id', venueId);

  if (error || !data) {
    console.error(`Error fetching menu items for venue ${venueId}:`, error?.message);
    return [];
  }

  // Map the data back into the shape your frontend expects
  return data.map((item: any) => ({
    id: item.id,
    name: item.name,
    price: item.base_price,
    category: item.category,
    image: item.image_url,
    description: item.description,
    // Attach variations only if they exist
    variations: item.item_variations?.length > 0 ? item.item_variations : undefined
  }));
}

/**
 * Fetches reviews for a specific menu item.
 */
export async function fetchReviewsByItem(itemId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching reviews for item ${itemId}:`, error.message);
    return [];
  }
  return data as Review[];
}

/**
 * Fetches the Mess Menu for a specific day.
 */
export async function fetchMessMenuByDay(dayOfWeek: string) {
  const { data, error } = await supabase
    .from('mess_menu')
    .select('meal_type, meal_description')
    .eq('day_of_week', dayOfWeek);

  if (error || !data) {
    console.error(`Error fetching mess menu for ${dayOfWeek}:`, error?.message);
    return null;
  }

  // Convert array of rows into a single object { Breakfast: "...", Lunch: "..." }
  const menuObject: Record<string, string> = {};
  data.forEach((meal: any) => {
    menuObject[meal.meal_type] = meal.meal_description;
  });

  return menuObject;
}