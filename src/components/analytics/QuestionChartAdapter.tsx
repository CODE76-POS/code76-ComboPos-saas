import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, Activity } from 'lucide-react';

export type ChartTypeOption = 'all' | 'histogram' | 'bar' | 'line' | 'pie';

export interface ChartDataItem {
  name: string;
  value: number;
  fill?: string;
  count?: number;
  secondaryValue?: number;
  secondaryName?: string;
}

interface QuestionChartAdapterProps {
  chartType: ChartTypeOption;
  data: ChartDataItem[];
  title: string;
  valuePrefix?: string;
  valueSuffix?: string;
  height?: number;
}

const DEFAULT_COLORS = [
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#8b5cf6', // violet
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#64748b', // slate
];

export const QuestionChartAdapter: React.FC<QuestionChartAdapterProps> = ({
  chartType,
  data,
  title,
  valuePrefix = '',
  valueSuffix = '',
  height = 280,
}) => {
  // If chartType is 'all', return null (the default view renders original rich graphics)
  if (chartType === 'all') return null;

  const sanitizedData = data.map((d, i) => ({
    ...d,
    fill: d.fill || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));

  const formatValue = (val: any) => {
    if (typeof val !== 'number') return val;
    return `${valuePrefix}${val.toLocaleString()}${valueSuffix}`;
  };

  return (
    <div className="bg-slate-950/90 border border-teal-500/30 rounded-2xl p-4 sm:p-5 shadow-xl mb-4 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          {chartType === 'bar' && <BarChart3 className="w-4 h-4 text-teal-400" />}
          {chartType === 'line' && <TrendingUp className="w-4 h-4 text-sky-400" />}
          {chartType === 'pie' && <PieIcon className="w-4 h-4 text-amber-400" />}
          {chartType === 'histogram' && <Activity className="w-4 h-4 text-violet-400" />}
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {chartType === 'bar' && `User Selected: Bar Graph — ${title}`}
            {chartType === 'line' && `User Selected: Line Graph & Trendline — ${title}`}
            {chartType === 'pie' && `User Selected: Pie / Donut Breakdown — ${title}`}
            {chartType === 'histogram' && `User Selected: Frequency Histogram & Distribution — ${title}`}
          </h4>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
          Interactive Recharts Active
        </span>
      </div>

      <div style={{ height, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          {/* 1. BAR GRAPH */}
          {chartType === 'bar' ? (
            <BarChart data={sanitizedData} margin={{ top: 15, right: 20, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={10}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `${valuePrefix}${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [formatValue(val), 'Metric Value']}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {sanitizedData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          ) : /* 2. LINE GRAPH */
          chartType === 'line' ? (
            <AreaChart data={sanitizedData} margin={{ top: 15, right: 20, left: 10, bottom: 25 }}>
              <defs>
                <linearGradient id="lineFillGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={10}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `${valuePrefix}${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [formatValue(val), 'Metric Trend']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#14b8a6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#lineFillGrad)"
              />
            </AreaChart>
          ) : /* 3. PIE CHART */
          chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={sanitizedData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={4}
                label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
              >
                {sanitizedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [formatValue(val), 'Share']}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(val) => <span className="text-[11px] text-slate-300">{val}</span>}
              />
            </PieChart>
          ) : /* 4. HISTOGRAM */
          (
            <BarChart
              data={sanitizedData}
              barCategoryGap={0}
              margin={{ top: 15, right: 20, left: 10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={10}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `${valuePrefix}${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [formatValue(val), 'Frequency / Distribution']}
              />
              <Bar dataKey="value" stroke="#0f172a" strokeWidth={1}>
                {sanitizedData.map((entry, index) => (
                  <Cell key={`hist-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
