import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import type { ChartDataPoint } from '@/types/dashboard';

const COLORS = ['#0F6E6A', '#4C9A5A', '#E8973A', '#D64545', '#5B6B6A'];

interface ChartCardProps {
  title: string;
  data: ChartDataPoint[];
  type?: 'bar' | 'pie' | 'line';
}

export function ChartCard({ title, data, type = 'bar' }: ChartCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        {type === 'pie' ? (
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        ) : type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E3E8E7" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#0F6E6A" strokeWidth={2} dot={{ fill: '#0F6E6A' }} />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
