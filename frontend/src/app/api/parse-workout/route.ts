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
      You are an expert fitness assistant. Your primary task is to accurately extract workout details from a user's transcribed text and normalize the exercise name against a standard list.

      1.  **Extract Details**: From the user's text, identify the exercise name, the number of sets, the number of reps, and the weight in pounds.
      2.  **Normalize Exercise Name**: Compare the extracted exercise name to the following list of standard exercises. Choose the closest match from this list. For example, if the user says "benching" or "bench presses", you should normalize it to "Barbell Bench Press".

      **Standard Exercise List**:
      ${commonExercises.join('\n')}

      **User's Text to Parse**: "${transcript}"

      **Output Format**: Provide the output in a clean JSON object. If a value is not mentioned, set it to null.

      **JSON Output Example**:
      {
        "name": "Barbell Bench Press",
        "sets": 5,
        "reps": 3,
        "weight": 225
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    const jsonString = text.replace(/```json\n|```/g, '').trim();
    const parsedJson = JSON.parse(jsonString);

    return NextResponse.json(parsedJson);

  } catch (error) {
    console.error('Error in parse-workout API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

