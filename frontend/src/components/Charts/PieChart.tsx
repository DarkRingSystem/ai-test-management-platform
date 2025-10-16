import React from 'react';
import ReactECharts from 'echarts-for-react';

interface PieChartData {
  name: string;
  value: number;
}

interface PieChartProps {
  data: PieChartData[];
  title?: string;
  height?: number;
  colors?: string[];
}

const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  height = 300,
  colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1']
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
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    color: colors,
    series: [
      {
        name: title || '数据',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: `${height}px` }}
      opts={{ renderer: 'svg' }}
    />
  );
};

export default PieChart;
