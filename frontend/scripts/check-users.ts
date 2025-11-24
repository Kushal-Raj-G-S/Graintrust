// Test script to check users in database and get a user ID
import { prisma } from '../src/lib/prisma'

async function checkUsers() {
  try {
    console.log('Checking users in database...')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        profilePicture: true,
        profileCompletion: true,
        trustScore: true,
        role: true
      },
      take: 5 // Get first 5 users
    })
    
    if (users.length === 0) {
      console.log('No users found. Creating a test user...')
      
      const testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test Farmer',
          password: 'hashedpassword', // In real app, this would be properly hashed
          role: 'FARMER',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          profileCompletion: 75,
          trustScore: 0.8,
          profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        }
      })
      
      console.log('Created test user:', testUser)
      console.log('\nUse this user ID in your dashboard:', testUser.id)
    } else {
      console.log('Found users:')
      users.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - ID: ${user.id}`)
        console.log(`  Avatar: ${user.avatar || user.profilePicture || 'None'}`)
        console.log(`  Profile: ${user.profileCompletion}% complete`)
        console.log('---')
      })
      
      console.log(`\nYou can use any of these user IDs: ${users.map(u => u.id).join(', ')}`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
