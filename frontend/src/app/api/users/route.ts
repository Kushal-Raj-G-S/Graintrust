import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cache for 30 seconds (users don't change often)
export const revalidate = 30;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build query
    let query = supabase
      .from('users')
      .select('id, name, email, phone, role, createdAt, updatedAt')
      .order('name', { ascending: true })
      .limit(limit);

    // If role is specified, filter by role
    if (roleParam) {
      query = query.eq('role', roleParam.toUpperCase());
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    console.log(`👥 Fetched ${users?.length || 0} users in ${duration}ms`);

    return NextResponse.json(users || [], {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
