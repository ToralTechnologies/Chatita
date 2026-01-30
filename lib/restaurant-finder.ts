// Restaurant finder with $0 mode (simulated data) and optional Google Places integration

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating?: number;
  distance?: string;
  address?: string;
  diabetesFriendly: boolean;
  recommendations: string[];
  healthTips: string[];
  hasDish?: string; // The specific dish they serve (if searched by dish)
}

interface Location {
  lat: number;
  lng: number;
}

interface SearchParams {
  location: Location;
  dish?: string; // Optional dish to search for
}

// Diabetes-friendly cuisine types
const diabetesFriendlyCuisines = [
  'Mediterranean',
  'Japanese',
  'Greek',
  'Vietnamese',
  'Thai',
  'Indian',
  'Mexican',
  'American',
  'Italian',
  'Chinese',
];

// Dish-to-cuisine mapping (for dish search)
const dishToCuisineMap: Record<string, { cuisines: string[]; dishName: string; diabetesTips: string[] }> = {
  // Proteins (ADA Best Choices: fish, chicken without skin, lean meats)
  'grilled chicken': {
    cuisines: ['American', 'Mediterranean', 'Greek', 'Mexican', 'Indian'],
    dishName: 'Grilled chicken breast',
    diabetesTips: [
      'Ask for grilled not fried (ADA recommendation)',
      'Request no skin - removes extra fat',
      'Pair with non-starchy vegetables',
      'Avoid marinades with sugar',
    ],
  },
  'salmon': {
    cuisines: ['American', 'Japanese', 'Mediterranean', 'Italian'],
    dishName: 'Grilled or baked salmon',
    diabetesTips: [
      'Omega-3 fatty acids are heart-healthy (ADA approved)',
      'One of the best fish choices for diabetes',
      'Ask for lemon instead of sweet glaze',
      'Pair with vegetables',
    ],
  },
  'grilled fish': {
    cuisines: ['Mediterranean', 'Greek', 'Japanese', 'American', 'Mexican'],
    dishName: 'Grilled fish',
    diabetesTips: [
      'Lean protein - ADA best choice',
      'Choose grilled, baked, or steamed',
      'Ask for vegetables instead of rice',
      'Good source of omega-3',
    ],
  },
  'shrimp': {
    cuisines: ['Mexican', 'Italian', 'American', 'Chinese', 'Thai', 'Vietnamese'],
    dishName: 'Grilled or steamed shrimp',
    diabetesTips: [
      'Low in calories and fat',
      'Avoid breaded or fried preparations',
      'Ask for sauce on the side',
      'Great lean protein choice',
    ],
  },
  'steak': {
    cuisines: ['American', 'Mexican', 'Italian'],
    dishName: 'Grilled steak',
    diabetesTips: [
      'Choose lean cuts: sirloin, tenderloin, round (ADA approved)',
      'Keep portion to 3-4 oz (size of deck of cards)',
      'Trim visible fat',
      'Pair with non-starchy vegetables',
    ],
  },

  // Salads (ADA Best Choice: vegetables with lean protein)
  'salad': {
    cuisines: ['American', 'Mediterranean', 'Greek', 'Italian', 'Mexican'],
    dishName: 'Fresh salad with grilled protein',
    diabetesTips: [
      'Ask for lowfat or vinaigrette dressing (ADA tip)',
      'Always get dressing on the side - use less than half',
      'Dip fork in dressing, then pick up food',
      'Add grilled chicken, fish, or beans for protein',
      'Skip cheese and bacon or use sparingly',
    ],
  },
  'greek salad': {
    cuisines: ['Greek', 'Mediterranean'],
    dishName: 'Greek salad',
    diabetesTips: [
      'Rich in non-starchy vegetables (ADA approved)',
      'Olive oil is a good fat',
      'Feta cheese in moderation',
      'Add grilled chicken or fish',
    ],
  },
  'caesar salad': {
    cuisines: ['American', 'Italian'],
    dishName: 'Caesar salad with grilled chicken',
    diabetesTips: [
      'Ask for grilled chicken not fried',
      'Skip croutons or limit to a few',
      'Dressing on the side - use sparingly',
      'Avoid if it has pasta salad',
    ],
  },

  // Soups
  'soup': {
    cuisines: ['American', 'Vietnamese', 'Chinese', 'Mexican', 'Italian'],
    dishName: 'Broth-based soup',
    diabetesTips: ['Choose broth-based over cream-based', 'Watch sodium content', 'Great for portion control'],
  },
  'miso soup': {
    cuisines: ['Japanese'],
    dishName: 'Miso soup',
    diabetesTips: ['Low calorie', 'Good for digestion', 'Watch sodium'],
  },
  'pho': {
    cuisines: ['Vietnamese'],
    dishName: 'Pho with lean protein',
    diabetesTips: ['Ask for less noodles, extra vegetables', 'Choose lean protein', 'Use broth sparingly'],
  },

  // Mexican (ADA Fast Food Tips adapted)
  'tacos': {
    cuisines: ['Mexican'],
    dishName: 'Grilled protein tacos',
    diabetesTips: [
      'Choose corn tortillas - limit to 1-2 maximum',
      'Ask for grilled chicken, fish, or lean steak',
      'Load up on lettuce, tomato, and vegetables',
      'Skip rice/beans or limit to 1/4 cup',
      'Use salsa instead of sour cream',
    ],
  },
  'fajitas': {
    cuisines: ['Mexican'],
    dishName: 'Chicken or steak fajitas',
    diabetesTips: [
      'Limit tortillas to 1 small one (ADA guideline)',
      'Focus on grilled vegetables and protein',
      'Skip sour cream and cheese or use tiny amounts',
      'Use salsa, pico de gallo, or hot sauce',
    ],
  },
  'burrito bowl': {
    cuisines: ['Mexican'],
    dishName: 'Burrito bowl (skip the tortilla)',
    diabetesTips: [
      'Skip the tortilla to save carbs',
      'Ask for no rice or limit to 1/4 cup',
      'Black beans are better than refried',
      'Double the fajita vegetables',
      'Add guacamole (good fat)',
    ],
  },

  // Asian
  'sushi': {
    cuisines: ['Japanese'],
    dishName: 'Sashimi or nigiri',
    diabetesTips: ['Choose sashimi (no rice) when possible', 'Limit rolls to 1-2 pieces', 'Avoid tempura rolls'],
  },
  'sashimi': {
    cuisines: ['Japanese'],
    dishName: 'Fresh sashimi',
    diabetesTips: ['Excellent lean protein', 'No rice means lower carbs', 'Pair with edamame'],
  },
  'stir fry': {
    cuisines: ['Chinese', 'Thai', 'Vietnamese'],
    dishName: 'Vegetable stir fry with protein',
    diabetesTips: ['Ask for less oil and sauce', 'Skip rice or limit to 1/3 cup', 'Choose steamed over fried'],
  },
  'curry': {
    cuisines: ['Thai', 'Indian'],
    dishName: 'Protein curry with vegetables',
    diabetesTips: ['Choose coconut milk-based in moderation', 'Skip naan or limit to 1/2 piece', 'Pair with salad instead of rice'],
  },

  // Italian
  'chicken parmesan': {
    cuisines: ['Italian', 'American'],
    dishName: 'Grilled chicken parmesan',
    diabetesTips: ['Ask for grilled not breaded', 'Replace pasta with vegetables', 'Go light on cheese'],
  },
  'pasta': {
    cuisines: ['Italian', 'American'],
    dishName: 'Whole wheat pasta with protein',
    diabetesTips: ['Limit to 1/2 cup cooked', 'Choose tomato-based sauce over cream', 'Add grilled chicken or shrimp'],
  },

  // Breakfast/Brunch (ADA Best Choices: eggs, lean protein)
  'eggs': {
    cuisines: ['American', 'Mexican', 'Greek'],
    dishName: 'Eggs (any style)',
    diabetesTips: [
      'Excellent lean protein (ADA approved)',
      'Pair with non-starchy vegetables',
      'Skip toast or choose whole wheat (1 slice max)',
      'Avoid fried - choose scrambled, poached, or boiled',
    ],
  },
  'omelet': {
    cuisines: ['American', 'Greek', 'Mediterranean'],
    dishName: 'Vegetable omelet',
    diabetesTips: [
      'Load with vegetables: peppers, onions, mushrooms, spinach',
      'Egg whites OK or use whole eggs',
      'Skip cheese or use minimal amount',
      'Great protein choice',
    ],
  },
  'avocado toast': {
    cuisines: ['American', 'Mediterranean'],
    dishName: 'Avocado toast with egg',
    diabetesTips: [
      'Choose whole grain bread',
      'Limit to 1 slice (watch carbs)',
      'Avocado is a good fat (ADA approved)',
      'Add egg for protein',
    ],
  },

  // Vegetables (ADA Best Choice: non-starchy vegetables)
  'grilled vegetables': {
    cuisines: ['Mediterranean', 'Italian', 'American', 'Greek'],
    dishName: 'Grilled seasonal vegetables',
    diabetesTips: [
      'Non-starchy vegetables are ADA best choices',
      'Eat freely - broccoli, peppers, asparagus, zucchini',
      'Ask for olive oil on the side (good fat)',
      'Excellent side dish replacement for fries',
    ],
  },
  'steamed vegetables': {
    cuisines: ['Chinese', 'Japanese', 'American', 'Vietnamese'],
    dishName: 'Steamed vegetables',
    diabetesTips: [
      'Low calorie, high fiber (ADA approved)',
      'Ask for sauce on the side',
      'Pair with lean protein (fish, chicken, tofu)',
      'Much better choice than fried options',
    ],
  },
};

