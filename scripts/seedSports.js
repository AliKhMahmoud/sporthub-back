require('dotenv').config();
const mongoose = require('mongoose');
const Sport = require('../src/models/Sport');

const sports = [
  {
    name: 'Bodybuilding',
    slug: 'bodybuilding',
    description: 'Build muscle mass and sculpt your physique through structured weight training and nutrition.',
    colorTheme: '#F97316', // orange
    image: null,
    isActive: true,
  },
  {
    name: 'Boxing',
    slug: 'boxing',
    description: 'Master the sweet science of boxing with technique, footwork, and power training.',
    colorTheme: '#EF4444', // red
    image: null,
    isActive: true,
  },
  {
    name: 'Taekwondo',
    slug: 'taekwondo',
    description: 'Korean martial art focusing on head-height kicks, jumping spinning kicks, and fast kicking techniques.',
    colorTheme: '#3B82F6', // blue
    image: null,
    isActive: true,
  },
  {
    name: 'Karate',
    slug: 'karate',
    description: 'Traditional Japanese martial art developing striking, discipline, and self-defense skills.',
    colorTheme: '#8B5CF6', // purple
    image: null,
    isActive: true,
  },
  {
    name: 'Cardio & Fitness',
    slug: 'cardio-fitness',
    description: 'Improve cardiovascular health, endurance, and overall fitness through dynamic training programs.',
    colorTheme: '#10B981', // green
    image: null,
    isActive: true,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to database');

    await Sport.deleteMany({});
    console.log('🗑️  Old sports cleared');

    await Sport.insertMany(sports);
    console.log('🌱 Sports seeded successfully:');
    sports.forEach((s) => console.log(`   ✔ ${s.name} (${s.slug})`));

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
    process.exit(0);
  }
};

seed();