import React from 'react';
import ReactECharts from 'echarts-for-react';

interface LineChartData {
  name: string;
  data: number[];
}

interface LineChartProps {
  data: LineChartData[];
  xAxisData: string[];
  title?: string;
  height?: number;
  colors?: string[];
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  xAxisData,
  title,
  height = 300,
  colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d']
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
      trigger: 'axis'
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
    toolbox: {
      feature: {
        saveAsImage: {}
      }
    },
    color: colors,
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData
    },
    yAxis: {
      type: 'value'
    },
    series: data.map(item => ({
      name: item.name,
      type: 'line',
      stack: 'Total',
      data: item.data,
      smooth: true
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

export default LineChart;
