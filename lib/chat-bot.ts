import { UserContext } from '@/types';

interface ChatResponse {
  message: string;
  suggestions?: string[];
}

export function getChatResponse(userMessage: string, context?: UserContext): ChatResponse {
  const message = userMessage.toLowerCase();

  // Feeling overwhelmed
  if (context?.feelingOverwhelmed || message.includes('overwhelmed') || message.includes('don\'t know')) {
    return {
      message: "Ay, mi querida, I understand. Let's breathe together first. 💙\n\nTake this one step at a time. What sounds easier for you right now - something quick to make, or help finding a healthy option nearby?",
      suggestions: ['Something quick at home', 'Find a restaurant', 'I need encouragement'],
    };
  }

  // On period / cravings
  if (context?.onPeriod || context?.havingCravings || message.includes('craving') || message.includes('period')) {
    return {
      message: "I hear you, sweetheart. During this time, your body needs extra care. It's okay to want comfort foods! 🩸\n\nLet's find something satisfying that also helps your blood sugar. What are you craving - something sweet, salty, or creamy?",
      suggestions: ['Something sweet', 'Something salty', 'Comfort food'],
    };
  }

  // Not feeling well
  if (context?.notFeelingWell || message.includes('sick') || message.includes('not feeling')) {
    return {
      message: "Oh mi amor, I'm sorry you're not feeling well. 🤒 When you're sick, simple and gentle foods are best.\n\nWould you like ideas for easy-to-digest meals that won't upset your stomach?",
      suggestions: ['Yes, please', 'I need something warm', 'Just water for now'],
    };
  }

  // What to eat
  if (message.includes('what') && (message.includes('eat') || message.includes('cook') || message.includes('make'))) {
    return {
      message: "Let me help you, dear! Tell me what you have available:\n\n• Are you at home or out?\n• Do you want something quick (under 15 min) or can you cook?\n• Any ingredients you have on hand?",
      suggestions: ['At home, quick meal', 'At a restaurant', 'I have chicken', 'I have vegetables'],
    };
  }

  // Restaurant help
  if (message.includes('restaurant') || message.includes('eating out') || message.includes('menu')) {
    return {
      message: "Going out to eat? That's okay, mi amor! 🍽️\n\nHere are Chatita's tips:\n• Look for grilled, baked, or steamed dishes\n• Ask for vegetables instead of fries or rice\n• Request sauces and dressings on the side\n\nWhat type of restaurant are you going to?",
      suggestions: ['Mexican', 'Italian', 'Asian', 'American'],
    };
  }

  // Breakfast
  if (message.includes('breakfast')) {
    return {
      message: "Buenos días! Let's start your day right. 🌅\n\nGood breakfast options:\n• Eggs with vegetables (scrambled, omelet)\n• Greek yogurt with berries\n• Oatmeal with nuts (small portion)\n• Avocado toast (whole grain)\n\nWhat sounds good to you?",
      suggestions: ['Eggs', 'Yogurt', 'Something quick'],
    };
  }

  // Lunch
  if (message.includes('lunch')) {
    return {
      message: "Time for lunch, dear! 🥗\n\nTry these balanced options:\n• Salad with grilled chicken or fish\n• Vegetable soup with a side of protein\n• Turkey or chicken wrap (whole wheat)\n• Grain bowl with vegetables\n\nDo you have time to prepare, or need something quick?",
      suggestions: ['I can cook', 'Need something quick', 'At work'],
    };
  }

  // Dinner
  if (message.includes('dinner')) {
    return {
      message: "Let's make a good dinner, mi amor! 🌙\n\nKeep it simple:\n• Grilled protein (chicken, fish, tofu) + vegetables\n• Stir-fry with lots of veggies\n• Soup or stew\n• Salad with protein\n\nWhat protein do you have?",
      suggestions: ['Chicken', 'Fish', 'Vegetarian options'],
    };
  }

  // Snack
  if (message.includes('snack')) {
    return {
      message: "Need a little something? Here are smart snacks: 🥜\n\n• Handful of nuts or seeds\n• Cheese with cucumber slices\n• Apple with peanut butter (small amount)\n• Hard-boiled egg\n• Vegetables with hummus\n\nWhat do you have at home?",
      suggestions: ['I have nuts', 'I have fruit', 'I have vegetables'],
    };
  }

  // Blood sugar high
  if (message.includes('high') || message.includes('spike')) {
    return {
      message: "I see your blood sugar is high, dear. Don't worry, it happens. 💙\n\nHere's what you can do:\n• Drink water\n• Go for a short walk if you can\n• Choose low-carb options for your next meal\n• Avoid added sugars right now\n\nRemember to check with your doctor about persistent highs.",
      suggestions: ['What should I eat next?', 'Thank you', 'I\'ll go for a walk'],
    };
  }

  // Blood sugar low
  if (message.includes('low')) {
    return {
      message: "Low blood sugar needs quick attention! ⚠️\n\nHave 15g of fast-acting carbs:\n• 4 glucose tablets\n• 1/2 cup juice\n• 1 tablespoon honey\n\nThen recheck in 15 minutes. If still low, repeat. Once stable, have a balanced snack.\n\nAre you feeling okay?",
      suggestions: ['Yes, I\'m okay', 'Still feeling low', 'What snack after?'],
    };
  }

  // Encouragement
  if (message.includes('hard') || message.includes('difficult') || message.includes('frustrated')) {
    return {
      message: "Mi querida, I know this is hard sometimes. But look at you - you're here, you're trying, and that matters so much. 💚\n\nEvery small step counts. Every meal you track, every time you check your glucose, every healthyish choice - it all adds up.\n\nYou're doing better than you think. How can I help you today?",
      suggestions: ['I need meal ideas', 'Tell me more', 'Thank you'],
    };
  }

  // Thank you
  if (message.includes('thank') || message.includes('gracias')) {
    return {
      message: "De nada, mi amor! I'm always here for you. 💙\n\nRemember: you're not alone in this journey. One day at a time, one meal at a time.\n\nIs there anything else I can help you with?",
      suggestions: ['No, I\'m good', 'Yes, one more thing', 'See you later'],
    };
  }

  // Default response
  return {
    message: "Hello, dear! I'm Chatita, your caring diabetes companion. 💙\n\nI'm here to help you with:\n• Meal suggestions and ideas\n• Restaurant ordering tips\n• Understanding your blood sugar\n• Encouragement when you need it\n\nWhat would you like to talk about today?",
    suggestions: ['What should I eat?', 'I feel overwhelmed', 'Tell me about blood sugar', 'I need encouragement'],
  };
}
