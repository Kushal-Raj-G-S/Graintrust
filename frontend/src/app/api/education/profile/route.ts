import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Fetch user's education profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch education profile
    const { data: profile, error: profileError } = await supabase
      .from('user_education_profile')
      .select('*')
      .eq('userId', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is OK for new users
      throw profileError;
    }

    // If no profile exists, create one
    if (!profile) {
      const { data: newProfile, error: createError } = await supabase
        .from('user_education_profile')
        .insert({
          userId,
          level: 1,
          xp: 0,
          streak: 0,
          totalStudyHours: 0,
          certificates: 0,
          lastVisitDate: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (createError) throw createError;

      return NextResponse.json({
        profile: newProfile,
        coursesCompleted: 0,
        activeCourses: 0,
        achievements: 0,
        thisMonthStudyTime: 0
      });
    }

    // Fetch additional stats
    const [completedCourses, activeCourses, achievements, thisMonthSessions] = await Promise.all([
      supabase
        .from('courses_completed')
        .select('id', { count: 'exact', head: true })
        .eq('userId', userId),
      supabase
        .from('course_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('userId', userId)
        .eq('status', 'active'),
      supabase
        .from('user_achievements')
        .select('id', { count: 'exact', head: true })
        .eq('userId', userId),
      supabase
        .from('user_study_sessions')
        .select('durationMinutes')
        .eq('userId', userId)
        .gte('sessionDate', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    ]);

    const thisMonthStudyTime = thisMonthSessions.data?.reduce((sum, session) => sum + session.durationMinutes, 0) || 0;

    return NextResponse.json({
      profile,
      coursesCompleted: completedCourses.count || 0,
      activeCourses: activeCourses.count || 0,
      achievements: achievements.count || 0,
      thisMonthStudyTime
    });

  } catch (error) {
    console.error('Error fetching education profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch education profile' },
      { status: 500 }
    );
  }
}

// POST - Update user's education profile (XP, level, streak)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, xp, level, streak, studyMinutes } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get current profile first
    const { data: currentProfile } = await supabase
      .from('user_education_profile')
      .select('totalStudyHours')
      .eq('userId', userId)
      .single();

    // Update profile
    const updates: any = {};
    if (xp !== undefined) updates.xp = xp;
    if (level !== undefined) updates.level = level;
    if (streak !== undefined) updates.streak = streak;
    if (studyMinutes !== undefined && currentProfile) {
      updates.totalStudyHours = currentProfile.totalStudyHours + Math.floor(studyMinutes / 60);
    }

    const { data, error } = await supabase
      .from('user_education_profile')
      .update(updates)
      .eq('userId', userId)
      .select()
      .single();

    if (error) throw error;

    // If study minutes provided, also record in study sessions
    if (studyMinutes) {
      await supabase
        .from('user_study_sessions')
        .insert({
          userId,
          subject: 'General Learning',
          durationMinutes: studyMinutes
        });
    }

    return NextResponse.json({ success: true, profile: data });

  } catch (error) {
    console.error('Error updating education profile:', error);
    return NextResponse.json(
      { error: 'Failed to update education profile' },
      { status: 500 }
    );
  }
}
