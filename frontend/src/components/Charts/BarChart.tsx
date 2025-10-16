import React from 'react';
import ReactECharts from 'echarts-for-react';

interface BarChartData {
  name: string;
  data: number[];
}

interface BarChartProps {
  data: BarChartData[];
  xAxisData: string[];
  title?: string;
  height?: number;
  colors?: string[];
  horizontal?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  xAxisData,
  title,
  height = 300,
  colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d'],
  horizontal = false
}) => {
  const option = {
    title: title ? {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal'
      }
    } : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: data.map(item => item.name),
      top: title ? 40 : 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    color: colors,
    xAxis: {
      type: horizontal ? 'value' : 'category',
      data: horizontal ? undefined : xAxisData
    },
    yAxis: {
      type: horizontal ? 'category' : 'value',
      data: horizontal ? xAxisData : undefined
    },
    series: data.map(item => ({
      name: item.name,
      type: 'bar',
      data: item.data,
      emphasis: {
        focus: 'series'
      }
    }))
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: `${height}px` }}
      opts={{ renderer: 'svg' }}
    />
  );
};

export default BarChart;
