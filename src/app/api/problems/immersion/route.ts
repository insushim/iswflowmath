import { NextRequest, NextResponse } from 'next/server';
import { generateImmersionProblem, ImmersionDifficulty } from '@/lib/ai/problem-generator';
import { MathTopic } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      grade = 7,
      theta = 0,
      difficulty = '10min',
      topic,
    } = body as {
      grade?: number;
      theta?: number;
      difficulty?: ImmersionDifficulty;
      topic?: MathTopic;
    };

    // Validate difficulty
    const validDifficulties: ImmersionDifficulty[] = [
      '5min', '10min', '30min', '1hour', '1day', '3days', '7days', '1month'
    ];

    if (!validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty. Must be one of: ' + validDifficulties.join(', ') },
        { status: 400 }
      );
    }

    // Generate immersion problem
    const problem = await generateImmersionProblem(grade, theta, difficulty, topic);

    return NextResponse.json({
      success: true,
      problem,
      difficulty,
      grade,
    });
  } catch (error) {
    console.error('Error generating immersion problem:', error);
    return NextResponse.json(
      { error: 'Failed to generate immersion problem' },
      { status: 500 }
    );
  }
}
