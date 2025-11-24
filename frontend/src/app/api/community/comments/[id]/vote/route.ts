import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { type } = body;

    const userEmail = request.headers.get('x-user-email') || 'farmer@graintrust.com';
    const userName = request.headers.get('x-user-name') || 'Anonymous Farmer';

    if (!['up', 'down'].includes(type)) {
      return NextResponse.json(
        { error: 'Vote type must be "up" or "down"' },
        { status: 400 }
      );
    }

    // Find or create user
    let { data: user } = await supabase
      .from('community_users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from('community_users')
        .insert({
          email: userEmail,
          username: userName.replace(/\s+/g, '_').toLowerCase() || userEmail.split('@')[0],
          first_name: userName.split(' ')[0] || 'User',
          last_name: userName.split(' ')[1] || '',
          password_hash: 'auto-generated',
          is_expert: false,
        })
        .select()
        .single();

      if (createError) throw createError;
      user = newUser;
    }

    // Check existing vote
    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', user.id)
      .eq('comment_id', params.id)
      .single();

    if (existingVote) {
      if (existingVote.type.toLowerCase() === type) {
        await supabase.from('votes').delete().eq('id', existingVote.id);
        return NextResponse.json({ message: 'Vote removed' });
      } else {
        await supabase
          .from('votes')
          .update({ type: type.toUpperCase() })
          .eq('id', existingVote.id);
        return NextResponse.json({ message: 'Vote updated' });
      }
    }

    await supabase.from('votes').insert({
      type: type.toUpperCase(),
      user_id: user.id,
      comment_id: params.id,
    });

    return NextResponse.json({ message: 'Vote recorded' });
  } catch (error) {
    console.error('Error voting on comment:', error);
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
}
