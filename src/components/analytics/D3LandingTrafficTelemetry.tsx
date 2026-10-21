import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Activity, Clock, Globe, MessageSquare, Sparkles } from 'lucide-react';

interface TelemetryPoint {
  day: string;
  visitors: number;
  chatbotInteractions: number;
  avgDurationSec: number;
  leadsGenerated: number;
}

interface D3LandingTrafficTelemetryProps {
  data: TelemetryPoint[];
  totalVisitors: number;
  totalChats: number;
  avgDurationSec: number;
}

export const D3LandingTrafficTelemetry: React.FC<D3LandingTrafficTelemetryProps> = ({
  data,
  totalVisitors,
  totalChats,
  avgDurationSec,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeMetric, setActiveMetric] = useState<'traffic' | 'duration'>('traffic');
  const [hoveredPoint, setHoveredPoint] = useState<TelemetryPoint | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 600;
    const height = 280;
    const margin = { top: 30, right: 30, bottom: 40, left: 50 };
    const width = containerWidth - margin.left - margin.right;

    const svg = d3
      .select(svgRef.current)
      .attr('viewBox', `0 0 ${containerWidth} ${height}`)
      .attr('width', '100%')
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scalePoint()
      .domain(data.map((d) => d.day))
      .range([0, width])
      .padding(0.4);

    if (activeMetric === 'traffic') {
      const maxY = d3.max(data, (d) => Math.max(d.visitors, d.chatbotInteractions)) || 100;
      const yScale = d3.scaleLinear().domain([0, maxY * 1.2]).range([height - margin.top - margin.bottom, 0]);

      // Grid
      svg.append('g')
        .call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat(() => ''))
        .selectAll('line')
        .attr('stroke', '#1e293b')
        .attr('stroke-dasharray', '3 3');

      // Axes
      svg.append('g')
        .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('fill', '#94a3b8')
        .attr('font-size', '11px');

      svg.append('g')
        .call(d3.axisLeft(yScale).ticks(5))
        .selectAll('text')
        .attr('fill', '#94a3b8')
        .attr('font-size', '11px');

      // Gradients for area
      const defs = svg.append('defs');
      const gradVisitors = defs
        .append('linearGradient')
        .attr('id', 'd3GradVisitors')
        .attr('x1', '0')
        .attr('y1', '0')
        .attr('x2', '0')
        .attr('y2', '1');
      gradVisitors.append('stop').attr('offset', '0%').attr('stop-color', '#14b8a6').attr('stop-opacity', 0.5);
      gradVisitors.append('stop').attr('offset', '100%').attr('stop-color', '#14b8a6').attr('stop-opacity', 0.0);

      const gradChats = defs
        .append('linearGradient')
        .attr('id', 'd3GradChats')
        .attr('x1', '0')
        .attr('y1', '0')
        .attr('x2', '0')
        .attr('y2', '1');
      gradChats.append('stop').attr('offset', '0%').attr('stop-color', '#8b5cf6').attr('stop-opacity', 0.6);
      gradChats.append('stop').attr('offset', '100%').attr('stop-color', '#8b5cf6').attr('stop-opacity', 0.0);

      // Area generator for visitors
      const areaVisitors = d3
        .area<TelemetryPoint>()
        .x((d) => xScale(d.day) || 0)
        .y0(height - margin.top - margin.bottom)
        .y1((d) => yScale(d.visitors))
        .curve(d3.curveMonotoneX);

      svg.append('path')
        .datum(data)
        .attr('fill', 'url(#d3GradVisitors)')
        .attr('d', areaVisitors);

      // Line for visitors
      const lineVisitors = d3
        .line<TelemetryPoint>()
        .x((d) => xScale(d.day) || 0)
        .y((d) => yScale(d.visitors))
        .curve(d3.curveMonotoneX);

      svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#14b8a6')
        .attr('stroke-width', 2.5)
        .attr('d', lineVisitors);

      // Line for chatbot interactions
      const lineChats = d3
        .line<TelemetryPoint>()
        .x((d) => xScale(d.day) || 0)
        .y((d) => yScale(d.chatbotInteractions))
        .curve(d3.curveMonotoneX);

      svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#8b5cf6')
        .attr('stroke-width', 2.5)
        .attr('stroke-dasharray', '4 4')
        .attr('d', lineChats);

      // Interactive nodes / circles
      data.forEach((point) => {
        const cx = xScale(point.day) || 0;
        const cyV = yScale(point.visitors);
        const cyC = yScale(point.chatbotInteractions);

        // Visitor circle
        svg.append('circle')
          .attr('cx', cx)
          .attr('cy', cyV)
          .attr('r', 5)
          .attr('fill', '#14b8a6')
          .attr('stroke', '#042f2e')
          .attr('stroke-width', 2)
          .style('cursor', 'pointer')
          .on('mouseenter', () => setHoveredPoint(point))
          .on('mouseleave', () => setHoveredPoint(null));

        // Chatbot circle
        svg.append('circle')
          .attr('cx', cx)
          .attr('cy', cyC)
          .attr('r', 4.5)
          .attr('fill', '#8b5cf6')
          .attr('stroke', '#2e1065')
          .attr('stroke-width', 2)
          .style('cursor', 'pointer')
          .on('mouseenter', () => setHoveredPoint(point))
          .on('mouseleave', () => setHoveredPoint(null));
      });
    } else {
      // Metric: Visitor Stay Duration (Seconds)
      const maxSec = d3.max(data, (d) => d.avgDurationSec) || 300;
      const yScale = d3.scaleLinear().domain([0, maxSec * 1.25]).range([height - margin.top - margin.bottom, 0]);

      svg.append('g')
        .call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat(() => ''))
        .selectAll('line')
        .attr('stroke', '#1e293b')
        .attr('stroke-dasharray', '3 3');

      svg.append('g')
        .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('fill', '#94a3b8')
        .attr('font-size', '11px');

      svg.append('g')
        .call(d3.axisLeft(yScale).ticks(5).tickFormat((d) => `${d}s`))
        .selectAll('text')
        .attr('fill', '#94a3b8')
        .attr('font-size', '11px');

      // Duration bars with gradient
      const barWidth = 24;
      svg.selectAll('.duration-bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', (d) => (xScale(d.day) || 0) - barWidth / 2)
        .attr('y', (d) => yScale(d.avgDurationSec))
        .attr('width', barWidth)
        .attr('height', (d) => height - margin.top - margin.bottom - yScale(d.avgDurationSec))
        .attr('rx', 4)
        .attr('fill', '#0ea5e9')
        .attr('opacity', 0.85)
        .style('cursor', 'pointer')
        .on('mouseenter', function (_, d) {
          d3.select(this).attr('opacity', 1).attr('fill', '#38bdf8');
          setHoveredPoint(d);
        })
        .on('mouseleave', function () {
          d3.select(this).attr('opacity', 0.85).attr('fill', '#0ea5e9');
          setHoveredPoint(null);
        });

      // Duration labels on bars
      svg.selectAll('.dur-label')
        .data(data)
        .enter()
        .append('text')
        .attr('x', (d) => xScale(d.day) || 0)
        .attr('y', (d) => yScale(d.avgDurationSec) - 6)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e2e8f0')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text((d) => `${d.avgDurationSec}s`);
    }
  }, [data, activeMetric]);

  return (
    <div className="bg-slate-950/90 p-5 rounded-2xl border border-slate-800" ref={containerRef}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-violet-400" />
              D3.js Interactive Infographic: Landing Page Telemetry & AI Bot Interactions
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Real-time D3 flow monitoring visitor volumes, average stay time, and AI conversational inquiries.
          </p>
        </div>

        {/* Metric Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1 text-xs">
          <button
            onClick={() => setActiveMetric('traffic')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              activeMetric === 'traffic' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Visitors vs Bot
          </button>
          <button
            onClick={() => setActiveMetric('duration')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
              activeMetric === 'duration' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Avg Stay (Seconds)
          </button>
        </div>
      </div>

      {/* SVG canvas */}
      <div className="w-full overflow-x-auto min-w-0">
        <svg ref={svgRef} className="w-full block" />
      </div>

      {/* Active telemetry hover detail */}
      {hoveredPoint ? (
        <div className="mt-3 p-3 bg-slate-900/90 border border-violet-500/40 rounded-xl text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in">
          <div>
            <span className="text-slate-400 block text-[10px]">Timeline Day:</span>
            <span className="font-bold text-slate-100">{hoveredPoint.day}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Visitors:</span>
            <span className="font-bold text-teal-400">{hoveredPoint.visitors.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Chatbot Conversations:</span>
            <span className="font-bold text-violet-400">{hoveredPoint.chatbotInteractions.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Avg Time on Page:</span>
            <span className="font-bold text-sky-400">{hoveredPoint.avgDurationSec} seconds</span>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
              Visitor Volume
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
              AI Chatbot Queries
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              Stay Time
            </span>
          </div>
          <span className="italic text-slate-500">Hover nodes or bars for precise telemetry</span>
        </div>
      )}
    </div>
  );
};
