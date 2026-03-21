import { ResponsiveLine } from '@nivo/line';
import { mbdChartTheme } from './theme';

interface DataPoint {
  x: string | number;
  y: number;
}

interface LineSerie {
  id: string;
  data: DataPoint[];
}

interface MbdLineChartProps {
  data: LineSerie[];
  /** Chart height in pixels */
  height?: number;
  /** Color array */
  colors?: string[];
  /** Enable area fill under line */
  enableArea?: boolean;
  /** Axis bottom label */
  axisBottomLegend?: string;
  /** Axis left label */
  axisLeftLegend?: string;
  /** Format left axis ticks */
  axisLeftFormat?: (v: number | string) => string;
  /** Additional className */
  className?: string;
  /** Accessible label */
  ariaLabel?: string;
}

export default function MbdLineChart({
  data,
  height = 200,
  colors = ['#f97316'],
  enableArea = false,
  axisBottomLegend,
  axisLeftLegend,
  axisLeftFormat,
  className,
  ariaLabel,
}: MbdLineChartProps) {
  return (
    <div className={className} style={{ height }}>
      <ResponsiveLine
        data={data}
        theme={mbdChartTheme}
        colors={colors}
        margin={{ top: 16, right: 16, bottom: axisBottomLegend ? 48 : 32, left: 56 }}
        xScale={{ type: 'point' }}
        yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
        curve="monotoneX"
        enableArea={enableArea}
        areaOpacity={0.08}
        lineWidth={2}
        pointSize={6}
        pointColor="#0F1930"
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        axisBottom={{
          tickSize: 4,
          tickPadding: 4,
          legend: axisBottomLegend,
          legendPosition: 'middle' as const,
          legendOffset: 36,
        }}
        axisLeft={{
          tickSize: 4,
          tickPadding: 4,
          format: axisLeftFormat,
          legend: axisLeftLegend,
          legendPosition: 'middle' as const,
          legendOffset: -48,
        }}
        enableGridY
        enableGridX={false}
        useMesh
        animate
        motionConfig="gentle"
        role="img"
        ariaLabel={ariaLabel ?? 'Line chart'}
      />
    </div>
  );
}
