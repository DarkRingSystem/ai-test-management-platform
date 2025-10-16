import React, { useState, useRef, useEffect } from 'react';
import { Card } from 'antd';

interface BarData {
  name: string;
  value: number;
  color: string;
  icon?: string;
  description?: string;
}

interface BarChart3DProps {
  data: BarData[];
  width?: number;
  height?: number;
}

const BarChart3D: React.FC<BarChart3DProps> = ({ 
  data, 
  width = 500, 
  height = 350 
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const maxValue = Math.max(...data.map(d => d.value));

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, data.length * 200 + 500);
    
    return () => clearTimeout(timer);
  }, [data.length]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        minHeight: `${height}px`,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderRadius: '12px',
        boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 背景装饰 */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-20%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          zIndex: 0
        }}
      />

      {/* 缺陷卡片网格 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          width: '100%',
          marginBottom: '16px',
          position: 'relative',
          zIndex: 1
        }}
      >
        {data.map((item, index) => (
          <div
            key={index}
            style={{
              background: `linear-gradient(135deg, ${item.color}12, ${item.color}06)`,
              border: `1px solid ${item.color}25`,
              borderRadius: '12px',
              padding: '12px 8px',
              boxShadow: `
                0 4px 16px ${item.color}15,
                inset 0 1px 4px rgba(255,255,255,0.6)
              `,
              transform: hoveredIndex === index ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              cursor: 'pointer',
              animation: `cardFloat 0.8s ease-out ${index * 0.1}s both`,
              position: 'relative',
              overflow: 'hidden',
              textAlign: 'center',
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* 背景光晕 */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '80%',
                height: '80%',
                background: `radial-gradient(circle, ${item.color}08 0%, transparent 70%)`,
                transform: `translate(-50%, -50%) ${hoveredIndex === index ? 'scale(1.3)' : 'scale(1)'}`,
                transition: 'all 0.4s ease',
                zIndex: 0,
                borderRadius: '50%'
              }}
            />

            {/* 图标 */}
            <div
              style={{
                fontSize: '24px',
                marginBottom: '6px',
                transform: hoveredIndex === index ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.3s ease',
                textShadow: `0 2px 6px ${item.color}40`,
                filter: hoveredIndex === index ? 'brightness(1.2)' : 'brightness(1)',
                position: 'relative',
                zIndex: 1
              }}
            >
              {item.icon}
            </div>

            {/* 数值 */}
            <div
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: item.color,
                marginBottom: '4px',
                textShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s ease',
                position: 'relative',
                zIndex: 1
              }}
            >
              {item.value}
            </div>

            {/* 名称 */}
            <div
              style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: item.color,
                marginBottom: '2px',
                position: 'relative',
                zIndex: 1
              }}
            >
              {item.name}
            </div>

            {/* 描述 */}
            <div
              style={{
                fontSize: '10px',
                color: '#666',
                opacity: hoveredIndex === index ? 1 : 0.7,
                transition: 'opacity 0.3s ease',
                lineHeight: '1.2',
                position: 'relative',
                zIndex: 1,
                textAlign: 'center'
              }}
            >
              {item.description}
            </div>

            {/* 底部进度指示器 */}
            <div
              style={{
                position: 'absolute',
                bottom: '4px',
                left: '8px',
                right: '8px',
                height: '2px',
                background: 'rgba(0,0,0,0.1)',
                borderRadius: '1px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: `linear-gradient(90deg, ${item.color}, ${item.color}aa)`,
                  borderRadius: '1px',
                  width: `${(item.value / maxValue) * 100}%`,
                  transition: 'width 1s ease-out 0.3s',
                  boxShadow: `0 0 4px ${item.color}60`
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* 总计和统计信息 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '12px',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          borderRadius: '8px',
          color: 'white',
          boxShadow: '0 4px 16px rgba(102, 126, 234, 0.25)',
          transform: animationComplete ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.95)',
          opacity: animationComplete ? 1 : 0,
          transition: 'all 0.5s ease 0.8s',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '2px' }}>
            缺陷总数
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {data.reduce((sum, item) => sum + item.value, 0)}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '2px' }}>
            最高严重度
          </div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {data.find(item => item.value === Math.max(...data.map(d => d.value)))?.icon} {data.find(item => item.value === Math.max(...data.map(d => d.value)))?.name}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '2px' }}>
            平均值
          </div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {Math.round(data.reduce((sum, item) => sum + item.value, 0) / data.length)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarChart3D;
