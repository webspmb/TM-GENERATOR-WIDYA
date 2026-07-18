import React, { useState } from 'react';
import { StimulusItem, StimulusDataPoint } from '../types';
import { cn } from '../lib/utils';

interface StimulusRendererProps {
  stimulus: StimulusItem;
  className?: string;
  size?: 'sm' | 'base';
}

const PALETTE = [
  '#0d9488', // teal-600
  '#4f46e5', // indigo-600
  '#ea580c', // orange-600
  '#16a34a', // emerald-600
  '#e11d48', // rose-600
  '#ca8a04', // yellow-600
  '#2563eb', // blue-600
  '#9333ea', // purple-600
];

// Helper functions for polar coordinates (used in Pie Chart)
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const getPieSlicePath = (
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
) => {
  // SVG arcs can't draw 360 degrees perfectly with a single arc command, so cap it slightly below 360
  let diff = endAngle - startAngle;
  if (diff >= 360) {
    endAngle = startAngle + 359.99;
  }

  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = diff <= 180 ? '0' : '1';

  return [
    'M', x, y,
    'L', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'Z',
  ].join(' ');
};

export default function StimulusRenderer({ stimulus, className = '', size = 'base' }: StimulusRendererProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!stimulus || !stimulus.type) return null;

  const { type, title, xAxisLabel, yAxisLabel, headers, data = [] } = stimulus;

  if (data.length === 0 && type !== 'text') {
    return null;
  }

  // Common calculations for Bar and Line charts
  const width = 500;
  const height = 260;
  const marginTop = 30;
  const marginRight = 20;
  const marginBottom = 50;
  const marginLeft = 60;

  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 10); // avoid division by zero
  const roundUpMax = Math.ceil(maxValue * 1.15); // Add 15% headroom

  const getX = (index: number) => {
    if (data.length <= 1) return marginLeft + plotWidth / 2;
    return marginLeft + (index / (data.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    return marginTop + plotHeight - (val / roundUpMax) * plotHeight;
  };

  // Grid / Tick Marks calculation for Y Axis
  const yTicksCount = 4;
  const yTicks = Array.from({ length: yTicksCount + 1 }, (_, i) => {
    return Math.round((roundUpMax / yTicksCount) * i);
  });

  // Helper to format large numbers compactly (e.g. 10.2M, 5K)
  const formatCompact = (num: number) => {
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1) + 'M';
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(num % 1_000 === 0 ? 0 : 1) + 'K';
    }
    return num.toString();
  };

  const renderBarChart = () => {
    const barPadding = 0.35; // proportion of step width
    const stepWidth = plotWidth / data.length;
    const barWidth = stepWidth * (1 - barPadding);

    return (
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-auto bg-white rounded-xl border border-slate-150 p-2 select-none print:border-slate-300"
      >
        {/* Horizontal grid lines */}
        {yTicks.map((tick, i) => {
          const y = getY(tick);
          return (
            <g key={i} className="opacity-40">
              <line 
                x1={marginLeft} 
                y1={y} 
                x2={width - marginRight} 
                y2={y} 
                stroke="#cbd5e1" 
                strokeDasharray="4 4" 
                strokeWidth={1}
              />
              <text 
                x={marginLeft - 8} 
                y={y + 4} 
                textAnchor="end" 
                className="text-[10px] font-semibold text-slate-500 font-mono"
              >
                {formatCompact(tick)}
              </text>
            </g>
          );
        })}

        {/* X and Y Axis lines */}
        <line 
          x1={marginLeft} 
          y1={marginTop + plotHeight} 
          x2={width - marginRight} 
          y2={marginTop + plotHeight} 
          stroke="#94a3b8" 
          strokeWidth={1.5}
        />
        <line 
          x1={marginLeft} 
          y1={marginTop} 
          x2={marginLeft} 
          y2={marginTop + plotHeight} 
          stroke="#94a3b8" 
          strokeWidth={1.5}
        />

        {/* Axis Labels */}
        {xAxisLabel && (
          <text 
            x={marginLeft + plotWidth / 2} 
            y={height - 8} 
            textAnchor="middle" 
            className="text-[11px] font-bold text-slate-600 fill-current"
          >
            {xAxisLabel}
          </text>
        )}
        {yAxisLabel && (
          <text 
            transform={`rotate(-90, 15, ${marginTop + plotHeight / 2})`} 
            x={15} 
            y={marginTop + plotHeight / 2} 
            textAnchor="middle" 
            className="text-[11px] font-bold text-slate-600 fill-current"
          >
            {yAxisLabel}
          </text>
        )}

        {/* Bars rendering */}
        {data.map((item, idx) => {
          const barHeight = (item.value / roundUpMax) * plotHeight;
          const barX = marginLeft + idx * stepWidth + (stepWidth * barPadding) / 2;
          const barY = marginTop + plotHeight - barHeight;
          const fillCol = PALETTE[idx % PALETTE.length];
          const isHovered = hoveredIndex === idx;

          return (
            <g 
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer transition-all duration-200"
            >
              {/* Actual bar */}
              <rect
                x={barX}
                y={barY}
                width={barWidth}
                height={Math.max(barHeight, 2)} // at least 2px height
                fill={fillCol}
                opacity={hoveredIndex === null || isHovered ? 1 : 0.6}
                rx={Math.min(barWidth * 0.15, 4)}
                ry={Math.min(barWidth * 0.15, 4)}
                className="transition-all"
              />

              {/* Data label on top of bar */}
              <text
                x={barX + barWidth / 2}
                y={barY - 5}
                textAnchor="middle"
                className={cn(
                  "text-[10px] font-bold font-mono transition-opacity",
                  isHovered ? "text-slate-900 fill-slate-900 scale-105" : "text-slate-600 fill-slate-600"
                )}
              >
                {item.value.toLocaleString('id-ID')}
              </text>

              {/* X Axis labels */}
              <text
                x={barX + barWidth / 2}
                y={marginTop + plotHeight + 16}
                textAnchor="middle"
                className={cn(
                  "text-[9px] font-bold fill-current transition-all",
                  isHovered ? "text-teal-700 fill-teal-700 font-extrabold" : "text-slate-600 fill-slate-600"
                )}
                style={{ maxWidth: stepWidth }}
              >
                {item.label.length > 10 ? `${item.label.substring(0, 8)}..` : item.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderLineChart = () => {
    // Construct line path coordinates
    const points = data.map((item, idx) => ({
      x: getX(idx),
      y: getY(item.value),
    }));

    let linePath = '';
    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    }

    return (
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-auto bg-white rounded-xl border border-slate-150 p-2 select-none print:border-slate-300"
      >
        {/* Horizontal grid lines */}
        {yTicks.map((tick, i) => {
          const y = getY(tick);
          return (
            <g key={i} className="opacity-40">
              <line 
                x1={marginLeft} 
                y1={y} 
                x2={width - marginRight} 
                y2={y} 
                stroke="#cbd5e1" 
                strokeDasharray="4 4" 
                strokeWidth={1}
              />
              <text 
                x={marginLeft - 8} 
                y={y + 4} 
                textAnchor="end" 
                className="text-[10px] font-semibold text-slate-500 font-mono"
              >
                {formatCompact(tick)}
              </text>
            </g>
          );
        })}

        {/* X and Y Axis lines */}
        <line 
          x1={marginLeft} 
          y1={marginTop + plotHeight} 
          x2={width - marginRight} 
          y2={marginTop + plotHeight} 
          stroke="#94a3b8" 
          strokeWidth={1.5}
        />
        <line 
          x1={marginLeft} 
          y1={marginTop} 
          x2={marginLeft} 
          y2={marginTop + plotHeight} 
          stroke="#94a3b8" 
          strokeWidth={1.5}
        />

        {/* Axis Labels */}
        {xAxisLabel && (
          <text 
            x={marginLeft + plotWidth / 2} 
            y={height - 8} 
            textAnchor="middle" 
            className="text-[11px] font-bold text-slate-600 fill-current"
          >
            {xAxisLabel}
          </text>
        )}
        {yAxisLabel && (
          <text 
            transform={`rotate(-90, 15, ${marginTop + plotHeight / 2})`} 
            x={15} 
            y={marginTop + plotHeight / 2} 
            textAnchor="middle" 
            className="text-[11px] font-bold text-slate-600 fill-current"
          >
            {yAxisLabel}
          </text>
        )}

        {/* Area under the line */}
        {points.length > 1 && (
          <path
            d={`${linePath} L ${points[points.length - 1].x} ${marginTop + plotHeight} L ${points[0].x} ${marginTop + plotHeight} Z`}
            fill="url(#line-grad)"
            opacity={0.12}
          />
        )}
        <defs>
          <linearGradient id="line-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Connection Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#0d9488"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points rendering */}
        {data.map((item, idx) => {
          const pt = points[idx];
          const isHovered = hoveredIndex === idx;
          const fillCol = PALETTE[idx % PALETTE.length];

          return (
            <g 
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              {/* Large invisible catch circle for better hover */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={16}
                fill="transparent"
              />

              {/* Point Node */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 7 : 5}
                fill="#ffffff"
                stroke={fillCol}
                strokeWidth={isHovered ? 4 : 3}
                className="transition-all duration-150"
              />

              {/* Data text */}
              <text
                x={pt.x}
                y={pt.y - 10}
                textAnchor="middle"
                className={cn(
                  "text-[10px] font-extrabold font-mono transition-opacity",
                  isHovered ? "text-slate-900 fill-slate-900 scale-105" : "text-slate-600 fill-slate-600"
                )}
              >
                {item.value.toLocaleString('id-ID')}
              </text>

              {/* X Axis labels */}
              <text
                x={pt.x}
                y={marginTop + plotHeight + 16}
                textAnchor="middle"
                className={cn(
                  "text-[9px] font-bold fill-current transition-all",
                  isHovered ? "text-teal-700 fill-teal-700 font-extrabold" : "text-slate-600 fill-slate-600"
                )}
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderPieChart = () => {
    const total = values.reduce((sum, v) => sum + v, 0);
    let accumulatedAngle = 0;

    const cx = 140;
    const cy = 130;
    const r = 95;

    return (
      <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6 bg-white rounded-xl border border-slate-150 p-4 select-none print:border-slate-300">
        <div className="w-48 h-48 relative shrink-0">
          <svg viewBox="0 0 280 260" className="w-full h-full">
            {data.map((item, idx) => {
              const valPercent = total > 0 ? (item.value / total) * 100 : 0;
              const angleSpan = total > 0 ? (item.value / total) * 360 : 0;
              const startAngle = accumulatedAngle;
              const endAngle = accumulatedAngle + angleSpan;
              accumulatedAngle = endAngle;

              const fillCol = PALETTE[idx % PALETTE.length];
              const isHovered = hoveredIndex === idx;

              // Calculate text label position in the middle of the slice
              const midAngle = startAngle + angleSpan / 2;
              const labelRadius = r * 0.65;
              const labelPos = polarToCartesian(cx, cy, labelRadius, midAngle);

              const path = getPieSlicePath(cx, cy, r, startAngle, endAngle);

              return (
                <g 
                  key={idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer"
                >
                  <path
                    d={path}
                    fill={fillCol}
                    stroke="#ffffff"
                    strokeWidth={2}
                    opacity={hoveredIndex === null || isHovered ? 1 : 0.65}
                    transform={isHovered ? `scale(1.04) translate(${-cx * 0.04}, ${-cy * 0.04})` : undefined}
                    style={{ transformOrigin: `${cx}px ${cy}px` }}
                    className="transition-all duration-200"
                  />

                  {valPercent > 8 && (
                    <text
                      x={labelPos.x}
                      y={labelPos.y + 4}
                      fill="#ffffff"
                      textAnchor="middle"
                      className="text-[9px] sm:text-[10px] font-extrabold font-mono select-none pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"
                    >
                      {valPercent.toFixed(0)}%
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend Panel */}
        <div className="flex-1 space-y-1.5 w-full">
          <p className="text-xs font-extrabold text-slate-800 tracking-tight pb-1 border-b border-slate-100">
            Keterangan Data ({total.toLocaleString('id-ID')} unit):
          </p>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-1.5 max-h-48 overflow-y-auto">
            {data.map((item, idx) => {
              const valPercent = total > 0 ? (item.value / total) * 100 : 0;
              const fillCol = PALETTE[idx % PALETTE.length];
              const isHovered = hoveredIndex === idx;

              return (
                <div 
                  key={idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={cn(
                    "flex items-center gap-2 p-1.5 rounded-lg transition-colors text-xs font-medium cursor-pointer",
                    isHovered ? "bg-slate-50 border-l-4" : "border-l-4 border-transparent"
                  )}
                  style={{ borderLeftColor: fillCol }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{item.label}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {item.value.toLocaleString('id-ID')} ({valPercent.toFixed(1)}%)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderTable = () => {
    // If headers are provided, use them. Otherwise, generate standard headings like 'Item' and 'Nilai / Jumlah'
    const tableHeaders = headers && headers.length > 0 
      ? headers 
      : [xAxisLabel || 'Data / Kategori', yAxisLabel || 'Jumlah / Nilai'];

    return (
      <div className="overflow-x-auto border border-slate-200 rounded-xl max-w-full print:border-slate-300 shadow-xs my-3 bg-white">
        <table className="min-w-full divide-y divide-slate-200 border-collapse print:divide-slate-300">
          <thead className="bg-slate-50 print:bg-slate-100">
            <tr>
              {tableHeaders.map((header, hIdx) => (
                <th 
                  key={hIdx} 
                  className="px-4 py-2 text-left text-[11px] sm:text-xs font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-200 bg-slate-100/60 print:border-slate-300"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 print:divide-slate-250">
            {data.map((row, rIdx) => (
              <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}>
                <td className="px-4 py-2 text-[11px] sm:text-xs text-slate-800 font-bold border-t border-slate-100 print:border-slate-200">
                  {row.label}
                </td>
                <td className="px-4 py-2 text-[11px] sm:text-xs text-slate-700 font-mono font-bold border-t border-slate-100 print:border-slate-200">
                  {row.value.toLocaleString('id-ID')} {row.extraInfo ? `(${row.extraInfo})` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={cn("w-full py-1 mb-2 space-y-1.5 break-inside-avoid", className)}>
      {title && (
        <div className="flex items-center gap-1.5 pb-1 text-[11px] sm:text-xs font-extrabold text-slate-800 uppercase tracking-wide">
          <span className="text-teal-600 font-bold">📊</span>
          <span>{title}</span>
        </div>
      )}
      
      {type === 'bar_chart' && renderBarChart()}
      {type === 'line_chart' && renderLineChart()}
      {type === 'pie_chart' && renderPieChart()}
      {type === 'table' && renderTable()}
    </div>
  );
}