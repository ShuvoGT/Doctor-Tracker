'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CONDITION_COLORS = {
  Stable: '#16a34a',
  Critical: '#ef4444',
  Recovering: '#3366ff',
  'Under Observation': '#f59e0b',
  Discharged: '#94a3b8',
};

export default function ConditionChart({ data = [] }) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="condition"
          innerRadius={62}
          outerRadius={95}
          paddingAngle={2}
          stroke="none"
        >
          {data.map((entry) => (
            <Cell key={entry.condition} fill={CONDITION_COLORS[entry.condition] || '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            fontSize: 12,
            boxShadow: '0 4px 12px rgba(16,24,40,0.08)',
          }}
          formatter={(v, n) => [`${v} (${total ? Math.round((v / total) * 100) : 0}%)`, n]}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{ fontSize: 12, color: '#64748b', paddingTop: 8 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