// Function to find cuisines that serve a specific dish
function findCuisinesForDish(dishQuery: string): { cuisines: string[]; dishName: string; diabetesTips: string[] } | null {
  const query = dishQuery.toLowerCase().trim();

  // Direct match
  if (dishToCuisineMap[query]) {
    return dishToCuisineMap[query];
  }

  // Partial match (search for dishes containing the query)
  for (const [dish, info] of Object.entries(dishToCuisineMap)) {
    if (dish.includes(query) || query.includes(dish)) {
      return info;
    }
  }

  return null;
}

// ADA-aligned meal recommendations by cuisine type
const mealRecommendationsByCuisine: Record<string, string[]> = {
  Mediterranean: [
    'Grilled fish with vegetables (ADA best choice)',
    'Greek salad with grilled chicken, dressing on side',
    'Lentil soup (plant-based protein) with side salad',
  ],
  Japanese: [
    'Sashimi platter (lean protein, no rice)',
    'Grilled salmon with steamed vegetables (skip rice)',
    'Chicken yakitori with edamame (skip sauce)',
  ],
  Greek: [
    'Grilled chicken or fish with Greek salad',
    'Souvlaki skewers with tzatziki and vegetables',
    'Grilled octopus with vegetables (lean protein)',
  ],
  Vietnamese: [
    'Pho: ask for less noodles, extra vegetables',
    'Grilled lemongrass chicken with side salad',
    'Fresh spring rolls (not fried)',
  ],
  Thai: [
    'Tom yum soup with shrimp (no noodles)',
    'Grilled chicken satay with cucumber salad',
    'Stir-fried vegetables with lean protein',
  ],
  Indian: [
    'Tandoori chicken (grilled, no breading)',
    'Chana masala with side salad (skip rice/naan)',
    'Grilled fish tikka with vegetables',
  ],
  Mexican: [
    'Grilled chicken or steak with fajita vegetables',
    'Fish tacos: 1-2 corn tortillas or lettuce wraps',
    'Burrito bowl (no tortilla, light on rice/beans)',
  ],
  American: [
    'Grilled chicken breast, no skin, with vegetables',
    'Salmon with asparagus (omega-3 fatty acids)',
    'Small burger: no bun or whole wheat, side salad',
  ],
  Italian: [
    'Grilled chicken or fish with marinara and vegetables',
    'Caprese salad with added lean protein',
    'Minestrone soup (skip pasta inside)',
  ],
  Chinese: [
    'Steamed fish with ginger (not fried)',
    'Stir-fried vegetables with chicken (sauce on side)',
    'Steamed dumplings (limit 3-4) with vegetables',
  ],
};

