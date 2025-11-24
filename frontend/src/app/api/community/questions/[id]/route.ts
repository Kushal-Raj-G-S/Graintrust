import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: question, error } = await supabase
      .from('questions')
      .select(`
        *,
        author:community_users!questions_author_id_fkey(
          id, username, first_name, last_name, email, avatar, is_expert
        ),
        category:categories!questions_category_id_fkey(*),
        votes:votes(*, user:community_users!votes_user_id_fkey(id, username, first_name, last_name)),
        comments:comments(
          *,
          author:community_users!comments_author_id_fkey(
            id, username, first_name, last_name, avatar, is_expert
          ),
          votes:votes(count)
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Increment view count
    await supabase
      .from('questions')
      .update({ view_count: (question.view_count || 0) + 1 })
      .eq('id', params.id);

    // Transform snake_case to camelCase for frontend compatibility
    const transformedQuestion = {
      ...question,
      createdAt: question.created_at,
      updatedAt: question.updated_at,
      isUrgent: question.is_urgent,
      isAnonymous: question.is_anonymous,
      isPinned: question.is_pinned,
      isSolved: question.is_solved,
      viewCount: question.view_count,
      voteScore: question.vote_score,
      categoryId: question.category_id,
      authorId: question.author_id,
      author: question.author ? {
        ...question.author,
        firstName: question.author.first_name,
        lastName: question.author.last_name,
        isVerified: question.author.is_verified,
        isModerator: question.author.is_moderator,
        isExpert: question.author.is_expert,
      } : null,
      comments: question.comments?.map((c: any) => ({
        ...c,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        isAccepted: c.is_accepted,
        isByExpert: c.is_by_expert,
        voteScore: c.vote_score,
        authorId: c.author_id,
        questionId: c.question_id,
        parentId: c.parent_id,
        author: c.author ? {
          ...c.author,
          firstName: c.author.first_name,
          lastName: c.author.last_name,
          isVerified: c.author.is_verified,
          isModerator: c.author.is_moderator,
          isExpert: c.author.is_expert,
        } : null,
      })) || [],
    };

    return NextResponse.json(transformedQuestion);
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}
