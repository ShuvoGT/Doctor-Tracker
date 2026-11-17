'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import { apiFetch, swrFetcher } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { PATIENT_CONDITIONS, GENDERS } from '@/lib/constants';

const EMPTY = { name: '', age: '', gender: 'Male', phone: '', condition: 'Stable', doctor: '' };

// Create/edit a patient. With lockedDoctorId the doctor is fixed (doctor detail
// page); otherwise a doctor dropdown is shown (Patients page).
export default function PatientFormModal({ open, onClose, onSaved, patient, lockedDoctorId }) {
  const toast = useToast();
  const isEdit = Boolean(patient);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Load doctors for the dropdown only when needed.
  const needsDoctorList = open && !lockedDoctorId;
  const { data: doctorsData } = useSWR(
    needsDoctorList ? ['/doctors', JSON.stringify({ limit: 100, sortBy: 'name', order: 'asc' })] : null,
    swrFetcher
  );
  const doctors = doctorsData?.data || [];

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (patient) {
      setForm({
        name: patient.name || '',
        age: patient.age ?? '',
        gender: patient.gender || 'Male',
        phone: patient.phone || '',
        condition: patient.condition || 'Stable',
        doctor: patient.doctor?._id || patient.doctor || lockedDoctorId || '',
      });
    } else {
      setForm({ ...EMPTY, doctor: lockedDoctorId || '' });
    }
  }, [open, patient, lockedDoctorId]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    const payload = {
      name: form.name,
      age: Number(form.age),
      gender: form.gender,
      phone: form.phone,
      condition: form.condition,
      doctor: lockedDoctorId || form.doctor,
    };

    try {
      if (isEdit) {
        await apiFetch(`/patients/${patient._id}`, { method: 'PUT', body: payload });
        toast.success('Patient updated');
      } else if (lockedDoctorId) {
        await apiFetch(`/doctors/${lockedDoctorId}/patients`, { method: 'POST', body: payload });
        toast.success('Patient added');
      } else {
        await apiFetch('/patients', { method: 'POST', body: payload });
        toast.success('Patient created');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      if (err.details) {
        const map = {};
        err.details.forEach((d) => (map[d.field] = d.message));
        setErrors(map);
      }
      toast.error(err.message || 'Could not save patient');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Patient' : 'Add Patient'}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input
            className="input"
            value={form.name}
            onChange={update('name')}
            placeholder="John Smith"
            autoFocus
            required
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Age</label>
            <input
              className="input"
              type="number"
              min="0"
              max="150"
              value={form.age}
              onChange={update('age')}
              placeholder="42"
              required
            />
            {errors.age && <p className="mt-1 text-xs text-red-600">{errors.age}</p>}
          </div>
          <div>
            <label className="label">Gender</label>
            <select className="input" value={form.gender} onChange={update('gender')}>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              value={form.phone}
              onChange={update('phone')}
              placeholder="+1-555-0100"
            />
          </div>
          <div>
            <label className="label">Condition</label>
            <select className="input" value={form.condition} onChange={update('condition')}>
              {PATIENT_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!lockedDoctorId && (
          <div>
            <label className="label">Assigned Doctor</label>
            <select className="input" value={form.doctor} onChange={update('doctor')} required>
              <option value="" disabled>
                Select a doctor…
              </option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} — {d.specialization}
                </option>
              ))}
            </select>
            {errors.doctor && <p className="mt-1 text-xs text-red-600">{errors.doctor}</p>}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Spinner className="h-4 w-4 text-white" /> : isEdit ? 'Save changes' : 'Add patient'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
