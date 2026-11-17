import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/dashboard/stats - all dashboard numbers, mostly via aggregation.
export const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const last30 = new Date(now);
  last30.setDate(now.getDate() - 29); // inclusive 30-day window
  last30.setHours(0, 0, 0, 0);

  const [
    totalDoctors,
    totalPatients,
    patientsPerDoctor,
    conditionBreakdown,
    specializationBreakdown,
    patientsTrend,
    recentPatients,
  ] = await Promise.all([
    Doctor.estimatedDocumentCount(),
    Patient.estimatedDocumentCount(),

    // Top doctors by patient count (for bar chart)
    Patient.aggregate([
      { $group: { _id: '$doctor', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      {
        $lookup: { from: 'doctors', localField: '_id', foreignField: '_id', as: 'doctor' },
      },
      { $unwind: '$doctor' },
      {
        $project: {
          _id: 0,
          doctorId: '$doctor._id',
          name: '$doctor.name',
          specialization: '$doctor.specialization',
          count: 1,
        },
      },
    ]),

    // Patient condition distribution (for pie/donut chart)
    Patient.aggregate([
      { $group: { _id: '$condition', count: { $sum: 1 } } },
      { $project: { _id: 0, condition: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]),

    // Doctors grouped by specialization
    Doctor.aggregate([
      { $group: { _id: '$specialization', count: { $sum: 1 } } },
      { $project: { _id: 0, specialization: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]),

    // New patients per day over the last 30 days (for area/line chart)
    Patient.aggregate([
      { $match: { createdAt: { $gte: last30 } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, date: '$_id', count: 1 } },
      { $sort: { date: 1 } },
    ]),

    // Most recently added patients (dashboard table)
    Patient.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('doctor', 'name specialization')
      .lean(),
  ]);

  // Fill missing days in the trend so the chart has a continuous axis.
  const trendMap = new Map(patientsTrend.map((d) => [d.date, d.count]));
  const trend = [];
  for (let i = 0; i < 30; i += 1) {
    const d = new Date(last30);
    d.setDate(last30.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    trend.push({ date: key, count: trendMap.get(key) || 0 });
  }

  const avgPatientsPerDoctor = totalDoctors
    ? Number((totalPatients / totalDoctors).toFixed(1))
    : 0;

  res.json({
    data: {
      totals: { totalDoctors, totalPatients, avgPatientsPerDoctor },
      patientsPerDoctor,
      conditionBreakdown,
      specializationBreakdown,
      trend,
      recentPatients,
    },
  });
});
