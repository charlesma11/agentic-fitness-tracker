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
      You are an expert nutrition assistant. Your task is to extract nutritional information from a user's transcribed text about a meal they ate.
      Extract the meal's name, an estimate of the calories, and an estimate of the protein in grams.
      Provide the output in a clean JSON format.

      Text to parse: "I had a grilled chicken salad for lunch"

      JSON Example:
      {
        "name": "Grilled Chicken Salad",
        "calories": 350,
        "protein": 40
      }

      Text to parse: "${transcript}"

      JSON Output format:
      {
        "name": "string",
        "calories": "number",
        "protein": "number"
      }

      If a value is not mentioned or cannot be estimated, set it to null. The meal name should be cleaned up and properly capitalized.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    // Clean the AI response to extract only the JSON part
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
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
    console.error('Error in parse-meal API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
