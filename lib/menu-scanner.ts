import { MenuRecommendation } from '@/types';

// Rules-based menu item scoring ($0 mode)
export function analyzeMenuItem(itemName: string, description?: string): MenuRecommendation {
  const text = `${itemName} ${description || ''}`.toLowerCase();

  // Great choice keywords
  const greatKeywords = [
    'grilled', 'baked', 'steamed', 'roasted', 'broiled',
    'salad', 'vegetables', 'greens', 'leafy',
    'chicken breast', 'turkey', 'fish', 'salmon', 'tuna',
    'quinoa', 'cauliflower', 'broccoli', 'spinach',
    'lean', 'fresh', 'garden', 'green beans',
    'asparagus', 'zucchini', 'tomato', 'lettuce'
  ];

  // Caution keywords
  const cautionKeywords = [
    'fried', 'breaded', 'crispy', 'battered',
    'pasta', 'rice', 'noodles', 'bread',
    'sweet', 'sugary', 'dessert', 'cake', 'pie',
    'cream', 'creamy', 'cheese sauce', 'alfredo',
    'glazed', 'honey', 'syrup', 'candied',
    'soda', 'juice', 'milkshake'
  ];

  // Moderate keywords
  const moderateKeywords = [
    'whole grain', 'brown rice', 'wheat',
    'beans', 'legumes', 'nuts', 'seeds',
    'olive oil', 'avocado', 'cheese'
  ];

  let greatCount = 0;
  let cautionCount = 0;
  let moderateCount = 0;

  greatKeywords.forEach(keyword => {
    if (text.includes(keyword)) greatCount++;
  });

  cautionKeywords.forEach(keyword => {
    if (text.includes(keyword)) cautionCount++;
  });

  moderateKeywords.forEach(keyword => {
    if (text.includes(keyword)) moderateCount++;
  });

  // Determine score
  let score: 'great' | 'moderate' | 'caution';
  let reason: string;
  let tips: string[] = [];

  if (greatCount > cautionCount) {
    score = 'great';
    reason = 'This dish contains diabetes-friendly ingredients like lean protein and vegetables that help maintain stable blood sugar levels.';
    tips = [
      'Ask for dressing or sauce on the side',
      'Request extra vegetables if possible',
      'Drink water instead of sugary beverages'
    ];
  } else if (cautionCount > 1) {
    score = 'caution';
    reason = 'This dish may cause blood sugar spikes due to high carbs, added sugars, or fried preparation methods.';
    tips = [
      'Consider sharing this dish or saving half for later',
      'Pair with a side salad to add fiber',
      'Skip the bread or rice to reduce carbs'
    ];
  } else {
    score = 'moderate';
    reason = 'This dish is okay in moderation. Watch portion sizes and consider what else you eat during the day.';
    tips = [
      'Ask about preparation methods (grilled vs fried)',
      'Request vegetables instead of fries or rice',
      'Check if whole grain options are available'
    ];
  }

  // Estimate macros based on keywords
  let estimatedCarbs = 30;
  let estimatedCalories = 400;

  if (score === 'caution') {
    estimatedCarbs = 60;
    estimatedCalories = 700;
  } else if (score === 'great') {
    estimatedCarbs = 15;
    estimatedCalories = 300;
  }

  return {
    name: itemName,
    score,
    reason,
    tips,
    estimatedCarbs,
    estimatedCalories
  };
}

export function analyzeMenu(menuItems: string[]): MenuRecommendation[] {
  return menuItems.map(item => analyzeMenuItem(item));
}
