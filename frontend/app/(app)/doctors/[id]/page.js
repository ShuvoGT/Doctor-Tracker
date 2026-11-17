'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Mail,
  Phone,
  Building2,
  Stethoscope,
  Users,
  GraduationCap,
  Wallet,
  Award,
  User,
} from 'lucide-react';
import { swrFetcher, apiFetch } from '@/lib/api';
import { formatDate, initials } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';
import { ConditionBadge } from '@/components/ui/Badge';
import SearchInput from '@/components/ui/SearchInput';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import TableSkeleton from '@/components/ui/TableSkeleton';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Spinner from '@/components/ui/Spinner';
import PatientFormModal from '@/components/patients/PatientFormModal';
import { PATIENT_CONDITIONS } from '@/lib/constants';

export default function DoctorDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [condition, setCondition] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { data: doctorData, error: doctorError, isLoading: doctorLoading } = useSWR(
    `/doctors/${id}`,
    swrFetcher
  );
  const doctor = doctorData?.data;

  const params = useMemo(
    () => ({ page, limit: 8, search, condition }),
    [page, search, condition]
  );
  const { data, isLoading, mutate } = useSWR(
    [`/doctors/${id}/patients`, JSON.stringify(params)],
    swrFetcher,
    { keepPreviousData: true }
  );
  const patients = data?.data || [];

  const withPageReset = (setter) => (val) => {
    setter(val);
    setPage(1);
  };

  function refreshAll() {
    mutate();
    // refresh doctor header patientCount too
    import('swr').then(({ mutate: globalMutate }) => globalMutate(`/doctors/${id}`));
  }

  async function confirmDelete() {
    setDeleteLoading(true);
    try {
      await apiFetch(`/doctors/${id}/patients/${deleting._id}`, { method: 'DELETE' });
      toast.success('Patient removed');
      setDeleting(null);
      refreshAll();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  }

  if (doctorLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (doctorError || !doctor) {
    return (
      <EmptyState
        icon={Stethoscope}
        title="Doctor not found"
        message="This doctor may have been deleted."
        action={
          <button className="btn-secondary" onClick={() => router.push('/doctors')}>
            Back to doctors
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => router.push('/doctors')}
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to doctors
      </button>

      {/* Doctor profile card */}
      <div className="card p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-xl font-semibold text-white">
              {initials(doctor.name)}
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{doctor.name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Stethoscope className="h-4 w-4" /> {doctor.specialization}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-4 w-4" /> {doctor.hospital}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-4 w-4" /> {doctor.email}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-4 w-4" /> {doctor.phone}
                </span>
              </div>
              {(doctor.qualification || doctor.gender || doctor.experience || doctor.fee) && (
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  {doctor.qualification && (
                    <span className="inline-flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" /> {doctor.qualification}
                    </span>
                  )}
                  {doctor.gender && (
                    <span className="inline-flex items-center gap-1">
                      <User className="h-4 w-4" /> {doctor.gender}
                    </span>
                  )}
                  {doctor.experience ? (
                    <span className="inline-flex items-center gap-1">
                      <Award className="h-4 w-4" /> {doctor.experience} yrs exp.
                    </span>
                  ) : null}
                  {doctor.fee ? (
                    <span className="inline-flex items-center gap-1">
                      <Wallet className="h-4 w-4" /> Fee {doctor.fee}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900">{doctor.patientCount ?? 0}</p>
              <p className="text-xs text-slate-400">Patients</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patients */}
      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Users className="h-4 w-4 text-slate-400" /> Patients under {doctor.name}
          </h3>
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add Patient
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={withPageReset(setSearch)}
              placeholder="Search patients by name…"
            />
          </div>
          <select
            className="input sm:w-56"
            value={condition}
            onChange={(e) => withPageReset(setCondition)(e.target.value)}
          >
            <option value="">All conditions</option>
            {PATIENT_CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {isLoading && !data ? (
          <TableSkeleton rows={5} cols={5} />
        ) : patients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No patients yet"
            message={
              search || condition
                ? 'No patients match your search.'
                : 'Add the first patient for this doctor.'
            }
            action={
              !search && !condition ? (
                <button className="btn-primary" onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4" /> Add Patient
                </button>
              ) : null
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Age</th>
                  <th className="px-4 py-3 font-medium">Gender</th>
                  <th className="px-4 py-3 font-medium">Condition</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600">{p.age}</td>
                    <td className="px-4 py-3 text-slate-600">{p.gender}</td>
                    <td className="px-4 py-3">
                      <ConditionBadge condition={p.condition} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="Edit"
                          className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-amber-50 hover:text-amber-600"
                          onClick={() => setEditing(p)}
                        >
                          Edit
                        </button>
                        <button
                          title="Remove patient"
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          onClick={() => setDeleting(p)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data?.pagination && <Pagination pagination={data.pagination} onPageChange={setPage} />}
      </div>

      {/* Add patient (doctor locked) */}
      <PatientFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={refreshAll}
        lockedDoctorId={id}
      />

      {/* Edit patient */}
      <PatientFormModal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSaved={refreshAll}
        patient={editing}
        lockedDoctorId={id}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Remove patient?"
        confirmLabel="Remove"
        message={
          deleting
            ? `Remove "${deleting.name}" from ${doctor.name}'s patient list? This cannot be undone.`
            : ''
        }
      />
    </div>
  );
}
