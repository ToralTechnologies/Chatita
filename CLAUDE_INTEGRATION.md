# 🤖 Claude (Anthropic) AI Integration

## Overview

Chatita uses **Claude 3.5 Sonnet** from Anthropic for AI-powered features. This provides state-of-the-art vision and conversational capabilities optimized for diabetes management.

## Why Claude?

### Advantages Over Other AI Models

1. **Superior Vision Analysis**: Claude 3.5 Sonnet has excellent image understanding capabilities
2. **Better Context Awareness**: Maintains conversation context naturally
3. **Safety-Focused**: Built with Constitutional AI for helpful, harmless responses
4. **Cost-Effective**: Competitive pricing compared to alternatives
5. **Fast Response Times**: Quick analysis for real-time use
6. **Privacy-Conscious**: Anthropic's strong commitment to data privacy

### Claude vs OpenAI

| Feature | Claude 3.5 Sonnet | GPT-4 Vision |
|---------|------------------|--------------|
| Vision Quality | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Speed | Faster | Moderate |
| Cost (per 1M tokens) | $3/$15 | $5/$15 |
| Context Window | 200K tokens | 128K tokens |
| Safety Features | Constitutional AI | Moderation API |

## Features Using Claude

### 1. Meal Photo Analysis 📸

**Model**: Claude 3.5 Sonnet with Vision
**Endpoint**: `/api/analyze-meal`
**Implementation**: `lib/ai/meal-analyzer.ts`

#### What It Does:
- Analyzes uploaded meal photos
- Detects specific foods (e.g., "grilled chicken breast", "steamed broccoli")
- Estimates nutritional content:
  - Calories
  - Carbohydrates (critical for diabetes)
  - Protein, Fat, Fiber
  - Sugar, Sodium
- Provides portion size estimates
- Returns confidence score (0-100)

#### How It Works:
```typescript
// User uploads photo → base64 encoding
const analysis = await analyzeMealPhoto(photoBase64);

// Claude analyzes with ADA-focused prompt
// Returns: {
//   detectedFoods: ["grilled chicken", "broccoli", "brown rice"],
//   nutrition: { calories: 450, carbs: 35, protein: 40, ... },
//   portionSize: "1 medium plate",
//   confidence: 85
// }
```

#### Special Features:
- **ADA-Aligned Prompts**: Instructions mention American Diabetes Association guidelines
- **Conservative Estimates**: Claude trained to be cautious with nutritional guesses
- **Carb & Fiber Focus**: Emphasizes diabetes-critical nutrients
- **Graceful Fallback**: Falls back to manual mode if API fails

### 2. Chat Assistant (Future/Optional) 💬

**Model**: Claude 3.5 Sonnet (or Claude 3 Haiku for cost savings)
**Endpoint**: `/api/chat`
**Implementation**: `lib/chat-bot.ts`

#### Current Status:
- Currently uses template-based responses ($0 mode)
- Can be upgraded to Claude conversational AI

#### Upgrade Benefits:
- Natural conversations about diabetes management
- Context-aware meal suggestions
- Personalized advice based on user history
- Empathetic, grandmother-like tone (Chatita personality)

## Setup Instructions

### Prerequisites
- Anthropic API account
- API key with vision model access

### Step-by-Step Setup

#### 1. Get Anthropic API Key

```bash
# Visit Anthropic Console
https://console.anthropic.com/

# Sign up or log in
# Navigate to API Keys
# Create new key
# Copy the key (starts with sk-ant-...)
```

#### 2. Configure Environment Variables

Edit `.env`:
```bash
# Enable AI Features
ENABLE_AI_ANALYSIS=true
ENABLE_AI_CHAT=true

# Add Your Anthropic API Key
ANTHROPIC_API_KEY="[your-key-from-anthropic-console]"
```

#### 3. Restart Development Server

```bash
npm run dev
```

#### 4. Test the Integration

1. Go to http://localhost:3000/add-meal
2. Upload a meal photo
3. Watch as Claude analyzes it automatically
4. See detected foods and nutrition auto-fill

## Cost Analysis

### Claude 3.5 Sonnet Pricing (as of 2024)

**Input**: $3 per million tokens
**Output**: $15 per million tokens

### Real-World Usage Estimates

#### Meal Photo Analysis
- **Average tokens per analysis**: ~500-1000 tokens
- **Cost per photo**: ~$0.01-0.02
- **100 photos/month**: ~$1-2
- **500 photos/month**: ~$5-10

#### Chat Conversations
- **Average tokens per conversation**: ~1000-2000 tokens
- **Cost per chat**: ~$0.02-0.04
- **100 chats/month**: ~$2-4
- **500 chats/month**: ~$10-20

### Cost Optimization Tips

1. **Use Claude 3 Haiku for chat** (cheaper, still excellent)
2. **Keep prompts concise** (fewer input tokens)
3. **Limit max_tokens** (current: 1024, reasonable)
4. **Cache common prompts** (Anthropic supports prompt caching)

### Monthly Cost Estimates

| Usage Level | Photo Analysis | Chat | Total |
|-------------|----------------|------|-------|
| Light (50 photos, 50 chats) | ~$1 | ~$1 | **~$2** |
| Medium (200 photos, 200 chats) | ~$3 | ~$4 | **~$7** |
| Heavy (500 photos, 500 chats) | ~$7 | ~$10 | **~$17** |

## Technical Implementation

### Image Handling

