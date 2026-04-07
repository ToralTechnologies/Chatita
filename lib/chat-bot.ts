import { UserContext } from '@/types';

interface ChatResponse {
  message: string;
  suggestions?: string[];
}

export function getChatResponse(userMessage: string, context?: UserContext): ChatResponse {
  const message = userMessage.toLowerCase().trim();

  // --- BLOOD SUGAR (urgent — always check first) ---
  if (message.includes('low') && (message.includes('blood') || message.includes('sugar') || message.includes('glucose') || message === 'still feeling low')) {
    return {
      message: "Low blood sugar needs quick attention! ⚠️\n\nHave 15g of fast-acting carbs:\n• 4 glucose tablets\n• 1/2 cup juice\n• 1 tablespoon honey\n\nThen recheck in 15 minutes. If still low, repeat. Once stable, have a balanced snack.\n\nAre you feeling okay?",
      suggestions: ["Yes, I'm okay", 'Still feeling low', 'What snack after?'],
    };
  }

  if (message === 'still feeling low') {
    return {
      message: "Let's get that blood sugar up right away. 💙\n\nTry another 15g of fast-acting carbs and recheck in 15 minutes. If it's still not coming up, please contact your doctor or go to urgent care.\n\nHow are you feeling now?",
      suggestions: ["I'm feeling better", 'Still not great', 'I need help'],
    };
  }

  if (message.includes('high') || message.includes('spike')) {
    return {
      message: "I see your blood sugar is high, dear. Don't worry, it happens. 💙\n\nHere's what you can do:\n• Drink water\n• Go for a short walk if you can\n• Choose low-carb options for your next meal\n• Avoid added sugars right now\n\nRemember to check with your doctor about persistent highs.",
      suggestions: ['What should I eat next?', 'Thank you', "I'll go for a walk"],
    };
  }

  // --- SPECIFIC INGREDIENT / FOOD responses (follow-ups from suggestion chips) ---
  if (message.includes('i have chicken') || message === 'chicken') {
    return {
      message: "Great choice! Chicken is perfect. 🍗 Here are some quick ideas:\n\n• Grilled chicken strips with roasted veggies (15 min)\n• Chicken stir-fry with broccoli and bell peppers\n• Chicken salad with avocado and greens\n• Baked chicken thighs with sweet potato\n\nDo you have any vegetables on hand too?",
      suggestions: ['I have vegetables', 'I have broccoli', 'Just the chicken', 'Something else'],
    };
  }

  if (message.includes('i have fish') || message === 'fish') {
    return {
      message: "Fish is amazing for blood sugar! 🐟\n\n• Pan-seared salmon with asparagus (12 min)\n• Fish tacos in lettuce wraps\n• Baked cod with lemon and steamed veggies\n• Tuna salad with cucumber\n\nWhat veggies do you have to go with it?",
      suggestions: ['I have vegetables', 'Keep it simple', 'Something else'],
    };
  }

  if (message.includes('i have vegetable') || message === 'i have vegetables' || message.includes('vegetarian')) {
    return {
      message: "Veggies are your best friend! 🥦\n\nHere are some quick veggie meals:\n• Veggie stir-fry with tofu or eggs\n• Roasted veggie bowl with quinoa\n• Vegetable soup (great and warming)\n• Stuffed bell peppers with beans and cheese\n\nWhat veggies do you have specifically?",
      suggestions: ['Broccoli and carrots', 'Bell peppers', 'Mixed salad greens', 'Something else'],
    };
  }

  if (message.includes('i have broccoli') || message === 'broccoli and carrots') {
    return {
      message: "Perfect combo! 🥕🥦 Try this quick meal:\n\n**Cheesy Veggie Stir-Fry (15 min)**\n• Chop broccoli and carrots\n• Sauté in a little olive oil\n• Add garlic and soy sauce\n• Top with shredded cheese or an egg\n\nAbout 15g carbs — very blood sugar friendly!\n\nWould you like to save this as a meal?",
      suggestions: ['Yes, save it', 'Another idea please', 'Thank you'],
    };
  }

  if (message === 'bell peppers') {
    return {
      message: "Bell peppers are so versatile! 🫑\n\n• Stuffed peppers with ground turkey and beans\n• Fajita-style strips with onion (great with chicken too)\n• Raw with hummus as a snack\n• Roasted peppers in an omelet\n\nAny of these sound good?",
      suggestions: ['Stuffed peppers', 'Fajita strips', 'Something else'],
    };
  }

  // --- AT HOME / QUICK MEAL flow ---
  if (message.includes('at home') && (message.includes('quick') || message.includes('fast'))) {
    return {
      message: "Perfect! Quick home meals are my specialty. 🏠⏰\n\nLet's figure out what to make. What do you have in the fridge?\n\n• Protein (chicken, eggs, tofu, fish)?\n• Veggies (broccoli, peppers, spinach)?\n• Grains (rice, pasta, tortillas)?",
      suggestions: ['I have chicken', 'I have eggs', 'I have vegetables', 'Not sure, surprise me'],
    };
  }

  if (message === 'not sure, surprise me' || message === 'surprise me') {
    return {
      message: "Okay, let's go with a crowd-pleaser! 🌮\n\n**Quick Chicken Lettuce Wraps (12 min)**\n• Cook ground chicken with garlic and ginger\n• Serve in butter lettuce leaves\n• Top with cucumber, carrots, and a little soy sauce\n• Add avocado if you have it\n\nSuper low carb, high protein, and delicious!\n\nWant to save this as a meal?",
      suggestions: ['Yes, save it', 'Another idea', 'Thank you'],
    };
  }

  // --- EGGS specific ---
  if (message.includes('i have eggs') || message === 'eggs') {
    return {
      message: "Eggs are a diabetes superstar! 🥚\n\nSuper quick options:\n• Scrambled eggs with spinach and cheese (5 min)\n• Fried egg over avocado toast (whole grain, 8 min)\n• Egg muffin cups — make ahead for the week\n• Omelet with whatever veggies you have\n\nWhat sounds good?",
      suggestions: ['Scrambled eggs', 'Omelet', 'Something else'],
    };
  }

  if (message === 'scrambled eggs') {
    return {
      message: "Simple and perfect! 🥚\n\n**Cheesy Spinach Scramble (5 min)**\n1. Whisk 2-3 eggs\n2. Cook on medium-low heat\n3. Add a handful of spinach\n4. Top with shredded cheese\n5. Season with salt and pepper\n\nAbout 1-2g carbs — basically zero impact on blood sugar!\n\nAnything else I can help with?",
      suggestions: ['Save this meal', 'What else can I eat?', 'Thank you'],
    };
  }

  // --- RESTAURANT flow ---
  if (message.includes('restaurant') || message.includes('eating out') || message.includes('menu') || message === 'find a restaurant') {
    return {
      message: "Going out to eat? That's okay! 🍽️\n\nHere are Chatita's tips:\n• Look for grilled, baked, or steamed dishes\n• Ask for vegetables instead of fries or rice\n• Request sauces and dressings on the side\n\nWhat type of restaurant are you going to?",
      suggestions: ['Mexican', 'Italian', 'Asian', 'American'],
    };
  }

  if (message === 'mexican') {
    return {
      message: "¡Delicioso! Mexican food can be very diabetes-friendly. 🌮\n\nBest choices:\n• Chicken or fish tacos in corn tortillas (limit to 2)\n• Grilled chicken with black beans and salsa\n• Guacamole with baked chips (portion it!)\n• Ceviche — fresh and low-carb\n\nAvoid: rice bowls, cheesy nachos, and sugary margaritas.\n\nWould you like to save your order?",
      suggestions: ['Save my order', 'More tips', 'Thank you'],
    };
  }

  if (message === 'italian') {
    return {
      message: "Italian can be tricky but doable! 🍝\n\nGood picks:\n• Grilled chicken or fish with vegetables\n• Small portion of pasta with protein and olive oil\n• Bruschetta (watch the bread portion)\n• Caprese salad\n\nAvoid: creamy alfredo sauces, garlic bread, and big pasta portions.\n\nAnything else?",
      suggestions: ['Save my order', 'More tips', 'Thank you'],
    };
  }

  if (message === 'asian') {
    return {
      message: "Asian food has some great options! 🥢\n\n• Stir-fry with lots of veggies and protein\n• Sushi — sashimi or rolls with less rice\n• Vietnamese pho (broth-based, filling)\n• Edamame as a starter\n\nWatch out for: sweet sauces, fried rice, and tempura.\n\nWant more help?",
      suggestions: ['Save my order', 'More tips', 'Thank you'],
    };
  }

  if (message === 'american') {
    return {
      message: "American restaurants — just need a few swaps! 🍔\n\n• Grilled chicken or burger (skip the bun or use lettuce wrap)\n• Salad with grilled protein (dressing on the side)\n• Grilled salmon with veggies\n• Turkey wrap in a tortilla\n\nAvoid: fried foods, heavy sauces, and large portions of fries.\n\nNeed anything else?",
      suggestions: ['Save my order', 'More tips', 'Thank you'],
    };
  }

  // --- MEAL TYPE flows ---
  if (message.includes('breakfast')) {
    return {
      message: "Buenos días! Let's start your day right. 🌅\n\nGood breakfast options:\n• Eggs with vegetables (scrambled, omelet)\n• Greek yogurt with berries\n• Oatmeal with nuts (small portion)\n• Avocado toast (whole grain)\n\nWhat sounds good to you?",
      suggestions: ['Eggs', 'Yogurt', 'Something quick'],
    };
  }

  if (message.includes('lunch') || message === 'at work') {
    return {
      message: "Time for lunch, dear! 🥗\n\nTry these balanced options:\n• Salad with grilled chicken or fish\n• Vegetable soup with a side of protein\n• Turkey or chicken wrap (whole wheat)\n• Grain bowl with vegetables\n\nDo you have time to prepare, or need something quick?",
      suggestions: ['I can cook', 'Need something quick', 'At work'],
    };
  }

  if (message.includes('dinner')) {
    return {
      message: "Let's make a good dinner! 🌙\n\nKeep it simple:\n• Grilled protein (chicken, fish, tofu) + vegetables\n• Stir-fry with lots of veggies\n• Soup or stew\n• Salad with protein\n\nWhat protein do you have?",
      suggestions: ['Chicken', 'Fish', 'Vegetarian options'],
    };
  }

  if (message.includes('snack') || message === 'what snack after?') {
    return {
      message: "Need a little something? Here are smart snacks: 🥜\n\n• Handful of nuts or seeds\n• Cheese with cucumber slices\n• Apple with peanut butter (small amount)\n• Hard-boiled egg\n• Vegetables with hummus\n\nWhat do you have at home?",
      suggestions: ['I have nuts', 'I have fruit', 'I have vegetables'],
    };
  }

  if (message === 'i have nuts') {
    return {
      message: "Nuts are one of the best snacks for blood sugar! 🥜\n\nA good portion is about a small handful (1/4 cup):\n• Almonds are the star — great fiber and healthy fat\n• Walnuts have omega-3s too\n• Mix with a few dark chocolate chips for a treat\n\nPair with a piece of cheese for an even more balanced snack!\n\nAnything else?",
      suggestions: ['What else can I eat?', 'Thank you', 'Tell me about blood sugar'],
    };
  }

  if (message === 'i have fruit') {
    return {
      message: "Fruit is healthy but watch the portions! 🍎\n\nBest choices for blood sugar:\n• Berries (strawberries, blueberries) — low carb\n• Apple (small) — fiber slows sugar absorption\n• Grapefruit — but check if you're on medication\n\nAlways pair fruit with a protein or healthy fat (like nuts or cheese) to slow the sugar impact.\n\nNeed anything else?",
      suggestions: ['What else can I eat?', 'Thank you', 'What should I eat?'],
    };
  }

  // --- CRAVING / SWEET / SALTY / COMFORT (from context or direct) ---
  if (message === 'something sweet') {
    return {
      message: "I totally understand the sweet craving! 🍫\n\nHere are satisfying options that won't spike your blood sugar too much:\n• A small square of dark chocolate (70%+)\n• Berries with a dollop of whipped cream\n• Greek yogurt with a little honey and granola\n• Baked apple with cinnamon\n\nEnjoy it guilt-free — one treat at a time!\n\nDoes that help?",
      suggestions: ['Yes, thank you!', 'I want something else sweet', 'What should I eat next?'],
    };
  }

  if (message === 'something salty') {
    return {
      message: "Salty cravings are so real! 🧀\n\nTry these:\n• Cheese and whole-grain crackers\n• Air-popped popcorn with a little salt\n• Olives — super satisfying and low carb\n• Cucumber slices with everything bagel seasoning\n• Nuts with a pinch of sea salt\n\nThese are all much better than chips!\n\nFeeling better?",
      suggestions: ['Yes!', 'I want something else', 'What should I eat next?'],
    };
  }

  if (message === 'comfort food') {
    return {
      message: "Nothing wrong with wanting comfort! 🥘\n\nHere are comforting meals that are still blood sugar friendly:\n• Chicken soup with lots of veggies (skip heavy noodles)\n• Baked mac and cheese (use smaller pasta, add veggies)\n• Shepherd's pie with mashed cauliflower on top\n• Warm oatmeal with nuts and berries\n\nSometimes comfort is exactly what you need. 💛\n\nWant to make any of these?",
      suggestions: ['Chicken soup', 'Something quick', 'Thank you'],
    };
  }

  if (message === 'chicken soup') {
    return {
      message: "The ultimate comfort meal! 🍲\n\n**Simple Chicken Soup (25 min)**\n1. Use leftover chicken or rotisserie chicken\n2. Sauté onion, carrots, celery\n3. Add chicken broth and the chicken\n4. Toss in spinach or kale at the end\n5. Season with salt, pepper, and thyme\n\nSkip the noodles or use zucchini noodles instead — still super comforting!\n\nWant to save this?",
      suggestions: ['Save this meal', 'Another idea', 'Thank you'],
    };
  }

  // --- ENCOURAGEMENT / EMOTIONAL ---
  if (message.includes('hard') || message.includes('difficult') || message.includes('frustrated') || message === 'i need encouragement') {
    return {
      message: "Mi querida, I know this is hard sometimes. But look at you — you're here, you're trying, and that matters so much. 💚\n\nEvery small step counts. Every meal you track, every time you check your glucose, every healthy choice — it all adds up.\n\nYou're doing better than you think. How can I help you today?",
      suggestions: ['I need meal ideas', 'Tell me more', 'Thank you'],
    };
  }

  if (message === 'tell me more') {
    return {
      message: "Living with diabetes takes real courage every single day. 💛\n\nHere's the thing — perfection isn't the goal. Balance is.\n\n• One good meal doesn't fix everything\n• One bad meal doesn't ruin everything\n• Every morning you wake up and try again is a win\n\nChatita is here to make the small decisions easier. That's all. You've got this.\n\nWhat can I help with?",
      suggestions: ['I need meal ideas', 'What should I eat?', 'Thank you'],
    };
  }

  // --- THANK YOU / GOODBYE ---
  if (message.includes('thank') || message.includes('gracias') || message === "yes, thank you!") {
    return {
      message: "De nada! I'm always here for you. 💙\n\nRemember: you're not alone in this journey. One day at a time, one meal at a time.\n\nIs there anything else I can help you with?",
      suggestions: ["No, I'm good", 'Yes, one more thing', 'See you later'],
    };
  }

  if (message === "no, i'm good" || message === 'see you later') {
    return {
      message: "Take care of yourself! 💙 Remember to stay hydrated and check in whenever you need me. ¡Hasta la próxima!",
      suggestions: [],
    };
  }

  // --- SAVE MEAL shortcut ---
  if (message === 'yes, save it' || message === 'save this meal' || message === 'save my order') {
    return {
      message: "Sure! Head over to the Add Meal page and I can help you log it. You can also use the quick-save button right there. 📝\n\nIs there anything else you need?",
      suggestions: ['What should I eat?', 'Thank you', "No, I'm good"],
    };
  }

  // --- WHAT TO EAT (general entry point) ---
  if (message.includes('what') && (message.includes('eat') || message.includes('cook') || message.includes('make')) || message === 'what should i eat?' || message === 'what should i eat next?') {
    return {
      message: "Let me help you, dear! Tell me what you have available:\n\n• Are you at home or out?\n• Do you want something quick (under 15 min) or can you cook?\n• Any ingredients you have on hand?",
      suggestions: ['At home, quick meal', 'At a restaurant', 'I have chicken', 'I have vegetables'],
    };
  }

  // --- I CAN COOK / NEED SOMETHING QUICK (from lunch suggestions) ---
  if (message === 'i can cook') {
    return {
      message: "Love that! Let's make something good. 👨‍🍳\n\nWhat meal are we making?\n• Something with protein (chicken, fish, eggs, tofu)\n• A big colorful salad\n• Soup or stew\n• A grain bowl\n\nWhat sounds appealing?",
      suggestions: ['I have chicken', 'I have fish', 'I have vegetables', 'Something else'],
    };
  }

  if (message === 'need something quick') {
    return {
      message: "Got you — under 15 minutes! ⏰\n\nQuickest options:\n• Scrambled eggs with veggies (5 min)\n• Tuna salad lettuce wraps (7 min)\n• Cheese quesadilla on whole wheat (8 min)\n• Yogurt parfait with berries and nuts (3 min)\n\nWhat do you have on hand?",
      suggestions: ['I have eggs', 'I have chicken', 'Surprise me'],
    };
  }

  // --- BLOOD SUGAR INFO ---
  if (message.includes('blood sugar') || message.includes('tell me about blood sugar') || message.includes('glucose')) {
    return {
      message: "Great question! Here's the basics: 🩸\n\n**Target range:** Usually 70-180 mg/dL (your doctor may set different targets)\n\n• **Before meals:** Aim for under 130\n• **After meals:** Try to stay under 180 (check 2 hrs after)\n• **Fasting:** 70-100 is ideal\n\n**What affects it:**\n• Carbohydrates raise it most\n• Exercise and water help lower it\n• Stress can raise it too\n\nAlways check with your doctor for your personal targets!\n\nAnything else?",
      suggestions: ['What should I eat?', 'I need encouragement', 'Thank you'],
    };
  }

  // --- YES / OK / ANOTHER IDEA (generic continuations) ---
  if (message === 'yes, please' || message === 'yes!' || message === 'ok') {
    return {
      message: "Let's do this! 💪\n\nWhat are you in the mood for?\n• Something quick (under 15 min)\n• A heartier meal\n• Just a snack\n• Something warm and comforting",
      suggestions: ['Something quick', 'A hearty meal', 'Just a snack', 'Something warm'],
    };
  }

  if (message === 'another idea' || message === 'another idea please' || message === 'i want something else' || message === 'i want something else sweet') {
    return {
      message: "Sure, let's try something different! 😊\n\nWhat are you feeling right now?\n• Sweet tooth 🍫\n• Salty craving 🧀\n• Something warm and comforting 🍲\n• A light and fresh option 🥗",
      suggestions: ['Something sweet', 'Something salty', 'Comfort food', 'Something light'],
    };
  }

  if (message === 'something light') {
    return {
      message: "Light and fresh — perfect! 🥗\n\n• Big salad with grilled chicken, avocado, and lemon dressing\n• Cucumber and tuna salad rolls\n• Greek yogurt with fresh berries\n• Gazpacho (cold tomato soup)\n\nAll super low-impact on blood sugar!\n\nSounds good?",
      suggestions: ['Yes, thank you!', 'Another idea please', 'What should I eat?'],
    };
  }

  if (message === 'something warm' || message === 'i need something warm') {
    return {
      message: "Warm and cozy, coming right up! 🍵\n\n• Chicken noodle soup (use zucchini noodles)\n• Oatmeal with nuts, seeds, and a little honey\n• Veggie curry with cauliflower rice\n• Hot chocolate made with almond milk (unsweetened)\n\nWhich one calls to you?",
      suggestions: ['Chicken soup', 'Oatmeal', 'Thank you'],
    };
  }

  if (message === 'oatmeal') {
    return {
      message: "Warm oatmeal is such a cozy choice! 🌾\n\n**Blood Sugar Friendly Oatmeal**\n• Use rolled oats (not instant — they spike less)\n• Cook with water or almond milk\n• Top with: nuts, seeds, cinnamon, and a few berries\n• A small drizzle of honey if you want sweetness\n\nKeep it to about 1/2 cup dry — that's a good portion.\n\nAnything else?",
      suggestions: ['Save this meal', 'What else can I eat?', 'Thank you'],
    };
  }

  // --- "something calm to eat" suggestion chip ---
  if (message === 'something calm to eat') {
    return {
      message: "Let's find something peaceful and nourishing for you. 🌿\n\nThese are calming, easy meals:\n• A warm bowl of miso soup\n• Greek yogurt with honey and walnuts\n• Simple grilled fish with steamed veggies\n• A gentle veggie soup\n\nNothing rushed, nothing complicated. Which sounds nice?",
      suggestions: ['Something warm', 'Something light', 'What should I eat?'],
    };
  }

  // --- CONTEXT-AWARE fallback (only when no specific topic matched above) ---
  if (context?.feelingOverwhelmed || message.includes('overwhelmed') || message.includes("don't know")) {
    return {
      message: "Ay, mi querida, I understand. Let's breathe together first. 💙\n\nTake this one step at a time. What sounds easier for you right now — something quick to make, or help finding a healthy option nearby?",
      suggestions: ['Something quick at home', 'Find a restaurant', 'I need encouragement'],
    };
  }

  if (context?.onPeriod || context?.havingCravings || message.includes('craving') || message.includes('period')) {
    return {
      message: "I hear you, sweetheart. During this time, your body needs extra care. It's okay to want comfort foods! 🩸\n\nLet's find something satisfying that also helps your blood sugar. What are you craving — something sweet, salty, or creamy?",
      suggestions: ['Something sweet', 'Something salty', 'Comfort food'],
    };
  }

  if (context?.notFeelingWell || message.includes('sick') || message.includes('not feeling')) {
    return {
      message: "Oh dear, I'm sorry you're not feeling well. 🤒 When you're sick, simple and gentle foods are best.\n\nWould you like ideas for easy-to-digest meals that won't upset your stomach?",
      suggestions: ['Yes, please', 'I need something warm', 'Just water for now'],
    };
  }

  if (message === 'just water for now') {
    return {
      message: "That's totally fine. Water is the best thing right now. 💧\n\nWhen you're ready to eat, start with something gentle like:\n• Clear broth\n• Plain crackers\n• A small banana\n• Some plain rice\n\nListen to your body. I'm here whenever you need me. 💛",
      suggestions: ['Thank you', 'What should I eat later?'],
    };
  }

  // --- MOOD-AWARE fallbacks (only fire when no topic matched and mood is set) ---
  if (context?.mood === 'anxious') {
    return {
      message: "I hear you. When you're feeling anxious, it's good to focus on one small thing at a time. 💛\n\nLet's start simple — are you hungry right now? I can suggest something easy and calming to eat, or we can just chat.",
      suggestions: ['Something calm to eat', 'I need encouragement', 'What should I eat?'],
    };
  }

  if (context?.mood === 'sad') {
    return {
      message: "I'm here for you. 💙 It's okay to have a tough day. Sometimes a warm, comforting meal can help a little bit.\n\nWould you like me to suggest something cozy to eat, or just talk?",
      suggestions: ['Comfort food', 'I need encouragement', 'What should I eat?'],
    };
  }

  if (context?.mood === 'tired') {
    return {
      message: "Sounds like you need some rest, sweetheart. 😴 Let's keep things super easy — no complicated meals today.\n\nWant me to find you something quick and simple to eat?",
      suggestions: ['Need something quick', 'Something warm', 'What should I eat?'],
    };
  }

  // --- DEFAULT (true fallback — only if absolutely nothing else matched) ---
  return {
    message: "Hello, dear! I'm Chatita, your caring diabetes companion. 💙\n\nI'm here to help you with:\n• Meal suggestions and ideas\n• Restaurant ordering tips\n• Understanding your blood sugar\n• Encouragement when you need it\n\nWhat would you like to talk about today?",
    suggestions: ['What should I eat?', 'I feel overwhelmed', 'Tell me about blood sugar', 'I need encouragement'],
  };
}
