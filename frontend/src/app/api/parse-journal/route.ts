import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { commonExercises } from '@/lib/exercises';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You are an expert fitness and nutrition assistant. Your task is to parse a long-form journal entry from a user.
      Identify every workout and every meal mentioned.

      - For each workout, extract the exercise name, sets, reps, and weight. Then, **normalize the exercise name** against the standard list provided below. For example, "benching" becomes "Barbell Bench Press".
      - For each meal, extract the name, and estimate calories and protein.

      **Standard Exercise List**:
      ${commonExercises.join('\n')}

      **User's Text to Parse**: "${transcript}"

      Return a single JSON object with "workouts" and "meals" arrays.

      **JSON Output Example**:
      {
        "workouts": [
          { "name": "Barbell Bench Press", "sets": 5, "reps": 3, "weight": 225 },
          { "name": "Squat", "sets": 4, "reps": 8, "weight": 185 }
        ],
        "meals": [
          { "name": "Chicken Salad", "calories": 350, "protein": 40 },
          { "name": "Protein Shake", "calories": 180, "protein": 30 }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    
    const jsonString = text.replace(/```json\n|```/g, '').trim();

    try {
        const parsedJson = JSON.parse(jsonString);
        return NextResponse.json(parsedJson);
    } catch (e) {
        console.error('Failed to parse AI response JSON:', e);
        return NextResponse.json({ error: 'Failed to parse AI response.', rawText: jsonString }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in parse-journal API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

