'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  Plus,
  Stethoscope,
  Eye,
  Pencil,
  Trash2,
  Filter,
  X,
  Users,
} from 'lucide-react';
import { swrFetcher, apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';
import SearchInput from '@/components/ui/SearchInput';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import TableSkeleton from '@/components/ui/TableSkeleton';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DoctorFormModal from '@/components/doctors/DoctorFormModal';

export default function DoctorsPage() {
  const router = useRouter();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const params = useMemo(
    () => ({ page, limit: 10, search, specialization, startDate, endDate }),
    [page, search, specialization, startDate, endDate]
  );

  const { data, error, isLoading, mutate } = useSWR(
    ['/doctors', JSON.stringify(params)],
    swrFetcher,
    { keepPreviousData: true }
  );

  const { data: specData } = useSWR('/doctors/specializations', swrFetcher);
  const specializations = specData?.data || [];

  const doctors = data?.data || [];
  const activeFilters = Boolean(specialization || startDate || endDate);

  // Reset to page 1 whenever a filter changes.
  const withPageReset = (setter) => (val) => {
    setter(val);
    setPage(1);
  };

  function clearFilters() {
    setSpecialization('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  }

  async function confirmDelete() {
    setDeleteLoading(true);
    try {
      await apiFetch(`/doctors/${deleting._id}`, { method: 'DELETE' });
      toast.success('Doctor deleted');
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
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Manage all doctors, their details and patient lists.
        </p>
        <button
          className="btn-primary self-start sm:self-auto"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Doctor
        </button>
      </div>

      <div className="card">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={withPageReset(setSearch)}
              placeholder="Search by name, specialization, hospital, email…"
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

        {/* Filter panel */}
        {showFilters && (
          <div className="grid grid-cols-1 gap-4 border-b border-slate-200 bg-slate-50 p-4 sm:grid-cols-4">
            <div>
              <label className="label">Specialization</label>
              <select
                className="input"
                value={specialization}
                onChange={(e) => withPageReset(setSpecialization)(e.target.value)}
              >
                <option value="">All specializations</option>
                {specializations.map((s) => (
                  <option key={s} value={s}>
                    {s}
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
                <X className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {isLoading && !data ? (
          <TableSkeleton rows={8} cols={6} />
        ) : error ? (
          <EmptyState icon={Stethoscope} title="Couldn't load doctors" message={error.message} />
        ) : doctors.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="No doctors found"
            message={
              search || activeFilters
                ? 'Try adjusting your search or filters.'
                : 'Get started by adding your first doctor.'
            }
            action={
              !search && !activeFilters ? (
                <button className="btn-primary" onClick={() => setFormOpen(true)}>
                  <Plus className="h-4 w-4" /> Add Doctor
                </button>
              ) : null
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">Doctor</th>
                  <th className="px-4 py-3 font-medium">Specialization</th>
                  <th className="px-4 py-3 font-medium">Hospital</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Patients</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map((d) => (
                  <tr key={d._id} className="group hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/doctors/${d._id}`)}
                        className="font-medium text-slate-800 hover:text-brand-600"
                      >
                        {d.name}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-brand-50 text-brand-700 ring-brand-600/20">
                        {d.specialization}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{d.hospital}</td>
                    <td className="px-4 py-3 text-slate-500">
                      <div>{d.email}</div>
                      <div className="text-xs text-slate-400">{d.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        <Users className="h-4 w-4 text-slate-400" />
                        {d.patientCount ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(d.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="View patients"
                          className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-600"
                          onClick={() => router.push(`/doctors/${d._id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          title="Edit"
                          className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                          onClick={() => {
                            setEditing(d);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          title="Delete"
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          onClick={() => setDeleting(d)}
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

      <DoctorFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={mutate}
        doctor={editing}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete doctor?"
        confirmLabel="Delete"
        message={
          deleting
            ? `This will permanently delete "${deleting.name}" and all of their patients. This action cannot be undone.`
            : ''
        }
      />
    </div>
  );
}
