'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Plus, Users, Pencil, Trash2, Filter, X } from 'lucide-react';
import { swrFetcher, apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';
import { ConditionBadge } from '@/components/ui/Badge';
import SearchInput from '@/components/ui/SearchInput';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import TableSkeleton from '@/components/ui/TableSkeleton';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import PatientFormModal from '@/components/patients/PatientFormModal';
import { PATIENT_CONDITIONS } from '@/lib/constants';

export default function PatientsPage() {
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [condition, setCondition] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const params = useMemo(
    () => ({ page, limit: 10, search, condition, startDate, endDate }),
    [page, search, condition, startDate, endDate]
  );

  const { data, error, isLoading, mutate } = useSWR(
    ['/patients', JSON.stringify(params)],
    swrFetcher,
    { keepPreviousData: true }
  );
  const patients = data?.data || [];
  const activeFilters = Boolean(condition || startDate || endDate);

  const withPageReset = (setter) => (val) => {
    setter(val);
    setPage(1);
  };

  function clearFilters() {
    setCondition('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  }

  async function confirmDelete() {
    setDeleteLoading(true);
    try {
      await apiFetch(`/patients/${deleting._id}`, { method: 'DELETE' });
      toast.success('Patient deleted');
      setDeleting(null);
      mutate();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">All patients across every doctor.</p>
        <button
          className="btn-primary self-start sm:self-auto"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add Patient
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={withPageReset(setSearch)}
              placeholder="Search patients by name…"
            />
          </div>
          <button
            className={`btn-secondary relative ${activeFilters ? 'border-brand-300 text-brand-700' : ''}`}
            onClick={() => setShowFilters((s) => !s)}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilters && (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-4 border-b border-slate-200 bg-slate-50 p-4 sm:grid-cols-4">
            <div>
              <label className="label">Condition</label>
              <select
                className="input"
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
            <div>
              <label className="label">Added from</label>
              <input
                type="date"
                className="input"
                value={startDate}
                onChange={(e) => withPageReset(setStartDate)(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Added to</label>
              <input
                type="date"
                className="input"
                value={endDate}
                onChange={(e) => withPageReset(setEndDate)(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button className="btn-ghost" onClick={clearFilters} disabled={!activeFilters}>
                <X className="h-4 w-4" /> Clear
              </button>
            </div>
          </div>
        )}

        {isLoading && !data ? (
          <TableSkeleton rows={8} cols={6} />
        ) : error ? (
          <EmptyState icon={Users} title="Couldn't load patients" message={error.message} />
        ) : patients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No patients found"
            message={
              search || activeFilters
                ? 'Try adjusting your search or filters.'
                : 'Add your first patient to get started.'
            }
            action={
              !search && !activeFilters ? (
                <button className="btn-primary" onClick={() => setFormOpen(true)}>
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
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Age / Gender</th>
                  <th className="px-4 py-3 font-medium">Condition</th>
                  <th className="px-4 py-3 font-medium">Doctor</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{p.name}</div>
                      {p.phone && <div className="text-xs text-slate-400">{p.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.age} · {p.gender}
                    </td>
                    <td className="px-4 py-3">
                      <ConditionBadge condition={p.condition} />
                    </td>
                    <td className="px-4 py-3">
                      {p.doctor ? (
                        <Link
                          href={`/doctors/${p.doctor._id}`}
                          className="text-slate-700 hover:text-brand-600"
                        >
                          {p.doctor.name}
                          <span className="block text-xs text-slate-400">
                            {p.doctor.specialization}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="Edit"
                          className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                          onClick={() => {
                            setEditing(p);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          title="Delete"
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

      <PatientFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={mutate}
        patient={editing}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete patient?"
        confirmLabel="Delete"
        message={
          deleting
            ? `This will permanently delete "${deleting.name}". This action cannot be undone.`
            : ''
        }
      />
    </div>
  );
}
