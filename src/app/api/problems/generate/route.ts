import { NextRequest, NextResponse } from 'next/server';
import { generateProblem } from '@/lib/ai/problem-generator';
import { GenerateProblemRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateProblemRequest = await request.json();

    // Validate request
    if (!body.topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Generate problem using Gemini AI
    const problem = await generateProblem({
      topic: body.topic,
      theta: body.theta ?? 0,
      grade: body.grade ?? 7,
      previous_problems: body.previous_problems ?? [],
    });

    return NextResponse.json({
      problem,
      estimated_difficulty: problem.irt.b,
      probability_correct: 0.7, // Target probability
    });
  } catch (error) {
    console.error('Error generating problem:', error);
    return NextResponse.json(
      { error: 'Failed to generate problem' },
      { status: 500 }
    );
  }
}
