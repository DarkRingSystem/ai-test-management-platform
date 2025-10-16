from datetime import datetime
import uuid
from venv import logger
from autogen_core import BaseAgent, Image, MessageContext, TopicId, message_handler, type_subscription
from pydantic import BaseModel
from backend.app.core.llms import _get_uitars_model_client
from backend.app.models.test_case import ImageAnalysisRequest, ImageAnalysisResponse, TestCaseGenerationRequest, VideoAnalysisRequest


@type_subscription(topic_type="test_case_generator")
class TestCaseGeneratorAgent(BaseAgent):
    # 初始化智能体
    def __init__(self, model_client_instance=None,gent_factory=None,
                **kwargs):
        pass
    
    # 使用装饰器激活启用该方法，使用该方法进行消息传递
    @message_handler
    async def handle_test_case_generation_request(
        self,
        message: TestCaseGenerationRequest,
        ctx: MessageContext
    ) -> None:
        
        try:
            logger.info(f"开始生成用例: {message.session_id}")
            
            # 发送反馈消息到前端
            await self.send_response(
                f"开始生成用例: {message.image_name}",
                region="process"
                )

            # 调用方法开始生成用例
            analysis_result = await self._analyze_image(message)

            # 调用方法，将图片分析结果包装成下一个智能体的请求发送到下一个智能体
            test_cases = await self._generate_test_cases_from_image(analysis_result,message)

            # 构建响应
            response = ImageAnalysisResponse(
                session_id=message.session_id,
                image_name=message.image_name,
                image_id=str(uuid.uuid4()),
                analysis_result=analysis_result.model_dump(),
                test_cases=test_cases,
                processing_time=0.0,
                created_at=datetime.now().isoformat()
            )

            # 发送反馈消息到前端
            await self.send_response(
                f"图片分析完成: {message.image_name}",
                region="result"
            ), 

            # 发送到测试用例生成智能体
            test_case_request = TestCaseGenerationRequest(
                session_id=message.session_id,
                source_type="image",
                source_data=response.model_dump(),
                generation_cinfig={}
            )
            
            # 发送测试内容请求消息到用例生成主题
            await self.publish_message(
                test_case_request,
                topic_id=TopicId("test_case_generator"),
                source=self.agent_id
            )
            logger.info(f"图片分析请求处理完成,接下来由测试用例生成智能体团队处理: {message.session_id}")
            
        except Exception as e:
            logger.error(f"图片分析请求处理失败: {message.session_id}, 错误: {str(e)}")


    # 分析图片方法，加入图片格式校验
    async def _analyze_image(self, message: ImageAnalysisRequest) -> Any:
        """分析图片"""
        try:

            image_path = message.image_path
            image_extension = image_path.split(".")[-1] = Image.from_file(image_path)
            if image_extension not in ["jpg", "jpeg", "png", "gif", "bmp", "webp", "ico", "tiff", "svg", "heic", "heif"]:
                raise ValueError(f"不支持的图片格式: {image_extension}")    
            
            # 发送消息到前端
            await self.send_response(
                f"开始分析图片: {message.image_name}",
                region="process"
                )
            
            # 调用方法分析图片内容
            analysis_result = await self._analy_image_content(image_path,message)


            return analysis_result
        except Exception as e:
            logger.error(f"图片分析失败: {str(e)}")
            raise e

    # 
    async def _analy_image_content(self, image_path: str, message: ImageAnalysisRequest) -> None:

        try:

            # 获取UI-TARS模型客户端用于图像分析
            uitars_model_client = _get_uitars_model_client()

            # 使用AgentFactory创建图形分析智能体
            agent = await self.agent_factory.create_agent(
                agent_type="image_analysis",
                model_client_instance= uitars_model_client
            )

            # 加载图片
            image = Image.from_file(image_path)

            # 调用智能体实例分析图片
            analysis_result = await agent.run(task=message.image_path)

            return analysis_result
        except Exception as e:
            logger.error(f"图片分析失败: {str(e)}")
            raise e