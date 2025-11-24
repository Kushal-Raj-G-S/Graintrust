const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugAdminUser() {
  try {
    // Check the admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@graintrust.com' }
    });

    if (admin) {
      console.log('Admin user details:');
      console.log('ID:', admin.id);
      console.log('Email:', admin.email);
      console.log('Name:', admin.name);
      console.log('Role:', admin.role);
      console.log('Role type:', typeof admin.role);
      console.log('Is role === "ADMIN"?', admin.role === 'ADMIN');
      console.log('onboardingComplete:', admin.onboardingComplete);
      console.log('isVerified:', admin.isVerified);
    } else {
      console.log('Admin user not found!');
    }

    // Check all users and their roles
    console.log('\n--- All Users ---');
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true
      }
    });
    
    allUsers.forEach(user => {
      console.log(`${user.email} - ${user.name} - Role: "${user.role}" (${typeof user.role})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAdminUser();
