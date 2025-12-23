// lib/foodData.ts

export type Review = {
  id: string;
  itemId: string;
  userEmail: string;
  userName: string;
  userLabel?: string;
  rating: number;
  comment: string;
  timestamp: any;
};

export type MessComment = {
  id: string;
  userEmail: string;
  userName: string;
  userLabel?: string;
  comment: string;
  timestamp: any;
};

// UPDATED: Added 'variations' and changed category to string
export type MenuItem = {
  id: string;
  name: string;
  price: number; // Base price or starting price
  category: string; // Changed to string to allow flexible categories
  image: string;
  description?: string;
  // New field to handle sizes (Small, Medium, Large)
  variations?: {
    id: string; // Unique ID for the variation (useful for cart)
    name: string; // e.g., "Medium", "Large", "Single", "Double"
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

export const VENUES: Venue[] = [
  { id: "raju", name: "Raju", type: "Restaurant", image: "from-orange-500 to-red-500", description: "The classic student go-to for desi meals.", phoneNumber: "03345627486" },
  { id: "ayan", name: "Ayan", type: "Restaurant", image: "from-blue-500 to-indigo-500", description: "Famous for karahi and late night parathas.", phoneNumber: "03025786466" },
  { id: "hot-spicy", name: "Hot & Spicy", type: "Restaurant", image: "from-red-600 to-rose-600", description: "BBQ and fast food specials.", phoneNumber: "03325193858" },
  { id: "asrar-bucks", name: "Asrar Bucks", type: "Beverage", image: "from-emerald-500 to-green-600", description: "Premium coffee and shakes." },
  { id: "gikafe", name: "Gikafe", type: "Cafe", image: "from-yellow-400 to-orange-500", description: "Affordable snacks and tea." },
  { id: "mess", name: "GIKI Mess", type: "Mess", image: "from-slate-700 to-slate-900", description: "Weekly meal plan." },
];

export const MENU_ITEMS: Record<string, MenuItem[]> = {
  "raju": [
    // --- PIZZA (Optimized with Variations) ---
    {
      id: "piz1", name: "Smoked Pizza", price: 800, category: "Pizza", image: "/placeholder.png",
      variations: [
        { id: "piz1_m", name: "Medium", price: 800 },
        { id: "piz1_l", name: "Large", price: 1500 }
      ]
    },
    {
      id: "piz2", name: "Deluxe Pizza", price: 900, category: "Pizza", image: "/placeholder.png",
      variations: [
        { id: "piz2_m", name: "Medium", price: 900 },
        { id: "piz2_l", name: "Large", price: 1600 }
      ]
    },
    {
      id: "piz3", name: "Royal Crust Pizza", price: 1000, category: "Pizza", image: "/placeholder.png",
      variations: [
        { id: "piz3_m", name: "Medium", price: 1000 },
        { id: "piz3_l", name: "Large", price: 1700 }
      ]
    },
    {
      id: "piz4", name: "Star Bite Pizza", price: 1000, category: "Pizza", image: "/placeholder.png",
      variations: [
        { id: "piz4_m", name: "Medium", price: 1000 },
        { id: "piz4_l", name: "Large", price: 1800 }
      ]
    },
    { id: "piz5", name: "Pizza Paratha", price: 400, category: "Pizza", image: "/placeholder.png" },
    
    // --- SPECIALTY PIZZAS (Optimized) ---
    {
      id: "piz6", name: "Special Pizza", price: 450, category: "Pizza", image: "/placeholder.png",
      variations: [
        { id: "piz6_s", name: "Small", price: 450 },
        { id: "piz6_m", name: "Medium", price: 850 },
        { id: "piz6_l", name: "Large", price: 1400 }
      ]
    },
    { id: "piz7", name: "Kebabish Pizza", price: 850, category: "Pizza", image: "/placeholder.png" },
    { id: "piz8", name: "Crunchy Pizza", price: 850, category: "Pizza", image: "/placeholder.png" },
    { id: "piz9", name: "Calzone Pizza", price: 850, category: "Pizza", image: "/placeholder.png" },
    { id: "piz10", name: "Papa Chinos White Special", price: 850, category: "Pizza", image: "/placeholder.png" },
    { id: "piz11", name: "Mayo Garlic Pizza", price: 850, category: "Pizza", image: "/placeholder.png" },
    { id: "piz12", name: "Mughlai Pizza", price: 850, category: "Pizza", image: "/placeholder.png" },
    { id: "piz13", name: "Afghani Pizza", price: 850, category: "Pizza", image: "/placeholder.png" },
    { id: "piz14", name: "Chapli Pizza", price: 850, category: "Pizza", image: "/placeholder.png" },
    { id: "piz15", name: "Malai Boti Pizza", price: 850, category: "Pizza", image: "/placeholder.png" },
    { id: "piz16", name: "Behari Kabab Pizza", price: 850, category: "Pizza", image: "/placeholder.png" },
    { id: "piz17", name: "Extra Large Pizza", price: 1900, category: "Pizza", image: "/placeholder.png" },

    // --- CHINESE ---
    { id: "chn1", name: "Parmesan Crusted Chicken with Rice", price: 500, category: "Chinese", image: "/placeholder.png" },
    { id: "chn2", name: "Singaporean Rice", price: 350, category: "Chinese", image: "/placeholder.png" },
    { id: "chn3", name: "Special Garlic Noodles", price: 500, category: "Chinese", image: "/placeholder.png" },
    { id: "chn4", name: "Chicken Peanut Sauce", price: 450, category: "Chinese", image: "/placeholder.png" },
    { id: "chn5", name: "Schezwan Chicken", price: 450, category: "Chinese", image: "/placeholder.png" },
    { id: "chn6", name: "Chicken Chilli Dry with Egg Rice", price: 450, category: "Chinese", image: "/placeholder.png" },
    { id: "chn7", name: "Fish Chilli Dry with Egg Rice", price: 450, category: "Chinese", image: "/placeholder.png" },
    { id: "chn8", name: "Chicken Manchurian with Egg Rice", price: 450, category: "Chinese", image: "/placeholder.png" },
    { id: "chn9", name: "Chicken Shashlik with Egg Rice", price: 450, category: "Chinese", image: "/placeholder.png" },
    { id: "chn10", name: "Chicken Chowmein", price: 450, category: "Chinese", image: "/placeholder.png" },
    { id: "chn11", name: "Black Pepper with Rice", price: 450, category: "Chinese", image: "/placeholder.png" },
    { id: "chn12", name: "Tarragon Chicken Plain Rice", price: 450, category: "Chinese", image: "/placeholder.png" },
    { id: "chn13", name: "Mushroom Chicken Plain Rice", price: 450, category: "Chinese", image: "/placeholder.png" },
    { id: "chn14", name: "Kung Pao Chicken Egg Rice", price: 450, category: "Chinese", image: "/placeholder.png" },
    { id: "chn15", name: "Chicken Cashewnuts Egg Rice", price: 450, category: "Chinese", image: "/placeholder.png" },
    { id: "chn16", name: "Spaghetti Bolognese", price: 500, category: "Chinese", image: "/placeholder.png" },
    { id: "chn17", name: "Chicken Chilli Hot Egg Rice", price: 450, category: "Chinese", image: "/placeholder.png" },
    { id: "chn18", name: "Egg Fried Rice Special", price: 250, category: "Chinese", image: "/placeholder.png" },

    // --- SOUPS ---
    { id: "soup1", name: "Chicken Crown Soup", price: 150, category: "Soup", image: "/placeholder.png" },
    { id: "soup2", name: "Chicken Hot & Sour Soup", price: 150, category: "Soup", image: "/placeholder.png" },

    // --- STEAKS ---
    { id: "stk1", name: "Campus Special Steak Chicken", price: 800, category: "Steak", image: "/placeholder.png" },
    { id: "stk2", name: "Special Steak Chicken", price: 850, category: "Steak", image: "/placeholder.png" },
    { id: "stk3", name: "French Connection Chicken", price: 800, category: "Steak", image: "/placeholder.png" },
    { id: "stk4", name: "Pepper Chicken Steak Chicken", price: 800, category: "Steak", image: "/placeholder.png" },
    { id: "stk5", name: "American Steak Chicken", price: 800, category: "Steak", image: "/placeholder.png" },
    { id: "stk6", name: "Bar B.Q Steak Chicken", price: 800, category: "Steak", image: "/placeholder.png" },
    { id: "stk7", name: "Beef Special Steak", price: 1000, category: "Steak", image: "/placeholder.png" },
    { id: "stk8", name: "Mushroom Steak Chicken", price: 800, category: "Steak", image: "/placeholder.png" },

    // --- BURGERS ---
    { id: "bg1", name: "Jalapeno Beef Burger", price: 400, category: "Burger", image: "/placeholder.png" },
    { id: "bg2", name: "Beef Burger", price: 350, category: "Burger", image: "/placeholder.png" },
    { id: "bg3", name: "Relish Special Burger", price: 450, category: "Burger", image: "/placeholder.png" },
    { id: "bg4", name: "Teriyaki Burger", price: 350, category: "Burger", image: "/placeholder.png" },
    { id: "bg5", name: "Chicken Lakin Burger", price: 350, category: "Burger", image: "/placeholder.png" },
    { id: "bg6", name: "Chicken Breast Burger", price: 350, category: "Burger", image: "/placeholder.png" },
    { id: "bg7", name: "Chicken Breast Supreme Burger", price: 400, category: "Burger", image: "/placeholder.png" },
    { id: "bg8", name: "Salami Burger", price: 400, category: "Burger", image: "/placeholder.png" },
    { id: "bg9", name: "BBQ Breast Burger", price: 450, category: "Burger", image: "/placeholder.png" },
    { id: "bg10", name: "Zinger Burger", price: 300, category: "Burger", image: "/placeholder.png" },
    { id: "bg11", name: "Zinger with Fries", price: 350, category: "Burger", image: "/placeholder.png" },
    { id: "bg12", name: "Chapli Burger", price: 350, category: "Burger", image: "/placeholder.png" },
    { id: "bg13", name: "Special Burger", price: 500, category: "Burger", image: "/placeholder.png" },
    { id: "bg14", name: "Pizza Burger", price: 400, category: "Burger", image: "/placeholder.png" },
    { id: "bg15", name: "Zinger Double Tagger", price: 550, category: "Burger", image: "/placeholder.png" },
    { id: "bg16", name: "Zinger Tower with Fries", price: 600, category: "Burger", image: "/placeholder.png" },
    { id: "bg17", name: "Super Zee B Special with Fries", price: 600, category: "Burger", image: "/placeholder.png" },
    { id: "bg18", name: "Patty Burger", price: 290, category: "Burger", image: "/placeholder.png" },
    { id: "bg19", name: "Patty Burger with Fries", price: 350, category: "Burger", image: "/placeholder.png" },

    // --- SANDWICHES ---
    { id: "snd1", name: "Kameera Sandwich", price: 600, category: "Sandwich", image: "/placeholder.png" },
    { id: "snd2", name: "Club Sandwich", price: 350, category: "Sandwich", image: "/placeholder.png" },
    { id: "snd3", name: "Bar B.Q Sandwich", price: 350, category: "Sandwich", image: "/placeholder.png" },
    { id: "snd4", name: "Tikka Sandwich", price: 350, category: "Sandwich", image: "/placeholder.png" },
    { id: "snd5", name: "Cheese Sandwich", price: 390, category: "Sandwich", image: "/placeholder.png" },
    { id: "snd6", name: "Special Sandwich", price: 500, category: "Sandwich", image: "/placeholder.png" },
    { id: "snd7", name: "Twister Sandwich", price: 500, category: "Sandwich", image: "/placeholder.png" },
    { id: "snd8", name: "Pizza Sandwich", price: 500, category: "Sandwich", image: "/placeholder.png" },
    { id: "snd9", name: "Malai Boti Sandwich", price: 490, category: "Sandwich", image: "/placeholder.png" },
    { id: "snd10", name: "Chapli Sandwich", price: 490, category: "Sandwich", image: "/placeholder.png" },
    { id: "snd11", name: "Pizza Shawarma", price: 350, category: "Sandwich", image: "/placeholder.png" },
    { id: "snd12", name: "Alapino Sandwich", price: 500, category: "Sandwich", image: "/placeholder.png" },
    { id: "snd13", name: "Crunchi Sandwich", price: 490, category: "Sandwich", image: "/placeholder.png" },

    // --- PASTA ---
    { id: "pst1", name: "Lasagna Pasta", price: 500, category: "Pasta", image: "/placeholder.png" },
    { id: "pst2", name: "Fettuccine Alfredo Pasta", price: 500, category: "Pasta", image: "/placeholder.png" },
    { id: "pst3", name: "Mushroom Pasta", price: 500, category: "Pasta", image: "/placeholder.png" },
    { id: "pst4", name: "Chicken Lasagna", price: 500, category: "Pasta", image: "/placeholder.png" },
    { id: "pst5", name: "Papa Chinos Special Pasta", price: 450, category: "Pasta", image: "/placeholder.png" },
    { id: "pst6", name: "Creamy Pasta", price: 500, category: "Pasta", image: "/placeholder.png" },
    { id: "pst7", name: "Crunchy Pasta", price: 500, category: "Pasta", image: "/placeholder.png" },
    { id: "pst8", name: "Makroni Pasta", price: 400, category: "Pasta", image: "/placeholder.png" },

    // --- SHAWARMA ---
    { id: "shw1", name: "Malai Boti Shawarma", price: 400, category: "Shawarma", image: "/placeholder.png" },
    { id: "shw2", name: "Alapino Shawarma", price: 250, category: "Shawarma", image: "/placeholder.png" },
    { id: "shw3", name: "Special Shawarma Plater", price: 300, category: "Shawarma", image: "/placeholder.png" },
    { id: "shw4", name: "Chicken Shawarma", price: 250, category: "Shawarma", image: "/placeholder.png" },
    { id: "shw5", name: "Chicken Cheese Shawarma", price: 280, category: "Shawarma", image: "/placeholder.png" },
    { id: "shw6", name: "Zinger Shawarma", price: 300, category: "Shawarma", image: "/placeholder.png" },
    { id: "shw7", name: "Chicken Mushroom Shawarma", price: 300, category: "Shawarma", image: "/placeholder.png" },
    { id: "shw8", name: "Kabab Roll Shawarma", price: 350, category: "Shawarma", image: "/placeholder.png" },

    // --- PARATHA ROLLS ---
    { id: "pr1", name: "Chicken Paratha Roll", price: 250, category: "Paratha Roll", image: "/placeholder.png" },
    { id: "pr2", name: "Twister Roll", price: 280, category: "Paratha Roll", image: "/placeholder.png" },
    { id: "pr3", name: "Arabian Paratha Roll", price: 250, category: "Paratha Roll", image: "/placeholder.png" },
    { id: "pr4", name: "Jumbo Paratha Roll Special", price: 300, category: "Paratha Roll", image: "/placeholder.png" },
    { id: "pr5", name: "Zinger Paratha Roll", price: 300, category: "Paratha Roll", image: "/placeholder.png" },
    { id: "pr6", name: "Double Paratha Roll", price: 250, category: "Paratha Roll", image: "/placeholder.png" },
    { id: "pr7", name: "Fajita Paratha Roll", price: 320, category: "Paratha Roll", image: "/placeholder.png" },
    { id: "pr8", name: "KMC Paratha Roll Special", price: 250, category: "Paratha Roll", image: "/placeholder.png" },
    { id: "pr9", name: "Malai Boti Paratha", price: 400, category: "Paratha Roll", image: "/placeholder.png" },
    { id: "pr10", name: "Cheese Stick", price: 355, category: "Paratha Roll", image: "/placeholder.png" },
  ],

  "ayan": [
    { id: "a1", name: "Chicken Paratha Roll", price: 250, category: "Fast Food", image: "/placeholder.png" },
    { id: "a2", name: "Zinger Burger", price: 450, category: "Fast Food", image: "/placeholder.png" },
  ],

  "hot-spicy": [
    // 🍕 PIZZA (Optimized)
    {
      id: "pz1", name: "Margarita Pizza", price: 400, category: "Pizza", image: "/placeholder.png",
      variations: [
        { id: "pz1_s", name: "Small", price: 400 },
        { id: "pz1_m", name: "Medium", price: 700 },
        { id: "pz1_l", name: "Large", price: 1200 },
        { id: "pz1_xl", name: "Extra Large", price: 1500 }
      ]
    },
    { id: "pz5", name: "Karara Tikka Pizza", price: 400, category: "Pizza", image: "/placeholder.png" },
    { id: "pz6", name: "Fajita Pizza", price: 400, category: "Pizza", image: "/placeholder.png" },
    { id: "pz7", name: "Tandoori Pizza", price: 400, category: "Pizza", image: "/placeholder.png" },
    { id: "pz8", name: "BBQ Pizza", price: 400, category: "Pizza", image: "/placeholder.png" },
    { id: "pz9", name: "Vegetarian Pizza", price: 400, category: "Pizza", image: "/placeholder.png" },

    // 👨‍🍳 CHEF'S RECOMMENDED PIZZAS (Optimized)
    {
      id: "cp1", name: "Crown Crust Pizza", price: 800, category: "Chef Recommended", image: "/placeholder.png",
      variations: [
        { id: "cp1_m", name: "Medium", price: 800 },
        { id: "cp1_l", name: "Large", price: 1300 },
        { id: "cp1_xl", name: "Extra Large", price: 1700 }
      ]
    },
    { id: "cp4", name: "J.K.S Pizza", price: 800, category: "Chef Recommended", image: "/placeholder.png" },
    { id: "cp5", name: "Stuffed Crust Pizza", price: 800, category: "Chef Recommended", image: "/placeholder.png" },
    { id: "cp6", name: "Bihari Kabab Pizza", price: 800, category: "Chef Recommended", image: "/placeholder.png" },
    { id: "cp7", name: "Spam Cheesy Pizza", price: 800, category: "Chef Recommended", image: "/placeholder.png" },
    { id: "cp8", name: "Supreme Pizza", price: 800, category: "Chef Recommended", image: "/placeholder.png" },
    { id: "cp9", name: "Beef Pepperoni Pizza", price: 800, category: "Chef Recommended", image: "/placeholder.png" },

    // 🍔 BURGERS
    { id: "bg1", name: "Zinger Burger", price: 400, category: "Burger", image: "/placeholder.png" },
    { id: "bg2", name: "Zinger Supreme Burger", price: 600, category: "Burger", image: "/placeholder.png" },
    { id: "bg3", name: "Tower Burger", price: 500, category: "Burger", image: "/placeholder.png" },
    { id: "bg4", name: "Reggy Burger", price: 350, category: "Burger", image: "/placeholder.png" },
    { id: "bg5", name: "Jalapeno Burger", price: 450, category: "Burger", image: "/placeholder.png" },
    {
      id: "bg6", name: "Fillet Burger", price: 400, category: "Burger", image: "/placeholder.png",
      variations: [
        { id: "bg6_s", name: "Single", price: 400 },
        { id: "bg6_d", name: "Double", price: 600 }
      ]
    },
    { id: "bg8", name: "Zinger + Fillet Burger", price: 600, category: "Burger", image: "/placeholder.png" },

    // 🌯 PARATHA ROLL / WRAPS
    { id: "pr1", name: "Pizza Paratha", price: 350, category: "Paratha Roll", image: "/placeholder.png" },
    { id: "pr2", name: "Bihari Roll", price: 450, category: "Paratha Roll", image: "/placeholder.png" },
    { id: "pr3", name: "Zinger Wrap", price: 550, category: "Paratha Roll", image: "/placeholder.png" },
    { id: "pr4", name: "Fillet Wrap", price: 550, category: "Paratha Roll", image: "/placeholder.png" },

    // 🍝 PASTA
    { id: "ps1", name: "Crunchy Pasta", price: 500, category: "Pasta", image: "/placeholder.png" },
    { id: "ps2", name: "Flaming Pasta", price: 400, category: "Pasta", image: "/placeholder.png" },

    // 🍗 STARTERS
    { id: "st1", name: "Bake Wings (6 pcs)", price: 350, category: "Starters", image: "/placeholder.png" },
    { id: "st2", name: "Fried Wings (6 pcs)", price: 400, category: "Starters", image: "/placeholder.png" },
    { id: "st3", name: "Nuggets", price: 500, category: "Starters", image: "/placeholder.png" },
    { id: "st4", name: "Kabab Bites", price: 400, category: "Starters", image: "/placeholder.png" },
    { id: "st5", name: "Crispy Chicken (3 pcs)", price: 600, category: "Starters", image: "/placeholder.png" },
    { id: "st6", name: "Crispy Chicken Strips", price: 500, category: "Starters", image: "/placeholder.png" },

    // 🍟 FRIES (Optimized)
    {
      id: "fr_main", name: "Fries", price: 250, category: "Fries", image: "/placeholder.png",
      variations: [
        { id: "fr1", name: "Small", price: 250 },
        { id: "fr2", name: "Medium", price: 350 },
        { id: "fr3", name: "Large", price: 500 }
      ]
    },
    { id: "fr4", name: "Pizza Fries", price: 500, category: "Fries", image: "/placeholder.png" },

    // 🍛 KARACHI STUDENT CHICKEN BIRYANI
    {
      id: "br1", name: "Chicken Biryani", price: 150, category: "Biryani", image: "/placeholder.png",
      variations: [
        { id: "br1_s", name: "Single", price: 150 },
        { id: "br1_d", name: "Double", price: 300 }
      ]
    },
    {
      id: "br2", name: "Sada Biryani", price: 100, category: "Biryani", image: "/placeholder.png",
      variations: [
        { id: "br3_s", name: "Single", price: 100 },
        { id: "br3_d", name: "Double", price: 200 }
      ]
    }
  ],

  "asrar-bucks": [
    // --- BEVERAGES ---
    { id: "ab1", name: "Iced Latte", price: 400, category: "Beverages", image: "/placeholder.png" },
    { id: "ab2", name: "Mint Margarita", price: 250, category: "Beverages", image: "/placeholder.png" },

    // --- SHAKES ---
    { id: "shk1", name: "Banana Shake", price: 250, category: "Shakes", image: "/placeholder.png" },
    { id: "shk2", name: "Oreo Shake", price: 300, category: "Shakes", image: "/placeholder.png" },
    { id: "shk3", name: "Pineapple Shake", price: 300, category: "Shakes", image: "/placeholder.png" },
    { id: "shk4", name: "Strawberry Shake", price: 300, category: "Shakes", image: "/placeholder.png" },
    { id: "shk5", name: "Mango Shake", price: 300, category: "Shakes", image: "/placeholder.png" },
    { id: "shk6", name: "Date Shake", price: 300, category: "Shakes", image: "/placeholder.png" },
    { id: "shk7", name: "Cold Coffee", price: 300, category: "Shakes", image: "/placeholder.png" },

    // --- HOT DRINKS ---
    { id: "hot1", name: "Chai", price: 200, category: "Hot", image: "/placeholder.png" },
    { id: "hot2", name: "Hot Coffee", price: 200, category: "Hot", image: "/placeholder.png" },
    { id: "hot3", name: "Kashmiri Chai", price: 200, category: "Hot", image: "/placeholder.png" },

    // --- JUICES ---
    { id: "jc1", name: "Fresh Orange Juice", price: 300, category: "Juices", image: "/placeholder.png" },
    { id: "jc2", name: "Mango Tang", price: 150, category: "Juices", image: "/placeholder.png" },
    { id: "jc3", name: "Pineapple Tang", price: 150, category: "Juices", image: "/placeholder.png" },
    { id: "jc4", name: "Orange Tang", price: 150, category: "Juices", image: "/placeholder.png" },
    { id: "jc5", name: "Lemon Tang", price: 150, category: "Juices", image: "/placeholder.png" },
  ],

  "cafe": [
    // --- MAIN COURSE ---
    { id: "mn1", name: "Chicken Biryani", price: 240, category: "Main Course", image: "/placeholder.png" },
    { id: "mn2", name: "Chicken Karahi", price: 240, category: "Main Course", image: "/placeholder.png" },
    { id: "mn3", name: "Chicken White Kurma", price: 240, category: "Main Course", image: "/placeholder.png" },
    { id: "mn4", name: "Chicken Handi", price: 240, category: "Main Course", image: "/placeholder.png" },
    { id: "mn5", name: "Aloo Anda Mix", price: 150, category: "Main Course", image: "/placeholder.png" },
    { id: "mn6", name: "Chicken Tikka", price: 240, category: "Main Course", image: "/placeholder.png" },
    { id: "mn7", name: "Lobia", price: 80, category: "Main Course", image: "/placeholder.png" },

    // --- SIDES ---
    { id: "sd1", name: "Fresh Raita", price: 60, category: "Sides", image: "/placeholder.png" },

    // --- SNACKS ---
    { id: "snk1", name: "Nuggets", price: 30, category: "Snacks", image: "/placeholder.png" },
    { id: "snk2", name: "Small Samosa", price: 25, category: "Snacks", image: "/placeholder.png" },

    // --- HOT DRINKS ---
    { id: "hot1", name: "Chai", price: 70, category: "Hot Drinks", image: "/placeholder.png" },

    // --- COLD DRINKS ---
    { id: "cd1", name: "7up Tin", price: 110, category: "Cold Drinks", image: "/placeholder.png" },
    { id: "cd2", name: "Pepsi Tin", price: 110, category: "Cold Drinks", image: "/placeholder.png" },
    { id: "cd3", name: "Sting Small", price: 90, category: "Cold Drinks", image: "/placeholder.png" },
    { id: "cd4", name: "7up (225ml)", price: 80, category: "Cold Drinks", image: "/placeholder.png" },
    { id: "cd5", name: "Pepsi (225ml)", price: 80, category: "Cold Drinks", image: "/placeholder.png" },
    { id: "cd6", name: "Juice", price: 110, category: "Cold Drinks", image: "/placeholder.png" },
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