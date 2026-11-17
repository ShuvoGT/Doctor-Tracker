import mongoose from 'mongoose';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Build the Mongo filter from the query params (search, specialization, dates).
function buildDoctorFilter(query) {
  const { search, specialization, startDate, endDate } = query;
  const filter = {};

  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { specialization: rx }, { hospital: rx }, { email: rx }];
  }
  if (specialization) filter.specialization = specialization;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }
  return filter;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/doctors  - paginated list with patient counts
export const listDoctors = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  const sortField = ['name', 'specialization', 'createdAt'].includes(req.query.sortBy)
    ? req.query.sortBy
    : 'createdAt';
  const sortOrder = req.query.order === 'asc' ? 1 : -1;

  const filter = buildDoctorFilter(req.query);

  // Count and page query run together; patient counts come from one $lookup.
  const [total, doctors] = await Promise.all([
    Doctor.countDocuments(filter),
    Doctor.aggregate([
      { $match: filter },
      { $sort: { [sortField]: sortOrder, _id: 1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'patients',
          localField: '_id',
          foreignField: 'doctor',
          as: 'patients',
        },
      },
      {
        $addFields: { patientCount: { $size: '$patients' } },
      },
      { $project: { patients: 0 } },
    ]),
  ]);

  res.json({
    data: doctors,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
});

// GET /api/doctors/specializations - distinct list for filter dropdown
export const getSpecializations = asyncHandler(async (req, res) => {
  const specializations = await Doctor.distinct('specialization');
  res.json({ data: specializations.sort() });
});

// GET /api/doctors/:id
export const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

  const patientCount = await Patient.countDocuments({ doctor: doctor._id });
  res.json({ data: { ...doctor.toObject(), patientCount } });
});

// POST /api/doctors
export const createDoctor = asyncHandler(async (req, res) => {
  const { name, specialization, hospital, phone, email, gender, qualification, experience, fee } =
    req.body;
  const doctor = await Doctor.create({
    name,
    specialization,
    hospital,
    phone,
    email,
    gender,
    qualification,
    experience,
    fee,
  });
  res.status(201).json({ data: doctor });
});

// PUT /api/doctors/:id
export const updateDoctor = asyncHandler(async (req, res) => {
  const { name, specialization, hospital, phone, email, gender, qualification, experience, fee } =
    req.body;
  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    { name, specialization, hospital, phone, email, gender, qualification, experience, fee },
    { new: true, runValidators: true }
  );
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  res.json({ data: doctor });
});

// DELETE /api/doctors/:id  - also removes the doctor's patients
export const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

  await Patient.deleteMany({ doctor: doctor._id });
  await doctor.deleteOne();
  res.json({ message: 'Doctor and associated patients deleted' });
});

/* ------------------------- Patients under a doctor ------------------------- */

// GET /api/doctors/:id/patients - paginated patients for a doctor
export const listDoctorPatients = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid doctor id' });
  }

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter = { doctor: id };
  if (req.query.search) {
    filter.name = new RegExp(escapeRegex(req.query.search), 'i');
  }
  if (req.query.condition) filter.condition = req.query.condition;

  const [total, patients] = await Promise.all([
    Patient.countDocuments(filter),
    Patient.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  res.json({
    data: patients,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
});

// POST /api/doctors/:id/patients - add a patient under a doctor
export const addDoctorPatient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doctor = await Doctor.findById(id);
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

  const { name, age, gender, phone, email, bloodGroup, address, diagnosis, condition } = req.body;
  const patient = await Patient.create({
    name,
    age,
    gender,
    phone,
    email,
    bloodGroup,
    address,
    diagnosis,
    condition,
    doctor: id,
  });
  res.status(201).json({ data: patient });
});

// DELETE /api/doctors/:id/patients/:patientId
export const removeDoctorPatient = asyncHandler(async (req, res) => {
  const { id, patientId } = req.params;
  const patient = await Patient.findOneAndDelete({ _id: patientId, doctor: id });
  if (!patient) return res.status(404).json({ message: 'Patient not found for this doctor' });
  res.json({ message: 'Patient removed from doctor' });
});
