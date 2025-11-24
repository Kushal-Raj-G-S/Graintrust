import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Fetch user's course enrollments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status'); // active, completed, paused

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('course_enrollments')
      .select('*')
      .eq('userId', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('lastAccessedAt', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ enrollments: data || [] });

  } catch (error) {
    console.error('Error fetching course enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course enrollments' },
      { status: 500 }
    );
  }
}

// POST - Enroll in a course or update progress
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, courseId, courseName, progress, status = 'active' } = body;

    if (!userId || !courseId || !courseName) {
      return NextResponse.json(
        { error: 'userId, courseId, and courseName are required' },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('userId', userId)
      .eq('courseId', courseId)
      .single();

    if (existing) {
      // Update existing enrollment
      const { data, error } = await supabase
        .from('course_enrollments')
        .update({
          progress: progress || 0,
          status,
          lastAccessedAt: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      // If completed, add to courses_completed
      if (progress === 100 && status === 'completed') {
        await supabase
          .from('courses_completed')
          .insert({
            userId,
            courseId,
            courseName,
            progress: 100
          });

        // Award XP - fetch current profile first
        const { data: profile } = await supabase
          .from('user_education_profile')
          .select('xp, certificates')
          .eq('userId', userId)
          .single();

        if (profile) {
          await supabase
            .from('user_education_profile')
            .update({
              xp: profile.xp + 100,
              certificates: profile.certificates + 1
            })
            .eq('userId', userId);
        }
      }

      return NextResponse.json({ success: true, enrollment: data });
    }

    // Create new enrollment
    const { data, error } = await supabase
      .from('course_enrollments')
      .insert({
        userId,
        courseId,
        courseName,
        progress: progress || 0,
        status,
        lastAccessedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, enrollment: data });

  } catch (error) {
    console.error('Error managing course enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to manage course enrollment' },
      { status: 500 }
    );
  }
}
