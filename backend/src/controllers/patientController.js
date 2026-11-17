import Patient from '../models/Patient.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPatientFilter(query) {
  const { search, condition, doctor, startDate, endDate } = query;
  const filter = {};

  if (search) filter.name = new RegExp(escapeRegex(search), 'i');
  if (condition) filter.condition = condition;
  if (doctor) filter.doctor = doctor;

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

// GET /api/patients - global paginated patient list with doctor info
export const listPatients = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  const sortOrder = req.query.order === 'asc' ? 1 : -1;
  const sortField = ['name', 'age', 'condition', 'createdAt'].includes(req.query.sortBy)
    ? req.query.sortBy
    : 'createdAt';

  const filter = buildPatientFilter(req.query);

  const [total, patients] = await Promise.all([
    Patient.countDocuments(filter),
    Patient.find(filter)
      .sort({ [sortField]: sortOrder, _id: 1 })
      .skip(skip)
      .limit(limit)
      .populate('doctor', 'name specialization hospital')
      .lean(),
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

// GET /api/patients/:id
export const getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id).populate(
    'doctor',
    'name specialization hospital'
  );
  if (!patient) return res.status(404).json({ message: 'Patient not found' });
  res.json({ data: patient });
});

// POST /api/patients
export const createPatient = asyncHandler(async (req, res) => {
  const { name, age, gender, phone, condition, doctor } = req.body;
  const patient = await Patient.create({ name, age, gender, phone, condition, doctor });
  const populated = await patient.populate('doctor', 'name specialization hospital');
  res.status(201).json({ data: populated });
});

// PUT /api/patients/:id
export const updatePatient = asyncHandler(async (req, res) => {
  const { name, age, gender, phone, condition, doctor } = req.body;
  const patient = await Patient.findByIdAndUpdate(
    req.params.id,
    { name, age, gender, phone, condition, doctor },
    { new: true, runValidators: true }
  ).populate('doctor', 'name specialization hospital');
  if (!patient) return res.status(404).json({ message: 'Patient not found' });
  res.json({ data: patient });
});

// DELETE /api/patients/:id
export const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndDelete(req.params.id);
  if (!patient) return res.status(404).json({ message: 'Patient not found' });
  res.json({ message: 'Patient deleted' });
});
