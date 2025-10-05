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

    const { topic, format, difficulty } = await request.json();

    // Validate input
    if (!topic || !format || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required parameters: topic, format, difficulty' },
        { status: 400 }
      );
    }

    if (!['course', 'guide'].includes(format)) {
      return NextResponse.json(
        { error: 'Format must be either "course" or "guide"' },
        { status: 400 }
      );
    }

    if (!['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Difficulty must be "beginner", "intermediate", or "advanced"' },
        { status: 400 }
      );
    }

    // Create prompt based on format
    let prompt;
    if (format === 'course') {
      prompt = `Create a comprehensive ${difficulty} level course on "${topic}". Return the response as a JSON object with the following structure:

{
  "title": "Course Title",
  "level": "${difficulty}",
  "totalModules": number,
  "totalLessons": number,
  "modules": [
    {
      "id": 1,
      "title": "Module Title",
      "lessons": [
        {
          "title": "Lesson Title",
          "content": "Detailed lesson content with explanations, examples, and practical exercises"
        }
      ]
    }
  ]
}

Make sure the course is comprehensive, well-structured, and appropriate for ${difficulty} level learners.`;
    } else {
      prompt = `Create a comprehensive ${difficulty} level guide on "${topic}". Return the response as a JSON object with the following structure:

{
  "title": "Guide Title",
  "level": "${difficulty}",
  "totalLessons": number,
  "modules": [
    {
      "id": 1,
      "title": "Module Title",
      "lessons": [
        {
          "title": "Lesson Title",
          "content": "Detailed lesson content with explanations, examples, and practical exercises"
        }
      ]
    }
  ]
}

Make sure the guide is comprehensive, well-structured, and appropriate for ${difficulty} level learners.`;
    }

    // Generate content using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator. Create high-quality, structured learning content that is engaging and educational."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const generatedContent = completion.choices[0].message.content;
    
    // Try to parse JSON response
    let parsedContent;
    try {
      parsedContent = JSON.parse(generatedContent);
    } catch (parseError) {
      // If JSON parsing fails, create a basic structure
      parsedContent = {
        title: `${topic} - ${difficulty} Level ${format === 'course' ? 'Course' : 'Guide'}`,
        level: difficulty,
        totalModules: 1,
        totalLessons: 1,
        modules: [
          {
            id: 1,
            title: `Introduction to ${topic}`,
            lessons: [
              {
                title: `Getting Started with ${topic}`,
                content: generatedContent || `This is a ${difficulty} level ${format} about ${topic}. The content will be generated here.`
              }
            ]
          }
        ]
      };
    }

    // Save to database if it's a course
    if (format === 'course') {
      const { db } = await connectToDatabase();
      const coursesCol = db.collection('courses');
      
      const courseData = {
        ...parsedContent,
        createdBy: userId || 'anonymous',
        createdAt: new Date(),
        updatedAt: new Date(),
        students: 0,
        rating: 0,
        reviews: [],
        isPremium: false,
        price: 0
      };

      await coursesCol.insertOne(courseData);
    }

    return NextResponse.json({
      success: true,
      content: parsedContent
    });

  } catch (error) {
    console.error('Error generating course:', error);
    return NextResponse.json(
      { error: 'Failed to generate course content' },
      { status: 500 }
    );
  }
}