// ADA-based health tips for dining out
const getHealthTips = (cuisine: string): string[] => {
  // Core tips based on ADA Fast Food Guidelines
  const commonTips = [
    'Order the smallest size available',
    'Ask for sauces and dressings on the side',
    'Choose grilled, baked, or steamed over fried',
    'Drink water or sugar-free beverages only',
    'Add extra vegetables when possible',
  ];

  const cuisineSpecificTips: Record<string, string[]> = {
    Mediterranean: [
      'Olive oil is a good fat (ADA-approved)',
      'Ask for whole wheat pita if available',
      'Focus on fish and lean proteins',
    ],
    Japanese: [
      'Avoid tempura (fried) - choose grilled',
      'Brown rice is better than white if available',
      'Sashimi is excellent (lean protein, no carbs)',
    ],
    Mexican: [
      'Limit tortillas to 1-2 small corn tortillas',
      'Skip chips or split a small portion',
      'Ask for no beans or limit to 1/4 cup',
      'Load up on fajita vegetables',
    ],
    American: [
      'Choose smallest burger size',
      'Remove bun or scoop out extra bread',
      'Skip cheese, bacon, and mayo',
      'Use mustard, salsa, or ketchup instead',
    ],
    Italian: [
      'Limit pasta to 1/2 cup if having any',
      'Ask for zucchini noodles if available',
      'Choose marinara over cream-based sauces',
      'Focus on grilled protein and vegetables',
    ],
    Chinese: [
      'Ask for steamed instead of fried',
      'Request light sauce on the side',
      'Skip or limit rice to 1/3 cup',
    ],
    Thai: [
      'Ask for less sugar in sauces',
      'Choose stir-fried over fried',
      'Coconut milk in moderation',
    ],
    Indian: [
      'Avoid naan or limit to 1/2 piece',
      'Choose tandoori (grilled) over curry',
      'Skip rice or limit to 1/3 cup',
    ],
    Greek: [
      'Greek yogurt is a great choice',
      'Feta cheese in moderation',
      'Load up on Greek salad vegetables',
    ],
    Vietnamese: [
      'Pho: ask for less noodles, extra vegetables',
      'Choose grilled (not fried) spring rolls',
      'Use broth sparingly (high sodium)',
    ],
  };

  return [...commonTips, ...(cuisineSpecificTips[cuisine] || [])];
};

