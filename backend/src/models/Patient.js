import mongoose from 'mongoose';

const PATIENT_CONDITIONS = [
  'Stable',
  'Critical',
  'Recovering',
  'Under Observation',
  'Discharged',
];

const GENDERS = ['Male', 'Female', 'Other'];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 150 },
    gender: { type: String, enum: GENDERS, required: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    bloodGroup: {
      type: String,
      enum: BLOOD_GROUPS,
      set: (v) => (v === '' ? undefined : v),
    },
    address: { type: String, trim: true },
    diagnosis: { type: String, trim: true }, // disease / reason for visit / notes
    condition: { type: String, enum: PATIENT_CONDITIONS, default: 'Stable', index: true },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index: list a doctor's patients newest-first efficiently.
patientSchema.index({ doctor: 1, createdAt: -1 });
patientSchema.index({ name: 'text' });
patientSchema.index({ createdAt: -1 });

export const PatientModel = mongoose.model('Patient', patientSchema);
export { PATIENT_CONDITIONS, GENDERS, BLOOD_GROUPS };
export default PatientModel;
