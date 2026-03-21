/** Bloomberg Terminal-inspired nivo chart theme. */
export const mbdChartTheme = {
  background: 'transparent',
  text: {
    fontSize: 10,
    fill: '#64748B',
    fontFamily: 'JetBrains Mono, monospace',
  },
  axis: {
    domain: {
      line: { stroke: '#1E2A4A', strokeWidth: 1 },
    },
    ticks: {
      line: { stroke: '#1E2A4A', strokeWidth: 1 },
      text: { fill: '#64748B', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' },
    },
    legend: {
      text: { fill: '#A7B3C7', fontSize: 10, fontFamily: 'Space Grotesk, sans-serif' },
    },
  },
  grid: {
    line: { stroke: '#1E2A4A', strokeWidth: 0.5 },
  },
  legends: {
    text: { fill: '#A7B3C7', fontSize: 10, fontFamily: 'Space Grotesk, sans-serif' },
  },
  labels: {
    text: { fill: '#E2E8F0', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 },
  },
  tooltip: {
    container: {
      background: '#0F1930',
      border: '1px solid #1E2A4A',
      color: '#E2E8F0',
      fontSize: 11,
      fontFamily: 'JetBrains Mono, monospace',
      borderRadius: '4px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    },
  },
} as const;

/** Common MBD chart colors. */
export const MBD_COLORS = {
  orange: '#f97316',
  orangeLight: '#fb923c',
  green: '#22C55E',
  red: '#DC2626',
  blue: '#38BDF8',
  yellow: '#EAB308',
  gray: '#64748B',
};