// $0 Mode: Simulated nearby restaurants
function getSimulatedRestaurants(lat: number, lng: number, dishQuery?: string): Restaurant[] {
  let cuisineTypes = diabetesFriendlyCuisines;
  let dishInfo: { cuisines: string[]; dishName: string; diabetesTips: string[] } | null = null;

  // If searching for a specific dish, filter cuisines
  if (dishQuery) {
    dishInfo = findCuisinesForDish(dishQuery);
    if (dishInfo) {
      cuisineTypes = dishInfo.cuisines;
    } else {
      // No match found, return empty
      return [];
    }
  }

  const restaurants: Restaurant[] = [];

  // Generate 5-8 simulated restaurants (or fewer if specific cuisines)
  const count = dishQuery
    ? Math.min(Math.floor(Math.random() * 3) + 3, cuisineTypes.length) // 3-5 restaurants for dish search
    : Math.floor(Math.random() * 4) + 5; // 5-8 for general search

  for (let i = 0; i < count; i++) {
    const cuisine = cuisineTypes[Math.floor(Math.random() * cuisineTypes.length)];
    const rating = (Math.random() * 1.5 + 3.5).toFixed(1); // 3.5-5.0
    const distance = (Math.random() * 2 + 0.1).toFixed(1); // 0.1-2.1 miles

    const restaurant: Restaurant = {
      id: `simulated-${i}`,
      name: `${cuisine} ${['Bistro', 'Kitchen', 'Grill', 'Cafe', 'House'][Math.floor(Math.random() * 5)]}`,
      cuisine,
      rating: parseFloat(rating),
      distance: `${distance} mi`,
      address: `${Math.floor(Math.random() * 9000) + 1000} Main St`,
      diabetesFriendly: true,
      recommendations: mealRecommendationsByCuisine[cuisine] || [
        'Grilled protein with vegetables',
        'Salad with lean protein',
        'Soup and side salad',
      ],
      healthTips: getHealthTips(cuisine),
    };

    // If searching for a dish, add dish-specific info
    if (dishInfo) {
      restaurant.hasDish = dishInfo.dishName;
      // Replace first recommendation with the searched dish
      restaurant.recommendations = [
        dishInfo.dishName,
        ...restaurant.recommendations.slice(0, 2),
      ];
      // Add dish-specific tips
      restaurant.healthTips = [...dishInfo.diabetesTips, ...restaurant.healthTips.slice(0, 3)];
    }

    restaurants.push(restaurant);
  }

  // Sort by distance
  restaurants.sort((a, b) => {
    const distA = parseFloat(a.distance || '0');
    const distB = parseFloat(b.distance || '0');
    return distA - distB;
  });

  return restaurants;
}

