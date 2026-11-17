'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { GENDERS } from '@/lib/constants';

const EMPTY = {
  name: '',
  specialization: '',
  hospital: '',
  phone: '',
  email: '',
  gender: '',
  qualification: '',
  experience: '',
  fee: '',
};

export default function DoctorFormModal({ open, onClose, onSaved, doctor }) {
  const toast = useToast();
  const isEdit = Boolean(doctor);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(
        doctor
          ? {
              name: doctor.name || '',
              specialization: doctor.specialization || '',
              hospital: doctor.hospital || '',
              phone: doctor.phone || '',
              email: doctor.email || '',
              gender: doctor.gender || '',
              qualification: doctor.qualification || '',
              experience: doctor.experience ?? '',
              fee: doctor.fee ?? '',
            }
          : EMPTY
      );
      setErrors({});
    }
  }, [open, doctor]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    const payload = {
      name: form.name,
      specialization: form.specialization,
      hospital: form.hospital,
      phone: form.phone,
      email: form.email,
      gender: form.gender,
      qualification: form.qualification,
      experience: form.experience === '' ? undefined : Number(form.experience),
      fee: form.fee === '' ? undefined : Number(form.fee),
    };

    try {
      if (isEdit) {
        await apiFetch(`/doctors/${doctor._id}`, { method: 'PUT', body: payload });
        toast.success('Doctor updated');
      } else {
        await apiFetch('/doctors', { method: 'POST', body: payload });
        toast.success('Doctor created');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      if (err.details) {
        const map = {};
        err.details.forEach((d) => (map[d.field] = d.message));
        setErrors(map);
      }
      toast.error(err.message || 'Could not save doctor');
    } finally {
      setSaving(false);
    }
  }

  const err = (name) =>
    errors[name] ? <p className="mt-1 text-xs text-red-600">{errors[name]}</p> : null;

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Doctor' : 'Add Doctor'} size="lg">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Full Name</label>
            <input
              className="input"
              value={form.name}
              onChange={update('name')}
              placeholder="Dr. Jane Doe"
              autoFocus
              required
            />
            {err('name')}
          </div>

          <div>
            <label className="label">Specialization</label>
            <input
              className="input"
              value={form.specialization}
              onChange={update('specialization')}
              placeholder="Cardiology"
              required
            />
            {err('specialization')}
          </div>

          <div>
            <label className="label">Gender</label>
            <select className="input" value={form.gender} onChange={update('gender')}>
              <option value="">Not specified</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            {err('gender')}
          </div>

          <div>
            <label className="label">Qualification / Degree</label>
            <input
              className="input"
              value={form.qualification}
              onChange={update('qualification')}
              placeholder="MBBS, FCPS (Cardiology)"
            />
            {err('qualification')}
          </div>

          <div>
            <label className="label">Hospital</label>
            <input
              className="input"
              value={form.hospital}
              onChange={update('hospital')}
              placeholder="City General Hospital"
              required
            />
            {err('hospital')}
          </div>

          <div>
            <label className="label">Experience (years)</label>
            <input
              className="input"
              type="number"
              min="0"
              max="80"
              value={form.experience}
              onChange={update('experience')}
              placeholder="8"
            />
            {err('experience')}
          </div>

          <div>
            <label className="label">Consultation Fee</label>
            <input
              className="input"
              type="number"
              min="0"
              value={form.fee}
              onChange={update('fee')}
              placeholder="500"
            />
            {err('fee')}
          </div>

          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              value={form.phone}
              onChange={update('phone')}
              placeholder="+1-555-0100"
              required
            />
            {err('phone')}
          </div>

          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="jane@hospital.com"
              required
            />
            {err('email')}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Spinner className="h-4 w-4 text-white" /> : isEdit ? 'Save changes' : 'Create doctor'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
