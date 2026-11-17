'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { Stethoscope, Users, Activity, TrendingUp, ArrowRight } from 'lucide-react';
import { swrFetcher } from '@/lib/api';
import { formatDate } from '@/lib/format';
import StatCard from '@/components/dashboard/StatCard';
import ChartCard from '@/components/dashboard/ChartCard';
import PatientsTrendChart from '@/components/dashboard/charts/PatientsTrendChart';
import PatientsPerDoctorChart from '@/components/dashboard/charts/PatientsPerDoctorChart';
import ConditionChart from '@/components/dashboard/charts/ConditionChart';
import SpecializationChart from '@/components/dashboard/charts/SpecializationChart';
import { ConditionBadge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR('/dashboard/stats', swrFetcher, {
    revalidateOnFocus: false,
  });

  const stats = data?.data;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={Activity}
        title="Couldn't load analytics"
        message={error.message}
      />
    );
  }

  const { totals, trend, patientsPerDoctor, conditionBreakdown, specializationBreakdown, recentPatients } =
    stats;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Overview of your clinic at a glance.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Doctors" value={totals.totalDoctors} icon={Stethoscope} accent="brand" />
        <StatCard title="Total Patients" value={totals.totalPatients} icon={Users} accent="green" />
        <StatCard
          title="Avg Patients / Doctor"
          value={totals.avgPatientsPerDoctor}
          icon={Activity}
          accent="violet"
        />
        <StatCard
          title="New (last 30 days)"
          value={trend.reduce((s, d) => s + d.count, 0)}
          icon={TrendingUp}
          accent="amber"
          hint="Patients added recently"
        />
      </div>

      {/* Trend */}
      <ChartCard title="New Patients" subtitle="Daily additions over the last 30 days">
        {trend.some((d) => d.count > 0) ? (
          <PatientsTrendChart data={trend} />
        ) : (
          <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
            No patient activity in the last 30 days.
          </div>
        )}
      </ChartCard>

      {/* Two column charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Patients per Doctor" subtitle="Top doctors by patient load">
          {patientsPerDoctor.length ? (
            <PatientsPerDoctorChart data={patientsPerDoctor} />
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
              No data yet.
            </div>
          )}
        </ChartCard>

        <ChartCard title="Patient Conditions" subtitle="Distribution across all patients">
          {conditionBreakdown.length ? (
            <ConditionChart data={conditionBreakdown} />
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
              No data yet.
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ChartCard title="Doctors by Specialization">
            {specializationBreakdown.length ? (
              <SpecializationChart data={specializationBreakdown} />
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
                No data yet.
              </div>
            )}
          </ChartCard>
        </div>

        {/* Recent patients */}
        <div className="lg:col-span-3">
          <ChartCard
            title="Recently Added Patients"
            action={
              <Link href="/patients" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            }
          >
            {recentPatients.length ? (
              <div className="-mx-1 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-2 py-2 font-medium">Patient</th>
                      <th className="px-2 py-2 font-medium">Doctor</th>
                      <th className="px-2 py-2 font-medium">Condition</th>
                      <th className="px-2 py-2 font-medium">Added</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentPatients.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50">
                        <td className="px-2 py-2.5 font-medium text-slate-800">{p.name}</td>
                        <td className="px-2 py-2.5 text-slate-500">
                          {p.doctor?.name || '—'}
                        </td>
                        <td className="px-2 py-2.5">
                          <ConditionBadge condition={p.condition} />
                        </td>
                        <td className="px-2 py-2.5 text-slate-500">{formatDate(p.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No patients yet" message="Add patients to see them here." />
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
