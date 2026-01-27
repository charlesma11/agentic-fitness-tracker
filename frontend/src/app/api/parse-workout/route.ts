import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Ensure you have a GEMINI_API_KEY in your .env.local file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You are an expert fitness assistant. Your task is to extract workout details from a user's transcribed text.
      The user is logging their workout. Extract the exercise name, the number of sets, the number of reps, and the weight in pounds.
      Provide the output in a clean JSON format.

      Text to parse: "${transcript}"

      JSON Output format:
      {
        "name": "string",
        "sets": "number",
        "reps": "number",
        "weight": "number"
      }

      If a value is not mentioned, set it to null. The exercise name should be cleaned up and properly capitalized.
      For example, 'bicep curls' should be 'Bicep Curls'.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    // Clean the AI response to extract only the JSON part
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      // Fallback for when the model doesn't use markdown
      try {
        const parsed = JSON.parse(text);
        return NextResponse.json(parsed);
      } catch (e) {
         return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
      }
    }
    
    const jsonString = jsonMatch[1];
    const parsedJson = JSON.parse(jsonString);

    return NextResponse.json(parsedJson);

  } catch (error) {
    console.error('Error in parse-workout API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
