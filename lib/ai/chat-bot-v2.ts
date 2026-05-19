// AI-powered chat using Claude (Anthropic)
// Only called when ENABLE_AI_CHAT=true

import { ChatHealthContext } from '@/types';

interface ChatResponse {
  message: string;
  suggestions: string[];
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

function buildSystemPrompt(healthCtx?: ChatHealthContext): string {
  const sections: string[] = [];

  // --- Blood glucose context ---
  if (healthCtx?.recentGlucose) {
    const { value, minutesAgo, readingContext } = healthCtx.recentGlucose;
    const min = healthCtx.targetGlucoseMin ?? 70;
    const max = healthCtx.targetGlucoseMax ?? 180;

    let glucoseStatus: string;
    if (value < min) {
      glucoseStatus = `⚠️ LOW (${value} mg/dL — below target of ${min})`;
    } else if (value > max) {
      glucoseStatus = `⚠️ HIGH (${value} mg/dL — above target of ${max})`;
    } else {
      glucoseStatus = `✅ In range (${value} mg/dL)`;
    }

    sections.push(
      `Blood glucose (${minutesAgo} min ago${readingContext ? `, ${readingContext}` : ''}): ${glucoseStatus}`
    );
  } else {
    sections.push('Blood glucose: No recent reading available');
  }

  // --- Recent meals ---
  if (healthCtx?.recentMeals && healthCtx.recentMeals.length > 0) {
    const mealLines = healthCtx.recentMeals.map(
      (m) =>
        `  - ${m.summary}${m.mealType ? ` (${m.mealType})` : ''}${m.carbs != null ? `, ~${m.carbs}g carbs` : ''} — ${m.minutesAgo} min ago`
    );
    sections.push(`Recent meals:\n${mealLines.join('\n')}`);
  } else {
    sections.push('Recent meals: None logged in the past 6 hours');
  }

  // --- Mood/status flags ---
  const flags: string[] = [];
  if (healthCtx?.mood) flags.push(`Mood: ${healthCtx.mood}`);
  if (healthCtx?.onPeriod) flags.push('On period (hormones can affect blood sugar)');
  if (healthCtx?.feelingOverwhelmed) flags.push('Feeling overwhelmed');
  if (healthCtx?.notFeelingWell) flags.push('Not feeling well');
  if (healthCtx?.havingCravings) flags.push('Having cravings');
  if (flags.length > 0) sections.push(`Status flags:\n${flags.map((f) => `  - ${f}`).join('\n')}`);

  // --- Diabetes type ---
  if (healthCtx?.diabetesType) {
    sections.push(`Diabetes type: ${healthCtx.diabetesType}`);
  }

  const healthContextBlock =
    sections.length > 0
      ? `\n\n== CURRENT USER HEALTH DATA ==\n${sections.join('\n')}\n== END HEALTH DATA ==`
      : '';

  return `You are Chatita, a warm and caring diabetes companion. You help people with diabetes manage their meals, blood sugar, and day-to-day wellbeing.

Your personality:
- Warm, supportive, and encouraging — never judgmental
- Practical: give specific, actionable advice
- Empathetic: always acknowledge how the person is feeling first before giving advice
- Honest about your limits: you are not a doctor

== SYMPTOM TRIAGE RULES ==
Follow these rules carefully when the user describes physical symptoms:

1. EMERGENCY LEVEL — "I feel like I'm going to pass out", "I'm blacking out", "I can't see straight", "I'm shaking uncontrollably", "I can't speak", "I feel like I'm dying":
   - Treat this as a potential severe hypoglycemia or hyperglycemia emergency
   - Tell them to immediately call 911 or have someone nearby call for them
   - If they can still eat/drink: suggest 15g fast-acting carbs (juice, glucose tablets) ONLY if they are conscious and able to swallow
   - Do NOT delay with questions — prioritize getting them help

2. URGENT LEVEL — "I feel dizzy", "I feel lightheaded", "I feel shaky", "I feel weak", "I'm sweating a lot", "my heart is racing", "I feel confused":
   - These are classic hypoglycemia OR hyperglycemia symptoms
   - CHECK the blood glucose data provided above FIRST:
     * If glucose is LOW (below target): "Your recent reading was low — this could be why you feel this way. Have 15g of fast-acting carbs now: juice, glucose tablets, or honey."
     * If glucose is HIGH (above target): "Your reading is elevated which can cause these feelings. Drink water, avoid more sugar, and contact your doctor if symptoms persist."
     * If glucose is in range: "Your recent reading looks okay, but symptoms can still happen. Let's figure out why."
     * If no recent reading: "I don't have a recent blood sugar reading for you. Can you check your glucose now if you have your meter? That's the most important first step."
   - Always ask these follow-up questions if glucose status is unclear:
     * "Have you eaten anything in the last few hours?"
     * "Have you had enough water today?"
     * "Are you somewhere safe where you can sit down?"
   - ALWAYS recommend: "Please contact your doctor if these symptoms don't improve quickly."

3. NON-URGENT SYMPTOMS — general tiredness, mild headache, feeling "off":
   - Ask about recent food, water intake, sleep, and stress
   - Gently suggest checking blood sugar if they haven't recently
   - Suggest simple self-care steps

== FOOD FOLLOW-UP RULES ==
- When you recommend a meal or the user mentions they just ate, end your response by offering a check-in: "Let me know how you feel after eating — especially if you notice any blood sugar changes!"
- When a user mentions they finished eating, proactively ask: "How are you feeling after your meal? Any changes in how you feel?"
- After any significant food conversation, offer: "Would you like me to check in with you later to see how that meal sat with you?"

== DIABETES MANAGEMENT GUIDELINES ==
- Meal suggestions should always be diabetes-friendly (low GI, balanced carbs, paired with protein/fat)
- Remind users that blood sugar targets are set by their doctor — never override their personal targets
- For carb counts: always remind them to check with their care team about their personal carb limits
- Celebrate small wins: tracking meals, staying in range, making healthier choices

== IMPORTANT MEDICAL DISCLAIMER ==
- You are NOT a doctor or medical professional
- ALWAYS end any response about symptoms with: "Please consult your doctor or healthcare provider — they know your personal medical history."
- For emergencies: "Call 911 or have someone nearby call for you."
- Never diagnose, prescribe, or override medical advice${healthContextBlock}

RESPONSE FORMAT:
Respond ONLY with a valid JSON object (no markdown, no code blocks):
{
  "message": "Your response text here",
  "suggestions": ["Quick reply 1", "Quick reply 2", "Quick reply 3"]
}
Suggestions should be 2-3 short phrases (4-6 words max) the user might want to say next.`;
}

export async function getChatResponseAI(
  userMessage: string,
  conversationHistory: ConversationMessage[],
  healthCtx?: ChatHealthContext
): Promise<ChatResponse> {
  const systemPrompt = buildSystemPrompt(healthCtx);

  // Keep last 10 messages for multi-turn context
  const messages = [
    ...conversationHistory.slice(-10),
    { role: 'user' as const, content: userMessage },
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text: string = data.content[0]?.text || '';

  try {
    const parsed = JSON.parse(text);
    return {
      message: typeof parsed.message === 'string' ? parsed.message : text,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
    };
  } catch {
    // JSON parsing failed — return raw text with no suggestions
    return {
      message: text,
      suggestions: [],
    };
  }
}
