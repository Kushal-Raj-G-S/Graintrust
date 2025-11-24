import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addAdminUser() {
  console.log('🌱 Adding admin user to Supabase...\n');

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@graintrust.com')
      .single();

    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Name:', existingAdmin.name);
      console.log('Role:', existingAdmin.role);
      return;
    }

    // Insert admin user
    const { data: admin, error: insertError } = await supabase
      .from('users')
      .insert({
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
        lastLogin: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log('✅ Admin user created successfully!\n');
    console.log('📝 Admin Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    admin@graintrust.com');
    console.log('Password: admin123');
    console.log('Role:     ADMIN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Also add other demo users
    await addDemoUsers();

  } catch (error) {
    console.error('❌ Error adding admin user:', error);
    process.exit(1);
  }
}

async function addDemoUsers() {
  console.log('Adding demo users...');

  const demoUsers = [
    {
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
    },
    {
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
    },
    {
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
    },
  ];

  for (const user of demoUsers) {
    const { data: existing } = await supabase
      .from('users')
      .select('email')
      .eq('email', user.email)
      .single();

    if (!existing) {
      await supabase.from('users').insert(user);
      console.log(`✅ Created: ${user.email}`);
    } else {
      console.log(`⏭️  Skipped: ${user.email} (already exists)`);
    }
  }

  console.log('\n🎉 All demo users added!\n');
}

addAdminUser();
