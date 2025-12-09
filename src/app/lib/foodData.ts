export type Review = {
    id: string;
    itemId: string; // Links review to specific food item
    userEmail: string;
    userName: string;
    userLabel?: string;
    rating: number;
    comment: string;
    timestamp: any; // Firestore timestamp
  };
  
  export type MessComment = {
    id: string;
    userEmail: string;
    userName: string;
    comment: string;
    timestamp: any;
  };
  
  export type MenuItem = {
    id: string;
    name: string;
    price: number;
    category: "Desi" | "Fast Food" | "Beverages" | "Snacks" | "Special";
    image: string;
    // We removed static 'rating' and 'reviews' arrays because these now come from DB
  };
  
  export type Venue = {
    id: string;
    name: string;
    type: "Restaurant" | "Cafe" | "Mess" | "Beverage";
    image: string;
    description: string;
    phoneNumber?: string; // New Field
  };
  
  export const VENUES: Venue[] = [
    { id: "raju", name: "Raju", type: "Restaurant", image: "from-orange-500 to-red-500", description: "The classic student go-to for desi meals.", phoneNumber: "03001234567" },
    { id: "ayan", name: "Ayan", type: "Restaurant", image: "from-blue-500 to-indigo-500", description: "Famous for karahi and late night parathas.", phoneNumber: "03007654321" },
    { id: "hot-spicy", name: "Hot & Spicy", type: "Restaurant", image: "from-red-600 to-rose-600", description: "BBQ and fast food specials.", phoneNumber: "03121234567" },
    { id: "asrar-bucks", name: "Asrar Bucks", type: "Beverage", image: "from-emerald-500 to-green-600", description: "Premium coffee and shakes.", phoneNumber: "03339998888" },
    { id: "gikafe", name: "Gikafe", type: "Cafe", image: "from-yellow-400 to-orange-500", description: "Affordable snacks and tea." }, // No phone for Gikafe usually
    { id: "mess", name: "GIKI Mess", type: "Mess", image: "from-slate-700 to-slate-900", description: "Weekly meal plan." },
  ];
  
  // ... Keep MENU_ITEMS and MESS_MENU as they were, just remove static ratings/reviews from them.
  export const MENU_ITEMS: Record<string, MenuItem[]> = {
    raju: [
      { id: "r1", name: "Chicken Biryani", price: 350, category: "Desi", image: "/placeholder.png" },
      { id: "r2", name: "Daal Chawal", price: 200, category: "Desi", image: "/placeholder.png" },
    ],
    ayan: [
      { id: "a1", name: "Chicken Paratha Roll", price: 250, category: "Fast Food", image: "/placeholder.png" },
      { id: "a2", name: "Zinger Burger", price: 450, category: "Fast Food", image: "/placeholder.png" },
    ],
    "hot-spicy": [
      { id: "hs1", name: "BBQ Platter", price: 800, category: "Special", image: "/placeholder.png" },
      { id: "hs2", name: "Club Sandwich", price: 350, category: "Fast Food", image: "/placeholder.png" },
    ],
    "asrar-bucks": [
      { id: "ab1", name: "Iced Latte", price: 400, category: "Beverages", image: "/placeholder.png" },
      { id: "ab2", name: "Mint Margarita", price: 250, category: "Beverages", image: "/placeholder.png" },
    ],
    gikafe: [
      { id: "gk1", name: "Samosa", price: 30, category: "Snacks", image: "/placeholder.png" },
      { id: "gk2", name: "Chai", price: 50, category: "Beverages", image: "/placeholder.png" },
    ],
  };
  
  export const MESS_MENU = {
    Monday: { 
      Breakfast: "Cheese Omelette - Paratha - Chai", 
      Lunch: "Chicken Haleem - Brown Pyaaz (Onions) - Roti", 
      Dinner: "Chicken Biryani - Raita" 
    },
    Tuesday: { 
      Breakfast: "Chicken Sausage - Bread - Chai", 
      Lunch: "Daal Chana - Aloo Cutlets - Roti", 
      Dinner: "Chicken Fried - Savour Rice - Chai" 
    },
    Wednesday: { 
      Breakfast: "French Toast - Chai", 
      Lunch: "Chana Pulao - Raita", 
      Dinner: "Chicken Achari - Roti - Custard Jelly" 
    },
    Thursday: { 
      Breakfast: "Paratha - Chicken Qeema - Chai", 
      Lunch: "Chicken Chapli Kabab - Mix Daal - Roti - Fruit", 
      Dinner: "Chicken Shashlik - White Rice" 
    },
    Friday: { 
      Breakfast: "Aloo Paratha - Dahi (Yogurt) - Chai", 
      Lunch: "Sada Pulao - Shami Kabab - Raita", 
      Dinner: "Makhni Handi - Roti" 
    },
    Saturday: { 
      Breakfast: "Halwa Puri - Safed Chana - Chai", 
      Lunch: "Chicken Kabuli Pulao - Raita", 
      Dinner: "Chicken Qorma - Roti" 
    },
    Sunday: { 
      Breakfast: "Anda Fry - Omelette - Bread - Jam - Chai", 
      Lunch: "Chicken Pulao - Raita", 
      Dinner: "Chicken Vegetable Macaroni - Ketchup" 
    },
  };