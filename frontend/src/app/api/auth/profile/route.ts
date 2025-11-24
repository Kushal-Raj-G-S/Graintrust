import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      id, 
      name, 
      email, 
      phone, 
      bio, 
      organization, 
      location, 
      state, 
      country, 
      specialization, 
      experience, 
      farmSize, 
      organizationType,
      profilePicture
    } = body

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(bio && { bio }),
        ...(organization && { organization }),
        ...(location && { location }),
        ...(state && { state }),
        ...(country && { country }),
        ...(specialization && { specialization }),
        ...(experience && { experience }),
        ...(farmSize && { farmSize }),
        ...(organizationType && { organizationType }),
        ...(profilePicture !== undefined && { profilePicture }),
        updatedAt: new Date()
      }
    })

    // Return updated user data (excluding password)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    }, { status: 200 })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
