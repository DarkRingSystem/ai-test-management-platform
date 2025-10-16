# 用于编排智能体
from venv import logger
from autogen_core import SingleThreadedAgentRuntime, TopicId


class TestCaseOrchestrator:
    async def _initialize_runtime(self, session_id: str) -> None:
        """初始化运行时"""
        try:
            if self.runtime is None:
                self.runtime = SingleThreadedAgentRuntime()   #分布式部署智能体时修改此参数
            
            # 注册所有测试用例相关智能体
            await self._register_test_case_agents()

            # 注册流式响应搜集器
            await self.agent_factory.register_register_stream_collector(
                runtime = self.runtime,
                collector = self.response_collector
            )

            # 启动运行时
            self.runtime.start()

            logger.info(f"运行时初始化完成: {session_id}")

        except Exception as e:
            logger.error(f"运行时初始化失败: {str(e)}")
            raise e

    async def _register_test_case_agents(self) -> None:
        """注册所有测试用例相关智能体"""

        # 注册测试用例生成智能体
        await self.agent_factory.register_agent_to_runtime(
            self.runtime, 
            agent_type="test_case_generator"
            topic_type=TopicId("test_case_generator")
        
        logger.info(f"测试用例生成智能体注册完成")

        # 注册文档分析智能体
        await self.agent_factory.register_agent_to_runtime(
            self.runtime, 
            agent_type="document_parse"
            topic_type=TopicId("document_parse")
        )
        logger.info(f"文档分析智能体注册完成")

        # 注册图片分析智能体
        await self.agent_factory.register_agent_to_runtime(
            self.runtime, 
            agent_type="image_analysis"
            topic_type=TopicId("image_analysis")
        )
        logger.info(f"图片分析智能体注册完成")

        # 注册思维导图生成智能体
        await self.agent_factory.register_agent_to_runtime(
            self.runtime, 
            agent_type="mid_map_generation"
            topic_type=TopicId("mid_map_generation")
        )
        logger.info(f"思维导图生成智能体注册完成")

        # 注册Excel导出智能体
        await self.agent_factory.register_agent_to_runtime(
            self.runtime, 
            agent_type="excel_export"
            topic_type=TopicId("excel_export")
        )        
        logger.info(f"Excel导出智能体注册完成")



    async def parse_document(self, request: DocumentParseRequest) -> None:
        try:
            """
            解析文档，并生成测试用例

            智能体消息流：
            1. DocumentParseRequest 到 document_parse 智能体
            2. DocumentParseAgent 分析文档内容
            3. ocumentParseAgent 发送 TestCaseGeneratorRequest 到 test_case_generator 智能体
            4. test_case_generator 智能体生成并保存测试用例
            5. test_case_generator 发送MidMapGenertionRequest 到 mid_map_generation 智能体
            6. mid_map_generation 智能体生成并保存思维导图
            
            Args:
                request (DocumentParseRequest): 图片分析请求

            """

            logger.info(f"图片分析工作流启动: {request.session_id}")
            # 初始化运行时
            await self._initialize_runtime(request.session_id)

            # 发送到文档分析智能体
            await self.runtime.publish_message(
                request.image, 
                topic_id=TopicId("document_parse"),
                source="user"
            )

            logger.info(f"文档分析工作流启动完成: {request.session_id}")
        
        except Exception as e:
            logger.error(f"文档分析工作流启动失败: {str(e)}")
            raise e   

    async def analyze_image(self, request: ImageAnalysisRequest) -> None:
        try:
            """
            解析图片，并生成测试用例

            智能体消息流：
            1. 发送ImageAnalysisRequest到 image_analysis 智能体
            2. ImaageAnalyerAgent分析图片内容
            3. ImageAnalyerAgent 发送 TestCaseGeneratorRequest 到 test_case_generator 智能体
            4. test_case_generator 智能体生成并保存测试用例
            5. test_case_generator 发送MidMapGenertionRequest 到 mid_map_generation 智能体
            6. mid_map_generation 智能体生成并保存思维导图
            
            Args:
                request (ImageAnalysisRequest): 图片分析请求

            """
            logger.info(f"图片分析工作流启动: {request.session_id}")

        # 初始化运行时
            await self._initialize_runtime(request.session_id)

            # 发送到图片分析智能体
            await self.runtime.publish_message(
                request.image, 
                topic_id=TopicId("image_analysis"),
                source="user"
            )

            logger.info(f"图片分析工作流启动完成: {request.session_id}")
        
        except Exception as e:
            logger.error(f"图片分析工作流启动失败: {str(e)}")
            raise e