// Get location name (reverse geocoding fallback)
async function getLocationName(lat: number, lng: number): Promise<string> {
  try {
    // Try Google Geocoding API if available
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      const data = await response.json();
      if (data.results?.[0]?.formatted_address) {
        // Extract city and state
        const addressComponents = data.results[0].address_components;
        const city = addressComponents.find((c: any) => c.types.includes('locality'))?.long_name;
        const state = addressComponents.find((c: any) => c.types.includes('administrative_area_level_1'))?.short_name;
        return city && state ? `${city}, ${state}` : 'your location';
      }
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }

  return 'your location';
}

// Google Places API Mode (optional)
async function getRestaurantsFromGoogle(lat: number, lng: number): Promise<Restaurant[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  try {
    // Use Google Places API Nearby Search
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=3200&type=restaurant&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    const restaurants: Restaurant[] = data.results.slice(0, 10).map((place: any) => {
      // Determine cuisine type from place types or name
      let cuisine = 'Restaurant';
      const placeTypes = place.types || [];
      const name = place.name.toLowerCase();

      for (const type of diabetesFriendlyCuisines) {
        if (placeTypes.includes(type.toLowerCase()) || name.includes(type.toLowerCase())) {
          cuisine = type;
          break;
        }
      }

      // If still generic, try to infer from Google place types
      if (cuisine === 'Restaurant') {
        if (placeTypes.includes('italian_restaurant')) cuisine = 'Italian';
        else if (placeTypes.includes('mexican_restaurant')) cuisine = 'Mexican';
        else if (placeTypes.includes('chinese_restaurant')) cuisine = 'Chinese';
        else if (placeTypes.includes('japanese_restaurant')) cuisine = 'Japanese';
        else if (placeTypes.includes('american_restaurant')) cuisine = 'American';
      }

      return {
        id: place.place_id,
        name: place.name,
        cuisine,
        rating: place.rating,
        address: place.vicinity,
        diabetesFriendly: true,
        recommendations: mealRecommendationsByCuisine[cuisine] || [
          'Grilled lean protein (chicken, fish, turkey)',
          'Large salad with protein and vinaigrette dressing',
          'Vegetable-based soup with a side salad',
        ],
        healthTips: getHealthTips(cuisine),
      };
    });

    return restaurants;
  } catch (error) {
    console.error('Google Places API error:', error);
    throw error;
  }
}

// Main function
export async function findNearbyRestaurants(params: SearchParams): Promise<{
  restaurants: Restaurant[];
  locationName: string;
  mode: '$0' | 'google';
  searchedDish?: string;
}> {
  const { location, dish } = params;
  const { lat, lng } = location;
  const useGoogleAPI = process.env.ENABLE_GOOGLE_PLACES === 'true';

  let restaurants: Restaurant[];
  let mode: '$0' | 'google';

  if (useGoogleAPI && !dish) {
    // Google Places API doesn't support dish search in $0 mode, so only use for general search
    try {
      restaurants = await getRestaurantsFromGoogle(lat, lng);
      mode = 'google';
    } catch (error) {
      console.log('Google Places API failed, falling back to $0 mode');
      restaurants = getSimulatedRestaurants(lat, lng, dish);
      mode = '$0';
    }
  } else {
    restaurants = getSimulatedRestaurants(lat, lng, dish);
    mode = '$0';
  }

  const locationName = await getLocationName(lat, lng);

  return {
    restaurants,
    locationName,
    mode,
    searchedDish: dish,
  };
}
