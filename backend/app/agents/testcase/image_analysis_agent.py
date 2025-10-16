"""
图片分析智能体
"""
from datetime import datetime
import uuid
from venv import logger
from autogen_core import BaseAgent, Image, MessageContext, TopicId, message_handler, type_subscription
from backend.app.core.llms import _get_uitars_model_client
from backend.app.models.test_case import ImageAnalysisRequest, ImageAnalysisResponse, TestCaseGenerationRequest


@type_subscription(topic_type="image_analysis")
class ImageAnalyzerAgent(BaseAgent):
    # 初始化智能体
    def __init__(self, model_client_instance=None,
                **kwargs):
        pass
    
    # 使用装饰器激活启用该方法，使用该方法进行消息传递
    @message_handler
    async def handle_image_analysis_request(
        self,
        message: ImageAnalysisRequest,
        ctx: MessageContext
    ) -> None:
        
        try:
            logger.info(f"开始处理图片分析请求: {message.session_id}")
            
            # 发送反馈消息到前端
            await self.send_response(
                f"开始分析图片: {message.image_name}",
                region="process"
                )

            # 调用方法开始分析图片
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

    # 将图片分析结果发送给测试用例生成智能体    
    async def _generate_test_cases_from_image(self, analysis_result: Any, response: ImageAnalysisRequest) -> List[TestCase]:
        '''发送到测试用例生成智能体'''
        try:
            generation_request = TestCaseGenerationRequest(
                session_id=response.session_id,
                source_type="image",
                source_data=response.model_dump()
                test_cases=response.test_cases,
                generation_config={
                    "auto_save": True,
                    "generate_mind_map": True
                }
            )
        pass

    async def _analy_image_content(self, image_path: str, message: ImageAnalysisRequest) -> None:

        try:
            # 创建多模态分析智能体
            agent = await self.agent_factory.create_agent(
                agent_type="image_analysis",
                model_client_instance=self._get_uitars_model_client
            )
            # 调用智能体实例分析图片
            analysis_result = await agent.run(task=message.image_path)

            # 流式输出发送到前端
            async for event in agent.run_stream(task=message.image_path):
                if isinstance(event, ModelClientStreamingChunkEvent):
                    if hasattr(event, 'content') and hasattr(event, 'source'):
                        chunk_content = event.content
                        if chunk_content:
                            await self.send_response(
                                f"图片分析中: {chunk_content}",
                                region="process"
                                )
            # TaskResult内容提取出来保存发给下一个智能体
                if isinstance(event, TaskResult):
                    if hasattr(event, 'messages') and hasattr(event, 'stop_reason'):
                        final_message = event.messages[-1]
                        if hasattr(final_message, 'content'):
                            analysis_result = final_message.content

                return analysis_result
        except Exception as e:
            logger.error(f"图片分析失败: {str(e)}")
            raise e



