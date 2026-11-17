'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const EMPTY = { name: '', specialization: '', hospital: '', phone: '', email: '' };

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
    try {
      if (isEdit) {
        await apiFetch(`/doctors/${doctor._id}`, { method: 'PUT', body: form });
        toast.success('Doctor updated');
      } else {
        await apiFetch('/doctors', { method: 'POST', body: form });
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

  const fields = [
    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Dr. Jane Doe' },
    { key: 'specialization', label: 'Specialization', type: 'text', placeholder: 'Cardiology' },
    { key: 'hospital', label: 'Hospital', type: 'text', placeholder: 'City General Hospital' },
    { key: 'phone', label: 'Phone', type: 'text', placeholder: '+1-555-0100' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'jane@hospital.com' },
  ];

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Doctor' : 'Add Doctor'}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((f, i) => (
            <div key={f.key} className={f.key === 'email' ? 'sm:col-span-2' : ''}>
              <label className="label">{f.label}</label>
              <input
                className="input"
                type={f.type}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={update(f.key)}
                autoFocus={i === 0}
                required
              />
              {errors[f.key] && <p className="mt-1 text-xs text-red-600">{errors[f.key]}</p>}
            </div>
          ))}
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
