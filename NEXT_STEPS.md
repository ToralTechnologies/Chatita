# Next Development Steps

This document outlines the exact steps to complete the remaining features of Chatita.

---

## Immediate Next Step: Complete Meal Logging (Phase 3)

### Goal
Allow users to log meals with photos, manual food selection, and nutrition data.

### Implementation Checklist

#### 1. Create Meal Photo Upload Component

**File**: `components/meal-photo-upload.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Camera, Upload } from 'lucide-react';

interface MealPhotoUploadProps {
  onPhotoCapture: (base64: string) => void;
}

export default function MealPhotoUpload({ onPhotoCapture }: MealPhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreview(base64);
      onPhotoCapture(base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative">
          <img src={preview} alt="Meal preview" className="w-full rounded-lg" />
          <button
            onClick={() => setPreview(null)}
            className="absolute top-2 right-2 bg-white rounded-full p-2 shadow"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Take or upload a photo of your meal</p>

          <label className="inline-block bg-primary text-white px-6 py-3 rounded-button cursor-pointer hover:bg-primary-dark">
            <Upload className="w-5 h-5 inline mr-2" />
            Choose Photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
}
```

#### 2. Create Meal Form Component

**File**: `components/meal-form.tsx`

```typescript
'use client';

import { useState } from 'react';

interface MealFormData {
  description: string;
  detectedFoods: string[];
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
  mealType: string;
  feeling?: string;
}

interface MealFormProps {
  photoBase64?: string;
  onSubmit: (data: MealFormData) => void;
}

export default function MealForm({ photoBase64, onSubmit }: MealFormProps) {
  const [formData, setFormData] = useState<MealFormData>({
    description: '',
    detectedFoods: [],
    mealType: 'lunch',
  });

  const [foodInput, setFoodInput] = useState('');

  const addFood = () => {
    if (foodInput.trim()) {
      setFormData({
        ...formData,
        detectedFoods: [...formData.detectedFoods, foodInput.trim()],
      });
      setFoodInput('');
    }
  };

  const removeFood = (index: number) => {
    setFormData({
      ...formData,
      detectedFoods: formData.detectedFoods.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Meal Type */}
      <div>
        <label className="block text-sm font-medium mb-2">Meal Type</label>
        <select
          value={formData.mealType}
          onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
      </div>

      {/* Foods */}
      <div>
        <label className="block text-sm font-medium mb-2">Foods</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={foodInput}
            onChange={(e) => setFoodInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFood())}
            placeholder="e.g., Grilled chicken"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
          />
          <button
            type="button"
            onClick={addFood}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {formData.detectedFoods.map((food, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm"
            >
              {food}
              <button
                type="button"
                onClick={() => removeFood(index)}
                className="text-gray-500 hover:text-danger"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Nutrition (Optional) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Calories</label>
          <input
            type="number"
            value={formData.calories || ''}
            onChange={(e) => setFormData({ ...formData, calories: parseFloat(e.target.value) })}
            placeholder="Estimate"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Carbs (g)</label>
          <input
            type="number"
            value={formData.carbs || ''}
            onChange={(e) => setFormData({ ...formData, carbs: parseFloat(e.target.value) })}
            placeholder="Estimate"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {/* Feeling */}
      <div>
        <label className="block text-sm font-medium mb-2">How did you feel?</label>
        <textarea
          value={formData.feeling || ''}
          onChange={(e) => setFormData({ ...formData, feeling: e.target.value })}
          placeholder="Optional notes..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-white py-3 rounded-button font-medium hover:bg-primary-dark"
      >
        Save Meal
      </button>
    </form>
  );
}
```

#### 3. Create API Endpoints

**File**: `app/api/meals/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    const meals = await prisma.meal.findMany({
      where: {
        userId: session.user.id,
        ...(search && {
          OR: [
            { description: { contains: search, mode: 'insensitive' } },
            { detectedFoods: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { eatenAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ meals });
  } catch (error) {
    console.error('Meals fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      photoBase64,
      description,
      detectedFoods,
      calories,
      carbs,
      protein,
      fat,
      mealType,
      feeling,
    } = body;

    const meal = await prisma.meal.create({
      data: {
        userId: session.user.id,
        photoBase64,
        description,
        detectedFoods: JSON.stringify(detectedFoods || []),
        calories,
        carbs,
        protein,
        fat,
        mealType,
        feeling,
      },
    });

    return NextResponse.json({ meal }, { status: 201 });
  } catch (error) {
    console.error('Meal create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**File**: `app/api/meals/[id]/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meal = await prisma.meal.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    await prisma.meal.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Meal delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### 4. Update Add Meal Page

**File**: `app/(main)/add-meal/page.tsx` - Replace contents with full implementation

---

## After Meal Logging: Remaining Phases

### Phase 4: Menu Scanner (Rules-Based $0 Mode)
- Photo upload for menus
- Extract text (user types it or OCR later)
- Apply rules:
  - Low carb + high protein = "Great Choice"
  - Fried/breaded = "Moderate" or "Caution"
- Display recommendations with tips

### Phase 5: Insights & Pattern Detection
- Calculate weekly stats (time in range, avg glucose, meals logged)
- Detect patterns:
  - Eating out correlation
  - Meal timing
  - Carb variance
- Display insight cards

### Phase 6: Rewards & Badges
- Calculate consecutive tracking days
- Unlock badges based on streaks
- Display progress to next milestone
- Celebrate unlocks with animations

### Phase 7: Chat Assistant (Template-Based $0 Mode)
- Build chat UI
- Create conversation templates
- Pattern matching for common questions:
  - "What should I eat?" → suggest based on context
  - "I'm overwhelmed" → simplify suggestions
  - "I'm on my period" → acknowledge cravings
- Context-aware responses

### Phase 8: Internationalization
- Extract all strings to `i18n/en.json` and `i18n/es.json`
- Create translation hook
- Update all components to use translations
- Test language toggle

---

## Priority Order

1. ✅ Core setup (Done)
2. ✅ Auth & onboarding (Done)
3. ✅ Home dashboard (Done)
4. **Meal logging (Next - In Progress)**
5. Meal history
6. Insights
7. Rewards
8. Menu scanner
9. Chat assistant
10. Internationalization

---

## Testing Strategy

After each phase:
1. Manual testing in browser
2. Test on mobile viewport (Chrome DevTools)
3. Check database in Prisma Studio
4. Verify API responses in Network tab
5. Test edge cases (empty states, errors)

---

Good luck! Follow this guide step-by-step for best results.
