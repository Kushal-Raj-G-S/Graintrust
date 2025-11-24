import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Fetch user's calendar visits
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month'); // Format: YYYY-MM
    const year = searchParams.get('year');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('learning_calendar')
      .select('visitDate, lessonsCompleted, studyMinutes')
      .eq('userId', userId);

    // Filter by month/year if provided
    if (month && year) {
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-31`;
      query = query.gte('visitDate', startDate).lte('visitDate', endDate);
    }

    const { data, error } = await query.order('visitDate', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ visits: data || [] });

  } catch (error) {
    console.error('Error fetching calendar visits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar visits' },
      { status: 500 }
    );
  }
}

// POST - Record a calendar visit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, visitDate, lessonsCompleted = 0, studyMinutes = 0 } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const date = visitDate || new Date().toISOString().split('T')[0];

    // Upsert visit (update if exists, insert if not)
    const { data, error } = await supabase
      .from('learning_calendar')
      .upsert({
        userId,
        visitDate: date,
        lessonsCompleted,
        studyMinutes
      }, {
        onConflict: 'userId,visitDate',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) throw error;

    // Update user streak
    const { data: profileData } = await supabase.rpc('update_user_streak', {
      p_userid: userId
    });

    return NextResponse.json({ 
      success: true, 
      visit: data,
      streak: profileData
    });

  } catch (error) {
    console.error('Error recording calendar visit:', error);
    return NextResponse.json(
      { error: 'Failed to record calendar visit' },
      { status: 500 }
    );
  }
}
