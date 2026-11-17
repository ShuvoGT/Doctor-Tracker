import mongoose from 'mongoose';

const PATIENT_CONDITIONS = [
  'Stable',
  'Critical',
  'Recovering',
  'Under Observation',
  'Discharged',
];

const GENDERS = ['Male', 'Female', 'Other'];

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 150 },
    gender: { type: String, enum: GENDERS, required: true },
    phone: { type: String, trim: true },
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
export { PATIENT_CONDITIONS, GENDERS };
export default PatientModel;
