import { ResponsiveBar, type BarDatum, type BarSvgProps } from '@nivo/bar';
import { mbdChartTheme } from './theme';

interface MbdBarChartProps {
  data: BarDatum[];
  keys: string[];
  indexBy: string;
  /** Chart height in pixels */
  height?: number;
  /** Color function or array */
  colors?: BarSvgProps<BarDatum>['colors'];
  /** Show labels on bars */
  enableLabel?: boolean;
  /** Custom label format */
  labelFormat?: (v: number | string) => string;
  /** Axis bottom label */
  axisBottomLegend?: string;
  /** Axis left label */
  axisLeftLegend?: string;
  /** Format left axis ticks */
  axisLeftFormat?: (v: number | string) => string;
  /** Markers (e.g., threshold lines) */
  markers?: BarSvgProps<BarDatum>['markers'];
  /** Additional className */
  className?: string;
  /** Accessible label */
  ariaLabel?: string;
}

export default function MbdBarChart({
  data,
  keys,
  indexBy,
  height = 200,
  colors = ['#C2410C'],
  enableLabel = true,
  labelFormat,
  axisBottomLegend,
  axisLeftLegend,
  axisLeftFormat,
  markers,
  className,
  ariaLabel,
}: MbdBarChartProps) {
  return (
    <div className={className} style={{ height }}>
      <ResponsiveBar
        data={data}
        keys={keys}
        indexBy={indexBy}
        theme={mbdChartTheme}
        colors={colors}
        margin={{ top: 24, right: 16, bottom: axisBottomLegend ? 48 : 32, left: 56 }}
        padding={0.35}
        borderRadius={2}
        enableLabel={enableLabel}
        label={labelFormat ? (d) => labelFormat(d.value ?? 0) : undefined}
        labelSkipWidth={24}
        labelSkipHeight={12}
        labelTextColor="#E2E8F0"
        axisBottom={{
          tickSize: 4,
          tickPadding: 4,
          legend: axisBottomLegend,
          legendPosition: 'middle',
          legendOffset: 36,
        }}
        axisLeft={{
          tickSize: 4,
          tickPadding: 4,
          format: axisLeftFormat,
          legend: axisLeftLegend,
          legendPosition: 'middle',
          legendOffset: -48,
        }}
        markers={markers}
        enableGridY
        enableGridX={false}
        animate
        motionConfig="gentle"
        role="img"
        ariaLabel={ariaLabel ?? 'Bar chart'}
      />
    </div>
  );
}
