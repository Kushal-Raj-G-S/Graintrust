import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password for admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create or update admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@graintrust.com' },
    update: {},
    create: {
      email: 'admin@graintrust.com',
      name: 'Kushal Raj G S',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '+91-9876543213',
      bio: 'Platform administrator with expertise in agricultural technology and supply chain management.',
      organization: 'GrainTrust Platform',
      location: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      organizationType: 'government',
      specialization: 'Platform management, Analytics',
      experience: '20+',
      isVerified: true,
      onboardingComplete: true,
      lastLogin: new Date(),
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create demo farmer user
  const farmer = await prisma.user.upsert({
    where: { email: 'farmer@demo.com' },
    update: {},
    create: {
      email: 'farmer@demo.com',
      name: 'Rajesh Kumar',
      password: await bcrypt.hash('farmer123', 10),
      role: 'FARMER',
      phone: '+91-9876543210',
      bio: 'Organic farmer with 15 years of experience in sustainable agriculture.',
      organization: 'Kumar Family Farm',
      location: 'Ludhiana',
      state: 'Punjab',
      country: 'India',
      farmSize: 'medium',
      specialization: 'Organic farming, Rice, Wheat',
      experience: '11-20',
      isVerified: true,
      onboardingComplete: true,
      lastLogin: new Date(),
    },
  });

  console.log('✅ Farmer user created:', farmer.email);

  // Create demo manufacturer user
  const manufacturer = await prisma.user.upsert({
    where: { email: 'manufacturer@demo.com' },
    update: {},
    create: {
      email: 'manufacturer@demo.com',
      name: 'Priya Sharma',
      password: await bcrypt.hash('manufacturer123', 10),
      role: 'MANUFACTURER',
      phone: '+91-9876543211',
      bio: 'Leading manufacturer of premium seeds and organic pesticides.',
      organization: 'AgroTech Solutions Pvt Ltd',
      location: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      organizationType: 'corporation',
      specialization: 'Seeds, Pesticides, Fertilizers',
      experience: '20+',
      isVerified: true,
      onboardingComplete: true,
      lastLogin: new Date(),
    },
  });

  console.log('✅ Manufacturer user created:', manufacturer.email);

  // Create demo consumer user
  const consumer = await prisma.user.upsert({
    where: { email: 'consumer@demo.com' },
    update: {},
    create: {
      email: 'consumer@demo.com',
      name: 'Amit Patel',
      password: await bcrypt.hash('consumer123', 10),
      role: 'CONSUMER',
      phone: '+91-9876543212',
      bio: 'Health-conscious consumer passionate about organic and authentic food products.',
      organization: 'Health-Conscious Consumer',
      location: 'Delhi',
      state: 'Delhi',
      country: 'India',
      specialization: 'Organic food verification',
      experience: '3-5',
      isVerified: true,
      onboardingComplete: true,
      lastLogin: new Date(),
    },
  });

  console.log('✅ Consumer user created:', consumer.email);

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📝 Demo Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:        admin@graintrust.com / admin123');
  console.log('Farmer:       farmer@demo.com / farmer123');
  console.log('Manufacturer: manufacturer@demo.com / manufacturer123');
  console.log('Consumer:     consumer@demo.com / consumer123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
