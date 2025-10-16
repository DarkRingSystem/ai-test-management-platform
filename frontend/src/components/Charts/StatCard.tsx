import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
  suffix?: string;
  precision?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = '#1890ff',
  trend,
  suffix,
  precision
}) => {
  return (
    <Card className="stat-card" style={{ height: '100%' }}>
      <Row align="middle">
        <Col flex="auto">
          <Statistic
            title={title}
            value={value}
            suffix={suffix}
            precision={precision}
            valueStyle={{ color }}
          />
          {trend && (
            <div style={{ marginTop: 8 }}>
              <span style={{ 
                color: trend.isUp ? '#52c41a' : '#ff4d4f',
                fontSize: '14px'
              }}>
                {trend.isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {Math.abs(trend.value)}%
              </span>
              <span style={{ marginLeft: 8, color: '#666', fontSize: '12px' }}>
                较上周
              </span>
            </div>
          )}
        </Col>
        {icon && (
          <Col>
            <div style={{ 
              fontSize: '32px', 
              color,
              opacity: 0.8
            }}>
              {icon}
            </div>
          </Col>
        )}
      </Row>
    </Card>
  );
};

export default StatCard;
