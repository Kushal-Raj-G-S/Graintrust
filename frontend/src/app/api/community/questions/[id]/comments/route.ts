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
    const { content } = body;

    const userEmail = request.headers.get('x-user-email') || 'farmer@graintrust.com';
    const userName = request.headers.get('x-user-name') || 'Anonymous Farmer';

    if (!content) {
      return NextResponse.json(
        { error: 'Comment content is required' },
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

    // Create comment
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        content,
        question_id: params.id,
        author_id: user.id,
      })
      .select(`
        *,
        author:community_users!comments_author_id_fkey(
          id, username, first_name, last_name, avatar, is_expert
        ),
        votes:votes(count)
      `)
      .single();

    if (error) throw error;

    // Transform to camelCase
    const transformedComment = {
      ...comment,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      isAccepted: comment.is_accepted,
      isByExpert: comment.is_by_expert,
      voteScore: comment.vote_score,
      authorId: comment.author_id,
      questionId: comment.question_id,
      parentId: comment.parent_id,
      author: comment.author ? {
        ...comment.author,
        firstName: comment.author.first_name,
        lastName: comment.author.last_name,
        isExpert: comment.author.is_expert,
      } : null,
    };

    return NextResponse.json(transformedComment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
