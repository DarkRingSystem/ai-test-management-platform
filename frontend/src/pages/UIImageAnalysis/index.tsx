import React, { useState, useRef } from 'react';
import {
  Card,
  Upload,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Image,
  Tag,
  Spin,
  message,
  Empty,
  Divider,
  Progress,
  List,
  Avatar
} from 'antd';
import {
  UploadOutlined,
  PictureOutlined,
  DeleteOutlined,
  ExperimentOutlined,
  EyeOutlined,
  DownloadOutlined,
  FileImageOutlined
} from '@ant-design/icons';
import { useUserStore } from '../../utils/store';
import './index.css';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

interface UploadedImage {
  uid: string;
  name: string;
  size: number;
  url: string;
  file: File;
  analysis?: ImageAnalysis;
  analyzing?: boolean;
}

interface ImageAnalysis {
  elements: UIElement[];
  layout: LayoutInfo;
  suggestions: string[];
  accessibility: AccessibilityInfo;
}

interface UIElement {
  id: string;
  type: string;
  text?: string;
  position: { x: number; y: number; width: number; height: number };
  properties: Record<string, any>;
}

interface LayoutInfo {
  width: number;
  height: number;
  density: string;
  orientation: string;
}

interface AccessibilityInfo {
  score: number;
  issues: string[];
  recommendations: string[];
}

