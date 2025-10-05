import OpenAI from 'openai';
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    // Check authentication (optional for now)
    let userId = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        userId = decoded.id;
      } catch (error) {
        // Continue without authentication for now
        console.log('Auth token invalid, continuing without user ID');
      }
    }

    const { question, courseContent, lessonTitle, context } = await request.json();

    // Validate input
    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Create context-aware prompt
    const systemPrompt = `You are an expert AI tutor helping students learn. You should:
1. Provide clear, educational explanations
2. Use examples and analogies when helpful
3. Break down complex concepts into simpler parts
4. Encourage learning and provide positive feedback
5. Ask follow-up questions to deepen understanding
6. Be patient and supportive

Current lesson context: ${lessonTitle || 'General learning'}
Course content context: ${courseContent ? courseContent.substring(0, 1000) + '...' : 'No specific course content provided'}
Additional context: ${context || 'None'}

Remember to be encouraging and educational in your response.`;

    // Generate response using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: question
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0].message.content;

    // Save conversation to database if user is authenticated
    if (userId) {
      try {
        const { db } = await connectToDatabase();
        const conversationsCol = db.collection('ai_conversations');
        
        await conversationsCol.insertOne({
          userId,
          question,
          response: aiResponse,
          lessonTitle,
          courseContent: courseContent ? courseContent.substring(0, 500) : null,
          context,
          createdAt: new Date(),
        });
      } catch (dbError) {
        console.error('Error saving conversation:', dbError);
        // Continue even if database save fails
      }
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in AI tutor:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}