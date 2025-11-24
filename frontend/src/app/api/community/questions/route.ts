import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const filter = searchParams.get('filter');

    let query = supabase
      .from('questions')
      .select(`
        *,
        author:community_users!questions_author_id_fkey(
          id, username, first_name, last_name, email, avatar, 
          reputation, level, is_verified, is_moderator, experience, 
          farm_type, location
        ),
        category:categories!questions_category_id_fkey(*),
        votes:votes(count),
        comments:comments(count)
      `);

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category_id', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    if (filter && filter !== 'all') {
      switch (filter) {
        case 'urgent':
          query = query.eq('is_urgent', true);
          break;
        case 'solved':
          query = query.eq('is_solved', true);
          break;
        case 'unsolved':
          query = query.eq('is_solved', false);
          break;
      }
    }

    // Apply sorting
    switch (sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'votes':
        query = query.order('vote_score', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data: questions, error } = await query;

    if (error) throw error;

    // Transform snake_case to camelCase for frontend compatibility
    const transformedQuestions = questions?.map((q: any) => ({
      ...q,
      createdAt: q.created_at,
      updatedAt: q.updated_at,
      isUrgent: q.is_urgent,
      isAnonymous: q.is_anonymous,
      isPinned: q.is_pinned,
      isSolved: q.is_solved,
      viewCount: q.view_count,
      voteScore: q.vote_score,
      categoryId: q.category_id,
      authorId: q.author_id,
      author: q.author ? {
        ...q.author,
        firstName: q.author.first_name,
        lastName: q.author.last_name,
        isVerified: q.author.is_verified,
        isModerator: q.author.is_moderator,
        isExpert: q.author.is_expert,
        farmType: q.author.farm_type,
      } : null,
    })) || [];

    return NextResponse.json({ questions: transformedQuestions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, categoryId, priority = 'normal', tags = [] } = body;

    // Get user info from headers (set by frontend)
    const userEmail = request.headers.get('x-user-email') || 'farmer@graintrust.com';
    const userName = request.headers.get('x-user-name') || 'Anonymous Farmer';

    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: 'Title, content, and category are required' },
        { status: 400 }
      );
    }

    // Find or create user
    let { data: user, error: userError } = await supabase
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

    // Create question
    const { data: question, error } = await supabase
      .from('questions')
      .insert({
        title,
        content,
        category_id: categoryId,
        tags: Array.isArray(tags) ? tags : [tags],
        author_id: user.id,
        is_urgent: priority === 'urgent',
      })
      .select(`
        *,
        author:community_users!questions_author_id_fkey(
          id, username, first_name, last_name, email, avatar, is_expert
        ),
        category:categories!questions_category_id_fkey(*)
      `)
      .single();

    if (error) throw error;

    // Transform to camelCase
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
        isExpert: question.author.is_expert,
      } : null,
    };

    return NextResponse.json(transformedQuestion, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}
