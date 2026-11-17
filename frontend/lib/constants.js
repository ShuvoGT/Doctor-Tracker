export const PATIENT_CONDITIONS = [
  'Stable',
  'Critical',
  'Recovering',
  'Under Observation',
  'Discharged',
];

export const GENDERS = ['Male', 'Female', 'Other'];

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

// Tailwind color classes per condition (badges).
export const CONDITION_STYLES = {
  Stable: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Critical: 'bg-red-50 text-red-700 ring-red-600/20',
  Recovering: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  'Under Observation': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Discharged: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

// Chart palette (colorblind-friendly, consistent order).
export const CHART_COLORS = ['#3366ff', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];