const UIImageAnalysis: React.FC = () => {
  const { user } = useUserStore();
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<any>(null);

  // 处理图片上传
  const handleImageUpload = (file: File) => {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      message.error('请上传图片文件');
      return false;
    }

    // 检查文件大小（限制为10MB）
    if (file.size > 10 * 1024 * 1024) {
      message.error('图片大小不能超过10MB');
      return false;
    }

    // 创建图片URL
    const imageUrl = URL.createObjectURL(file);
    
    const uploadedImage: UploadedImage = {
      uid: Date.now().toString(),
      name: file.name,
      size: file.size,
      url: imageUrl,
      file: file
    };

    setUploadedImages(prev => [...prev, uploadedImage]);
    message.success(`图片 "${file.name}" 上传成功`);
    
    return false; // 阻止默认上传行为
  };

  // 删除图片
  const handleRemoveImage = (uid: string) => {
    const image = uploadedImages.find(img => img.uid === uid);
    if (image) {
      URL.revokeObjectURL(image.url);
    }
    setUploadedImages(prev => prev.filter(img => img.uid !== uid));
    if (selectedImage?.uid === uid) {
      setSelectedImage(null);
    }
  };

  // 分析图片
  const handleAnalyzeImage = async (image: UploadedImage) => {
    setAnalyzing(true);
    
    // 更新图片状态为分析中
    setUploadedImages(prev => 
      prev.map(img => 
        img.uid === image.uid 
          ? { ...img, analyzing: true }
          : img
      )
    );

    try {
      // TODO: 这里将调用UI图片分析的API
      // 暂时模拟分析结果
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockAnalysis: ImageAnalysis = {
        elements: [
          {
            id: '1',
            type: 'button',
            text: '登录',
            position: { x: 100, y: 200, width: 80, height: 40 },
            properties: { color: '#1890ff', clickable: true }
          },
          {
            id: '2',
            type: 'input',
            text: '用户名',
            position: { x: 50, y: 100, width: 200, height: 32 },
            properties: { placeholder: '请输入用户名', required: true }
          },
          {
            id: '3',
            type: 'input',
            text: '密码',
            position: { x: 50, y: 150, width: 200, height: 32 },
            properties: { type: 'password', required: true }
          }
        ],
        layout: {
          width: 375,
          height: 667,
          density: '2x',
          orientation: 'portrait'
        },
        suggestions: [
          '建议增加表单验证提示',
          '按钮颜色对比度可以提高',
          '输入框间距可以适当增加'
        ],
        accessibility: {
          score: 85,
          issues: ['缺少alt文本', '颜色对比度不足'],
          recommendations: ['添加无障碍标签', '提高颜色对比度']
        }
      };

      // 更新分析结果
      setUploadedImages(prev => 
        prev.map(img => 
          img.uid === image.uid 
            ? { ...img, analysis: mockAnalysis, analyzing: false }
            : img
        )
      );

      message.success('图片分析完成');
    } catch (error) {
      console.error('图片分析失败:', error);
      message.error('图片分析失败，请重试');
      
      // 清除分析状态
      setUploadedImages(prev => 
        prev.map(img => 
          img.uid === image.uid 
            ? { ...img, analyzing: false }
            : img
        )
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="ui-image-analysis-container">
      <Row gutter={[24, 24]}>
        {/* 左侧：图片上传和列表 */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <PictureOutlined style={{ color: '#1890ff' }} />
                <span>图片上传</span>
              </Space>
            }
            className="upload-card"
          >
            {/* 拖拽上传区域 */}
            <Dragger
              beforeUpload={handleImageUpload}
              showUploadList={false}
              multiple
              accept="image/*"
              className="image-dragger"
            >
              <p className="ant-upload-drag-icon">
                <FileImageOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
              <p className="ant-upload-hint">
                支持 JPG、PNG、GIF、WebP 等格式，单个文件不超过10MB
              </p>
            </Dragger>

            <Divider />

            {/* 已上传图片列表 */}
            <div className="uploaded-images">
              <Title level={5}>已上传图片 ({uploadedImages.length})</Title>
              
              {uploadedImages.length === 0 ? (
                <Empty 
                  description="暂无上传的图片"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <List
                  dataSource={uploadedImages}
                  renderItem={(image) => (
                    <List.Item
                      className={`image-item ${selectedImage?.uid === image.uid ? 'selected' : ''}`}
                      onClick={() => setSelectedImage(image)}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            src={image.url} 
                            size={48}
                            shape="square"
                            icon={<PictureOutlined />}
                          />
                        }
                        title={
                          <Space>
                            <Text ellipsis style={{ maxWidth: 120 }}>
                              {image.name}
                            </Text>
                            {image.analysis && (
                              <Tag color="green">已分析</Tag>
                            )}
                            {image.analyzing && (
                              <Tag color="blue">分析中</Tag>
                            )}
                          </Space>
                        }
                        description={
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {formatFileSize(image.size)}
                          </Text>
                        }
                      />
                      <Space>
                        <Button
                          type="text"
                          size="small"
                          icon={<ExperimentOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnalyzeImage(image);
                          }}
                          loading={image.analyzing}
                          disabled={analyzing}
                        >
                          分析
                        </Button>
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          danger
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(image.uid);
                          }}
                        />
                      </Space>
                    </List.Item>
                  )}
                />
              )}
            </div>
          </Card>
        </Col>

        {/* 右侧：图片预览和分析结果 */}
        <Col xs={24} lg={16}>
          {selectedImage ? (
            <Card
              title={
                <Space>
                  <EyeOutlined style={{ color: '#1890ff' }} />
                  <span>图片分析</span>
                  <Text type="secondary">- {selectedImage.name}</Text>
                </Space>
              }
              extra={
                <Space>
                  <Button
                    type="primary"
                    icon={<ExperimentOutlined />}
                    onClick={() => handleAnalyzeImage(selectedImage)}
                    loading={selectedImage.analyzing}
                    disabled={analyzing}
                  >
                    重新分析
                  </Button>
                </Space>
              }
              className="analysis-card"
            >
              <Row gutter={[16, 16]}>
                {/* 图片预览 */}
                <Col xs={24} md={12}>
                  <div className="image-preview">
                    <Image
                      src={selectedImage.url}
                      alt={selectedImage.name}
                      style={{ maxWidth: '100%', maxHeight: '400px' }}
                      preview={{
                        mask: <EyeOutlined />
                      }}
                    />
                  </div>
                </Col>

                {/* 分析结果 */}
                <Col xs={24} md={12}>
                  {selectedImage.analyzing ? (
                    <div className="analyzing-state">
                      <Spin size="large" />
                      <Title level={4} style={{ marginTop: 16 }}>
                        正在分析图片...
                      </Title>
                      <Progress percent={60} status="active" />
                      <Text type="secondary">
                        正在识别UI元素和布局结构
                      </Text>
                    </div>
                  ) : selectedImage.analysis ? (
                    <div className="analysis-results">
                      <Title level={4}>分析结果</Title>
                      
                      {/* 基本信息 */}
                      <div className="basic-info">
                        <Title level={5}>基本信息</Title>
                        <Space direction="vertical" size="small">
                          <Text>尺寸: {selectedImage.analysis.layout.width} × {selectedImage.analysis.layout.height}</Text>
                          <Text>密度: {selectedImage.analysis.layout.density}</Text>
                          <Text>方向: {selectedImage.analysis.layout.orientation}</Text>
                        </Space>
                      </div>

                      <Divider />

                      {/* UI元素 */}
                      <div className="ui-elements">
                        <Title level={5}>识别的UI元素 ({selectedImage.analysis.elements.length})</Title>
                        <Space wrap>
                          {selectedImage.analysis.elements.map((element) => (
                            <Tag key={element.id} color="blue">
                              {element.type}: {element.text || '无文本'}
                            </Tag>
                          ))}
                        </Space>
                      </div>

                      <Divider />

                      {/* 无障碍评分 */}
                      <div className="accessibility-score">
                        <Title level={5}>无障碍评分</Title>
                        <Progress 
                          percent={selectedImage.analysis.accessibility.score} 
                          status={selectedImage.analysis.accessibility.score >= 80 ? 'success' : 'normal'}
                          format={percent => `${percent}分`}
                        />
                      </div>

                      <Divider />

                      {/* 优化建议 */}
                      <div className="suggestions">
                        <Title level={5}>优化建议</Title>
                        <List
                          size="small"
                          dataSource={selectedImage.analysis.suggestions}
                          renderItem={(suggestion) => (
                            <List.Item>
                              <Text>• {suggestion}</Text>
                            </List.Item>
                          )}
                        />
                      </div>
                    </div>
                  ) : (
                    <Empty
                      description="点击左侧分析按钮开始分析图片"
                      image={<ExperimentOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
                    />
                  )}
                </Col>
              </Row>
            </Card>
          ) : (
            <Card className="empty-selection">
              <Empty
                description="请选择要分析的图片"
                image={<PictureOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
              />
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default UIImageAnalysis;
