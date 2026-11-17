import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import { connectDB, disconnectDB } from '../config/db.js';

const SPECIALIZATIONS = [
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Dermatology',
  'Oncology',
  'Gastroenterology',
  'Psychiatry',
];

const HOSPITALS = [
  'City General Hospital',
  'St. Mary Medical Center',
  'Riverside Clinic',
  'Sunrise Health Institute',
  'Green Valley Hospital',
];

const CONDITIONS = ['Stable', 'Critical', 'Recovering', 'Under Observation', 'Discharged'];
const GENDERS = ['Male', 'Female', 'Other'];

const FIRST = ['John', 'Sara', 'Michael', 'Emily', 'David', 'Laura', 'James', 'Nadia', 'Omar', 'Lucy', 'Raj', 'Mei', 'Ahmed', 'Sofia', 'Chris', 'Hana'];
const LAST = ['Smith', 'Khan', 'Johnson', 'Lee', 'Brown', 'Garcia', 'Patel', 'Ali', 'Wong', 'Davis', 'Rahman', 'Mia', 'Clark', 'Nguyen'];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randName = () => `${rand(FIRST)} ${rand(LAST)}`;
const slug = (s) => s.toLowerCase().replace(/[^a-z]/g, '');

// A random date within the last `days` days.
function randomRecentDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - randInt(0, days));
  d.setHours(randInt(0, 23), randInt(0, 59), 0, 0);
  return d;
}

// Make sure an admin exists. If withDemoData is on and there are no doctors
// yet, also create some sample doctors and patients.
export async function ensureSeedData({ withDemoData = false } = {}) {
  // --- Admin user ---
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@doctortracker.com').toLowerCase();
  const existingAdmin = await User.findOne({ email });
  if (!existingAdmin) {
    await User.create({
      name: process.env.SEED_ADMIN_NAME || 'Admin User',
      email,
      password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
    });
    console.log(`Seeded admin user: ${email}`);
  }

  if (!withDemoData) return;

  const doctorCount = await Doctor.estimatedDocumentCount();
  if (doctorCount > 0) return;

  // --- Demo doctors ---
  const doctorsPayload = Array.from({ length: 24 }).map((_, i) => {
    const name = `Dr. ${randName()}`;
    return {
      name,
      specialization: rand(SPECIALIZATIONS),
      hospital: rand(HOSPITALS),
      phone: `+1-555-${randInt(1000, 9999)}`,
      email: `${slug(name)}${i}@hospital.com`,
      createdAt: randomRecentDate(60),
    };
  });
  const doctors = await Doctor.insertMany(doctorsPayload);

  // --- Demo patients ---
  const patientsPayload = [];
  doctors.forEach((doc) => {
    const n = randInt(3, 14);
    for (let i = 0; i < n; i += 1) {
      patientsPayload.push({
        name: randName(),
        age: randInt(1, 92),
        gender: rand(GENDERS),
        phone: `+1-555-${randInt(1000, 9999)}`,
        condition: rand(CONDITIONS),
        doctor: doc._id,
        createdAt: randomRecentDate(29),
      });
    }
  });
  await Patient.insertMany(patientsPayload);

  console.log(`Seeded ${doctors.length} doctors and ${patientsPayload.length} patients.`);
}

// Allow running directly:  npm run seed
const isDirectRun = process.argv[1] && process.argv[1].endsWith('seed.js');
if (isDirectRun) {
  (async () => {
    await connectDB();
    const reset = process.argv.includes('--reset');
    if (reset) {
      await Promise.all([Doctor.deleteMany({}), Patient.deleteMany({})]);
      console.log('Cleared existing doctors and patients.');
    }
    await ensureSeedData({ withDemoData: true });
    await disconnectDB();
    await mongoose.disconnect().catch(() => {});
    console.log('Done.');
    process.exit(0);
  })();
}
