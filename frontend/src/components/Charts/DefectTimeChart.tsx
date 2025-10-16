import React from 'react';

interface DefectTimeData {
  date: string;
  severe: number;
  major: number;
  minor: number;
  trivial: number;
  total: number;
}

interface DefectTimeChartProps {
  data: DefectTimeData[];
  height?: number;
}

const DefectTimeChart: React.FC<DefectTimeChartProps> = ({
  data,
  height = 300
}) => {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [hoveredData, setHoveredData] = React.useState<DefectTimeData | null>(null);

  const maxTotal = Math.max(...data.map(d => d.total));
  const colors = {
    severe: '#ff4d4f',
    major: '#faad14',
    minor: '#1890ff',
    trivial: '#52c41a'
  };

  const icons = {
    severe: '🔥',
    major: '⚠️',
    minor: '🔍',
    trivial: '💡'
  };

  const names = {
    severe: '严重',
    major: '主要',
    minor: '次要',
    trivial: '轻微'
  };

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* 图表容器 */}
      <div
        style={{
          height: `${height}px`,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '16px',
          padding: '20px',
          position: 'relative',
          overflow: 'visible',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* 网格线 - 霓虹风格 */}
        <svg
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
        >
          <defs>
            <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 30" fill="none" stroke="rgba(102, 126, 234, 0.3)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* 顶部光晕效果 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          height: '120px',
          background: 'radial-gradient(ellipse at center, rgba(102, 126, 234, 0.4) 0%, transparent 70%)',
          filter: 'blur(30px)',
          zIndex: 1,
          pointerEvents: 'none'
        }} />

        {/* 数据柱状图 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: '20px',
            height: '100%',
            padding: '30px 20px 35px 20px',
            position: 'relative',
            zIndex: 2
          }}
        >
          {data.map((item, index) => {
            // 调整高度计算：让柱子更好地填充空间
            // 总高度300px - 上padding(30px) - 下padding(35px) - 标签空间(30px) = 205px
            const availableHeight = 145;
            const barHeight = (item.total / maxTotal) * availableHeight;
            const severePct = (item.severe / item.total) * 100;
            const majorPct = (item.major / item.total) * 100;
            const minorPct = (item.minor / item.total) * 100;
            const trivialPct = (item.trivial / item.total) * 100;

            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  flex: '0 0 auto'
                }}
                onMouseEnter={() => {
                  setHoveredIndex(index);
                  setHoveredData(item);
                }}
                onMouseLeave={() => {
                  setHoveredIndex(null);
                  setHoveredData(null);
                }}
              >
                {/* 堆叠柱状图 - 霓虹发光效果 */}
                <div
                  style={{
                    width: '40px',
                    height: `${barHeight}px`,
                    borderRadius: '8px 8px 4px 4px',
                    position: 'relative',
                    background: `linear-gradient(to top,
                      ${colors.trivial} 0%,
                      ${colors.trivial} ${trivialPct}%,
                      ${colors.minor} ${trivialPct}%,
                      ${colors.minor} ${trivialPct + minorPct}%,
                      ${colors.major} ${trivialPct + minorPct}%,
                      ${colors.major} ${trivialPct + minorPct + majorPct}%,
                      ${colors.severe} ${trivialPct + minorPct + majorPct}%,
                      ${colors.severe} 100%)`,
                    boxShadow: hoveredIndex === index
                      ? `
                        0 0 20px rgba(102, 126, 234, 0.8),
                        0 0 40px rgba(102, 126, 234, 0.6),
                        0 8px 32px rgba(0, 0, 0, 0.4),
                        inset 0 2px 8px rgba(255, 255, 255, 0.4)
                      `
                      : `
                        0 0 10px rgba(102, 126, 234, 0.5),
                        0 4px 16px rgba(0, 0, 0, 0.3),
                        inset 0 2px 4px rgba(255, 255, 255, 0.3)
                      `,
                    transform: hoveredIndex === index ? 'scale(1.15) translateY(-8px)' : 'scale(1)',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    animation: `barGrow 0.8s ease-out ${index * 0.1}s both, barPulse 2s ease-in-out ${index * 0.2}s infinite`,
                    filter: hoveredIndex === index ? 'brightness(1.2)' : 'brightness(1)'
                  }}
                >
                  {/* 数值标签 - 霓虹风格 */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-32px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.95))',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      opacity: hoveredIndex === index ? 1 : 0,
                      transition: 'all 0.3s ease',
                      boxShadow: '0 0 15px rgba(102, 126, 234, 0.8), 0 4px 12px rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    {item.total}
                  </div>

                  {/* 底部发光效果 */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-4px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '60px',
                      height: '8px',
                      background: 'radial-gradient(ellipse at center, rgba(102, 126, 234, 0.6) 0%, transparent 70%)',
                      filter: 'blur(8px)',
                      opacity: hoveredIndex === index ? 1 : 0.5,
                      transition: 'opacity 0.3s ease'
                    }}
                  />
                </div>

                {/* 日期标签 - 霓虹风格 */}
                <div
                  style={{
                    marginTop: '12px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: hoveredIndex === index ? '#667eea' : 'rgba(255, 255, 255, 0.8)',
                    transition: 'all 0.3s ease',
                    textShadow: hoveredIndex === index ? '0 0 10px rgba(102, 126, 234, 0.8)' : 'none',
                    transform: hoveredIndex === index ? 'scale(1.1)' : 'scale(1)'
                  }}
                >
                  {item.date}
                </div>

                {/* 悬浮提示 - 霓虹风格 */}
                {hoveredIndex === index && hoveredData && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '100%',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      marginLeft: '20px',
                      background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.98), rgba(22, 33, 62, 0.98))',
                      border: '1px solid rgba(102, 126, 234, 0.5)',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      boxShadow: `
                        0 0 20px rgba(102, 126, 234, 0.6),
                        0 8px 32px rgba(0, 0, 0, 0.4),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1)
                      `,
                      backdropFilter: 'blur(20px)',
                      zIndex: 1000,
                      minWidth: '200px',
                      pointerEvents: 'none',
                      animation: 'tooltipFadeIn 0.3s ease-out',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {/* 左侧小三角指示器 - 发光效果 */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '-7px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 0,
                        height: 0,
                        borderTop: '7px solid transparent',
                        borderBottom: '7px solid transparent',
                        borderRight: '7px solid rgba(26, 26, 46, 0.98)',
                        filter: 'drop-shadow(-2px 0 8px rgba(102, 126, 234, 0.6))'
                      }}
                    />

                    <div style={{
                      fontWeight: 'bold',
                      marginBottom: '10px',
                      color: '#fff',
                      fontSize: '15px',
                      textShadow: '0 0 10px rgba(102, 126, 234, 0.8)',
                      borderBottom: '1px solid rgba(102, 126, 234, 0.3)',
                      paddingBottom: '8px'
                    }}>
                      📅 {hoveredData.date}
                    </div>
                    {Object.entries({
                      severe: hoveredData.severe,
                      major: hoveredData.major,
                      minor: hoveredData.minor,
                      trivial: hoveredData.trivial
                    }).map(([key, value]) => (
                      <div
                        key={key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px',
                          margin: '8px 0',
                          fontSize: '14px',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          background: 'rgba(102, 126, 234, 0.1)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '18px',
                            filter: `drop-shadow(0 0 4px ${colors[key as keyof typeof colors]})`
                          }}>
                            {icons[key as keyof typeof icons]}
                          </span>
                          <span style={{
                            color: colors[key as keyof typeof colors],
                            fontWeight: '600',
                            textShadow: `0 0 8px ${colors[key as keyof typeof colors]}80`
                          }}>
                            {names[key as keyof typeof names]}
                          </span>
                        </div>
                        <span style={{
                          fontWeight: 'bold',
                          color: colors[key as keyof typeof colors],
                          fontSize: '16px',
                          textShadow: `0 0 10px ${colors[key as keyof typeof colors]}`,
                          minWidth: '24px',
                          textAlign: 'right'
                        }}>
                          {value}
                        </span>
                      </div>
                    ))}
                    <div style={{
                      borderTop: '1px solid rgba(102, 126, 234, 0.3)',
                      marginTop: '10px',
                      paddingTop: '10px',
                      fontWeight: 'bold',
                      color: '#fff',
                      fontSize: '16px',
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))',
                      padding: '8px',
                      borderRadius: '6px',
                      textShadow: '0 0 15px rgba(102, 126, 234, 1)',
                      boxShadow: '0 0 10px rgba(102, 126, 234, 0.5)'
                    }}>
                      📊 总计: {hoveredData.total}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 图例 - 霓虹风格 */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        marginTop: '20px',
        flexWrap: 'wrap'
      }}>
        {Object.entries(colors).map(([key, color], index) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: `linear-gradient(135deg, ${color}20, ${color}10)`,
              borderRadius: '24px',
              border: `1px solid ${color}60`,
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: `0 0 10px ${color}40, 0 4px 12px rgba(0, 0, 0, 0.1)`,
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              animation: `legendFloat 3s ease-in-out ${index * 0.2}s infinite`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
              e.currentTarget.style.boxShadow = `0 0 20px ${color}80, 0 8px 20px rgba(0, 0, 0, 0.2)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = `0 0 10px ${color}40, 0 4px 12px rgba(0, 0, 0, 0.1)`;
            }}
          >
            <span style={{
              fontSize: '18px',
              filter: `drop-shadow(0 0 4px ${color})`
            }}>
              {icons[key as keyof typeof icons]}
            </span>
            <span style={{
              color,
              textShadow: `0 0 8px ${color}80`
            }}>
              {names[key as keyof typeof names]}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes tooltipFadeIn {
          from {
            opacity: 0;
            transform: translateY(-50%) translateX(-10px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) translateX(0) scale(1);
          }
        }

        @keyframes barGrow {
          from {
            height: 0 !important;
            opacity: 0;
            filter: blur(10px);
          }
          to {
            opacity: 1;
            filter: blur(0);
          }
        }

        @keyframes barPulse {
          0%, 100% {
            box-shadow:
              0 0 10px rgba(102, 126, 234, 0.5),
              0 4px 16px rgba(0, 0, 0, 0.3),
              inset 0 2px 4px rgba(255, 255, 255, 0.3);
          }
          50% {
            box-shadow:
              0 0 15px rgba(102, 126, 234, 0.7),
              0 4px 20px rgba(0, 0, 0, 0.4),
              inset 0 2px 6px rgba(255, 255, 255, 0.4);
          }
        }

        @keyframes legendFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
      `}</style>

    </div>
  );
};

export default DefectTimeChart;
