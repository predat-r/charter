
import { useEffect, useRef } from "preact/hooks";

import * as echarts from "echarts/core";

import {
  BarChart,
  LineChart,
  ScatterChart,
  BoxplotChart,
  HeatmapChart,
} from "echarts/charts";

import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DatasetComponent,
  DataZoomComponent,
  VisualMapComponent,
} from "echarts/components";

import { SVGRenderer } from "echarts/renderers";

import type { EChartsCoreOption } from "echarts/core";

echarts.use([
  BarChart,
  LineChart,
  ScatterChart,
  BoxplotChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DatasetComponent,
  DataZoomComponent,
  VisualMapComponent,
  SVGRenderer,
]);

interface ChartViewProps {
  option: EChartsCoreOption;
  height?: number;
}

export function ChartView({
  option,
  height = 360,
}: ChartViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef =
    useRef<ReturnType<typeof echarts.init> | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const chart = echarts.init(container, undefined, {
      renderer: "svg",
    });

    chartRef.current = chart;

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, {
      notMerge: true,
    });
  }, [option]);

  return (
    <div
      ref={containerRef}
      class="w-full"
      style={{ height: `${height}px` }}
    />
  );
}