```typescript
// Base64 image processing
const imageData = photoBase64.includes('base64,')
  ? photoBase64.split('base64,')[1]  // Extract data
  : photoBase64;

// Media type detection
let mediaType = 'image/jpeg'; // default
if (photoBase64.includes('data:image/')) {
  const match = photoBase64.match(/data:image\/(.*?);base64/);
  if (match) mediaType = `image/${match[1]}`;
}
```

### API Request Format

```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageData }},
        { type: 'text', text: 'Your prompt here...' }
      ]
    }]
  })
});
```

### Response Parsing

```typescript
const data = await response.json();
const content = data.content?.[0]?.text || '';

// Handle potential markdown code blocks
let jsonStr = content.trim();
if (jsonStr.startsWith('```json')) {
  jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
}

const result = JSON.parse(jsonStr);
```

### Error Handling

```typescript
try {
  // API call
  const response = await fetch(...)

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  // Process response...

} catch (error) {
  console.error('Claude meal analysis error:', error);

  // Graceful fallback to manual mode
  return { detectedFoods: [], nutrition: {}, mode: '$0' };
}
```

## Prompt Engineering

### Meal Analysis Prompt

Our prompt is specifically designed for diabetes management:

```
You are a nutrition expert analyzing meal photos for people with diabetes
following ADA (American Diabetes Association) guidelines.

Key Instructions:
- Be conservative with estimates
- Focus on carbs and fiber (critical for blood sugar)
- Return ONLY valid JSON
- Lower confidence if unclear
- Provide specific food names
```

### Why This Works:
1. **Role Definition**: Sets expert context
2. **Audience Specification**: Tailors to diabetes needs
3. **ADA Reference**: Ensures medical accuracy
4. **Conservative Approach**: Prioritizes safety
5. **Structured Output**: Ensures parseable responses

## Best Practices

### 1. Always Have Fallback Mode
```typescript
if (!aiEnabled || error) {
  return { mode: '$0', ... }; // Manual entry
}
```

### 2. Validate Claude Responses
```typescript
const result = JSON.parse(jsonStr);
return {
  detectedFoods: result.detectedFoods || [],  // Default to empty
  nutrition: result.nutrition || {},
  confidence: result.confidence || 0,
};
```

### 3. Handle Image Formats Properly
- Support JPEG, PNG, WebP
- Extract base64 correctly
- Detect media type automatically

### 4. Set Reasonable Token Limits
```typescript
max_tokens: 1024  // Enough for detailed analysis, not wasteful
```

### 5. Log Errors (Not API Keys!)
```typescript
console.error('Claude meal analysis error:', error);  // Safe
// DON'T: console.log(process.env.ANTHROPIC_API_KEY)  // NEVER
```

## Security Considerations

### API Key Protection
- ✅ Store in environment variables
- ✅ Never commit to git (.env in .gitignore)
- ✅ Use server-side only (API routes)
- ✅ Rotate keys periodically

### User Data Privacy
- 🔒 Photos analyzed then discarded (Claude doesn't store)
- 🔒 No identifiable information sent to API
- 🔒 Nutrition data stays in user's database
- 🔒 HTTPS-only communication

## Monitoring & Debugging

### Check if AI is Working

```bash
# Check API key is set
echo $ANTHROPIC_API_KEY

# Check feature flag
grep ENABLE_AI_ANALYSIS .env

# Test the endpoint
curl -X POST http://localhost:3000/api/analyze-meal \
  -H "Content-Type: application/json" \
  -d '{"photoBase64": "data:image/jpeg;base64,..."}'
```

### Common Issues

#### 1. "Claude API error: 401"
**Problem**: Invalid API key
**Solution**: Check ANTHROPIC_API_KEY in .env

#### 2. "mode: '$0'" returned
**Problem**: AI disabled or error occurred
**Solution**: Set ENABLE_AI_ANALYSIS=true

#### 3. JSON parse error
**Problem**: Claude returned non-JSON
**Solution**: Check prompt, add markdown stripping

#### 4. Low confidence scores
**Problem**: Photo quality issues
**Solution**: Advise user to take clearer photos

## Future Enhancements

### Potential Upgrades

1. **Prompt Caching** (Anthropic feature)
   - Cache system prompts
   - Reduce input token costs by 90%

2. **Claude 3 Opus** (most capable)
   - Even better vision analysis
   - Higher accuracy on complex meals

3. **Streaming Responses**
   - Real-time analysis feedback
   - Better UX for users

4. **Multi-Image Analysis**
   - Compare meals over time
   - Detect patterns

5. **Recipe Suggestions**
   - Claude generates diabetes-friendly recipes
   - Based on available ingredients

## Resources

- **Anthropic Documentation**: https://docs.anthropic.com/
- **Claude API Reference**: https://docs.anthropic.com/claude/reference
- **Pricing**: https://www.anthropic.com/pricing
- **Best Practices**: https://docs.anthropic.com/claude/docs/prompt-engineering

---

## Summary

Chatita uses **Claude 3.5 Sonnet** for intelligent meal analysis:
- ✅ Accurate food detection
- ✅ ADA-aligned nutrition estimates
- ✅ Fast and cost-effective
- ✅ Privacy-focused implementation
- ✅ Graceful fallback to manual mode

**Cost**: ~$3-5/month for typical usage
**Status**: Production-ready, disabled by default
**Activation**: Add ANTHROPIC_API_KEY to .env

**Ready to analyze meals with AI!** 🤖📸
