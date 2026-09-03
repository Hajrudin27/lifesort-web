'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type Point = { date: string; tickets: number; waitlist: number };

export function DashboardChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="ticketsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="waitlistGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#a8a29e' }} tickLine={false} axisLine={false} interval={4} />
        <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} tickLine={false} axisLine={false} allowDecimals={false} width={24} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #e7e5e4', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          labelStyle={{ fontWeight: 600, marginBottom: 4 }}
        />
        <Area type="monotone" dataKey="tickets" name="Supportsager" stroke="#0ea5e9" strokeWidth={2} fill="url(#ticketsGradient)" />
        <Area type="monotone" dataKey="waitlist" name="Venteliste" stroke="#f43f5e" strokeWidth={2} fill="url(#waitlistGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}