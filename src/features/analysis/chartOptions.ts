
import type { EChartsCoreOption } from "echarts/core";

import type { Chart } from "../ai/plan";
import type { DatasetInfo } from "../database/dataset";
import type { ChartData } from "./query";

function columnName(
  dataset: DatasetInfo,
  id: number | null,
): string {
  if (id === null) return "";

  return dataset.columns[id]?.name ?? `Column ${id}`;
}

export function createChartOption(
  chart: Chart,
  data: ChartData,
  dataset: DatasetInfo,
): EChartsCoreOption {
  const xName = columnName(dataset, chart.x);
  const yName = columnName(dataset, chart.y);

  const common = {
    tooltip: { trigger: "item" as const },
    animationDuration: 300,
    grid: {
      left: 65,
      right: 35,
      top: 45,
      bottom: 75,
      containLabel: true,
    },
  };

  switch (data.type) {
    case "bar":
    case "histogram":
      return {
        ...common,
        tooltip: { trigger: "axis" },
        xAxis: {
          type: "category",
          data: data.labels,
          name: data.type === "histogram" ? xName : undefined,
          axisLabel: {
            rotate: data.labels.length > 8 ? 35 : 0,
            hideOverlap: true,
          },
        },
        yAxis: {
          type: "value",
          name: data.type === "histogram"
            ? "Frequency"
            : yName,
        },
        dataZoom: data.labels.length > 12
          ? [{ type: "inside" }, { type: "slider" }]
          : undefined,
        series: [{
          type: "bar",
          name: data.type === "histogram"
            ? "Frequency"
            : `${chart.aggregation} ${yName}`,
          data: data.values,
          barMaxWidth: 55,
        }],
      };

    case "line":
      return {
        ...common,
        tooltip: { trigger: "axis" },
        xAxis: {
          type: "category",
          data: data.labels,
          name: xName,
          boundaryGap: false,
        },
        yAxis: {
          type: "value",
          name: yName,
          scale: true,
        },
        dataZoom: [
          { type: "inside" },
          { type: "slider" },
        ],
        series: [{
          type: "line",
          name: `${chart.aggregation} ${yName}`,
          data: data.values,
          smooth: false,
          showSymbol: data.values.length < 80,
        }],
      };

    case "scatter":
      return {
        ...common,
        tooltip: {
          trigger: "item",
          formatter: (params: any) => {
            const [x, y] = params.value as number[];
            return `${xName}: ${x}<br/>${yName}: ${y}`;
          },
        },
        xAxis: {
          type: "value",
          name: xName,
          scale: true,
        },
        yAxis: {
          type: "value",
          name: yName,
          scale: true,
        },
        dataZoom: [
          { type: "inside", xAxisIndex: 0 },
          { type: "inside", yAxisIndex: 0 },
        ],
        series: [{
          type: "scatter",
          name: `${xName} vs ${yName}`,
          data: data.points,
          symbolSize: 7,
          large: data.points.length > 2000,
        }],
      };

    case "boxplot":
      return {
        ...common,
        tooltip: { trigger: "item" },
        xAxis: {
          type: "category",
          data: data.labels,
          axisLabel: {
            rotate: data.labels.length > 8 ? 35 : 0,
          },
        },
        yAxis: {
          type: "value",
          name: yName,
          scale: true,
        },
        dataZoom: data.labels.length > 12
          ? [{ type: "inside" }, { type: "slider" }]
          : undefined,
        series: [{
          type: "boxplot",
          name: yName,
          data: data.values,
        }],
      };

    case "heatmap": {
      const maximum = Math.max(
        1,
        ...data.values.map((item) => item[2]),
      );

      return {
        ...common,
        grid: {
          left: 90,
          right: 85,
          top: 45,
          bottom: 95,
          containLabel: true,
        },
        tooltip: { trigger: "item" },
        xAxis: {
          type: "category",
          data: data.xLabels,
          name: xName,
          splitArea: { show: true },
        },
        yAxis: {
          type: "category",
          data: data.yLabels,
          name: yName,
          splitArea: { show: true },
        },
        visualMap: {
          min: 0,
          max: maximum,
          calculable: true,
          orient: "vertical",
          right: 5,
          top: "middle",
        },
        dataZoom: [
          { type: "inside", xAxisIndex: 0 },
          { type: "inside", yAxisIndex: 0 },
        ],
        series: [{
          type: "heatmap",
          name: "Count",
          data: data.values,
          label: { show: false },
        }],
      };
    }
  }
}
