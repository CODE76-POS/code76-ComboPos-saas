import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { FinancialHealth } from '../../types/index.ts';
import { BarChart3, Layers, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

interface D3ExpensesVsProfitsProps {
  fin: FinancialHealth;
  expenseCategories: { name: string; value: number; percentage: number }[];
}

export const D3ExpensesVsProfits: React.FC<D3ExpensesVsProfitsProps> = ({
  fin,
  expenseCategories,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<'waterfall' | 'breakdown'>('waterfall');
  const [hoveredNode, setHoveredNode] = useState<{
    label: string;
    value: number;
    sublabel: string;
    type: 'positive' | 'negative' | 'neutral';
  } | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Clear previous elements
    d3.select(svgRef.current).selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 600;
    const height = 300;
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    const width = containerWidth - margin.left - margin.right;

    const svg = d3
      .select(svgRef.current)
      .attr('viewBox', `0 0 ${containerWidth} ${height}`)
      .attr('width', '100% ')
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    if (viewMode === 'waterfall') {
      // Build waterfall stages
      const stages = [
        { name: 'Revenue', value: fin.grossRevenue, base: 0, delta: fin.grossRevenue, fill: '#14b8a6', type: 'positive' as const },
        { name: 'COGS', value: fin.cogs, base: fin.grossRevenue - fin.cogs, delta: -fin.cogs, fill: '#f59e0b', type: 'negative' as const },
        { name: 'Gross Profit', value: fin.grossProfit, base: 0, delta: fin.grossProfit, fill: '#0ea5e9', type: 'positive' as const },
        { name: 'Expenses', value: fin.totalExpenses, base: fin.grossProfit - fin.totalExpenses, delta: -fin.totalExpenses, fill: '#f43f5e', type: 'negative' as const },
        { name: 'Net Profit', value: fin.netProfit, base: 0, delta: fin.netProfit, fill: fin.netProfit >= 0 ? '#10b981' : '#f43f5e', type: fin.netProfit >= 0 ? ('positive' as const) : ('negative' as const) },
      ];

      const maxVal = Math.max(fin.grossRevenue * 1.15, 100);
      const yScale = d3.scaleLinear().domain([0, maxVal]).range([height - margin.top - margin.bottom, 0]);
      const xScale = d3.scaleBand().domain(stages.map((s) => s.name)).range([0, width]).padding(0.35);

      // Grid lines
      const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat((d) => `$${Number(d) / 1000}k`);
      svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat(() => ''))
        .selectAll('line')
        .attr('stroke', '#1e293b')
        .attr('stroke-dasharray', '3 3');

      // Y-axis
      svg.append('g')
        .call(yAxis)
        .selectAll('text')
        .attr('fill', '#94a3b8')
        .attr('font-size', '11px');

      svg.select('.domain').attr('stroke', '#334155');

      // X-axis
      svg.append('g')
        .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('fill', '#94a3b8')
        .attr('font-size', '11px')
        .attr('dy', '1em');

      // Connector dashed lines between steps
      for (let i = 0; i < stages.length - 1; i++) {
        const curr = stages[i];
        const next = stages[i + 1];
        const currX = (xScale(curr.name) || 0) + xScale.bandwidth();
        const nextX = xScale(next.name) || 0;
        const lineY = yScale(curr.name === 'Revenue' || curr.name === 'Gross Profit' ? curr.value : curr.base);

        svg.append('line')
          .attr('x1', currX)
          .attr('y1', lineY)
          .attr('x2', nextX)
          .attr('y2', lineY)
          .attr('stroke', '#475569')
          .attr('stroke-dasharray', '2 2')
          .attr('stroke-width', 1.5);
      }

      // Draw Bars
      svg.selectAll('.bar')
        .data(stages)
        .enter()
        .append('rect')
        .attr('x', (d) => xScale(d.name) || 0)
        .attr('width', xScale.bandwidth())
        .attr('y', (d) => {
          if (d.name === 'COGS' || d.name === 'Expenses') {
            return yScale(d.base + d.value);
          }
          return yScale(Math.max(0, d.value));
        })
        .attr('height', (d) => {
          return Math.abs(yScale(0) - yScale(Math.max(0, d.value)));
        })
        .attr('rx', 6)
        .attr('fill', (d) => d.fill)
        .attr('opacity', 0.9)
        .style('cursor', 'pointer')
        .on('mouseenter', function (_, d) {
          d3.select(this).transition().duration(150).attr('opacity', 1).attr('transform', 'scale(1.02)');
          setHoveredNode({
            label: d.name,
            value: d.value,
            sublabel: `${d.type === 'positive' ? 'Surplus / Inflow' : 'Expense / Outflow'}: $${d.value.toLocaleString()}`,
            type: d.type,
          });
        })
        .on('mouseleave', function () {
          d3.select(this).transition().duration(150).attr('opacity', 0.9).attr('transform', 'scale(1)');
          setHoveredNode(null);
        });

      // Bar Value Labels
      svg.selectAll('.bar-label')
        .data(stages)
        .enter()
        .append('text')
        .attr('x', (d) => (xScale(d.name) || 0) + xScale.bandwidth() / 2)
        .attr('y', (d) => {
          const topY = d.name === 'COGS' || d.name === 'Expenses'
            ? yScale(d.base + d.value)
            : yScale(Math.max(0, d.value));
          return topY - 8;
        })
        .attr('text-anchor', 'middle')
        .attr('fill', '#f1f5f9')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text((d) => `$${Math.round(d.value / 1000)}k`);
    } else {
      // Breakdown of Operating Expenses by Category
      const data = expenseCategories.slice(0, 6);
      const maxVal = d3.max(data, (d) => d.value) || 100;
      const yScale = d3.scaleBand().domain(data.map((d) => d.name)).range([0, height - margin.top - margin.bottom]).padding(0.3);
      const xScale = d3.scaleLinear().domain([0, maxVal * 1.15]).range([0, width]);

      // X-axis
      svg.append('g')
        .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(5).tickFormat((d) => `$${Number(d)}`))
        .selectAll('text')
        .attr('fill', '#94a3b8')
        .attr('font-size', '10px');

      // Y-axis
      svg.append('g')
        .call(d3.axisLeft(yScale))
        .selectAll('text')
        .attr('fill', '#e2e8f0')
        .attr('font-size', '11px');

      // Bars
      svg.selectAll('.exp-bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('y', (d) => yScale(d.name) || 0)
        .attr('height', yScale.bandwidth())
        .attr('x', 0)
        .attr('width', (d) => xScale(d.value))
        .attr('rx', 4)
        .attr('fill', '#f43f5e')
        .attr('opacity', 0.85)
        .style('cursor', 'pointer')
        .on('mouseenter', function (_, d) {
          d3.select(this).attr('opacity', 1).attr('fill', '#fb7185');
          setHoveredNode({
            label: d.name,
            value: d.value,
            sublabel: `${d.percentage}% of total overhead expenses`,
            type: 'negative',
          });
        })
        .on('mouseleave', function () {
          d3.select(this).attr('opacity', 0.85).attr('fill', '#f43f5e');
          setHoveredNode(null);
        });

      // Values
      svg.selectAll('.exp-label')
        .data(data)
        .enter()
        .append('text')
        .attr('y', (d) => (yScale(d.name) || 0) + yScale.bandwidth() / 2 + 4)
        .attr('x', (d) => xScale(d.value) + 8)
        .attr('fill', '#f1f5f9')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text((d) => `$${d.value.toLocaleString()} (${d.percentage}%)`);
    }
  }, [fin, expenseCategories, viewMode]);

  return (
    <div className="bg-slate-950/90 p-5 rounded-2xl border border-slate-800" ref={containerRef}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-teal-400" />
              D3.js Interactive Infographic: Expenses vs Profits Flow
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Real-time vector D3 visualization depicting revenue conversion, cost deduction, and net margin.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1 text-xs">
          <button
            onClick={() => setViewMode('waterfall')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              viewMode === 'waterfall' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            P&L Waterfall
          </button>
          <button
            onClick={() => setViewMode('breakdown')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              viewMode === 'breakdown' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Overhead Hierarchy
          </button>
        </div>
      </div>

      {/* SVG Container */}
      <div className="w-full overflow-x-auto min-w-0">
        <svg ref={svgRef} className="w-full block" />
      </div>

      {/* Hover tooltip indicator */}
      {hoveredNode && (
        <div className="mt-2 p-2.5 bg-slate-900/90 border border-teal-500/40 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <div>
            <span className="font-bold text-slate-100">{hoveredNode.label}</span>
            <span className="text-slate-400 ml-2">{hoveredNode.sublabel}</span>
          </div>
          <div
            className={`font-black ${
              hoveredNode.type === 'positive'
                ? 'text-teal-400'
                : hoveredNode.type === 'negative'
                ? 'text-rose-400'
                : 'text-slate-200'
            }`}
          >
            ${hoveredNode.value.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};
