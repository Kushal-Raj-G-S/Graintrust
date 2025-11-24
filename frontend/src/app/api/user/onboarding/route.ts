import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId,
      phone,
      bio,
      organization,
      organizationType,
      location,
      state,
      country,
      farmSize,
      specialization,
      experience
    } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Update user with onboarding data
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        phone,
        bio,
        organization,
        organizationType,
        location,
        state,
        country: country || 'India',
        farmSize,
        specialization,
        experience,
        onboardingComplete: true
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Onboarding error:', error)
      return NextResponse.json(
        { error: 'Failed to complete onboarding' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Onboarding completed successfully',
      user: updatedUser
    }, { status: 200 })

  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
