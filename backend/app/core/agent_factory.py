# 用于注册智能体
from venv import logger
from autogen_core import AgentRuntime, SingleThreadedAgentRuntime
from backend.app.core.llms import _deepseek_model_client



class AgentFactory:
    '''
    智能体工厂类，统一管理智能体的创建和注册
    '''
    def __init__(self) -> None:
        self._agent_classes: dict[str, type] = {}
        self._registered_agents: dict[str, bool] = {}
        self._assistant_agent_configs: dict[str, dict] = {}
        self._agents: dict[str, dict] = {} # 添加缺失的_agents输出

        # 注册所有可用的智能体类
        self._register_agent_classes()

        logger.info (f"智能体工厂类初始化完成")

    def _register_agent_classes(self) -> None:
        """注册所有可用的智能体类"""
        try:
            # 测试用例平台智能体
            from backend.app.agents.testcase.document_parse_agent import DocumentParseAgent
            from backend.app.agents.testcase.image_analysis_agent import ImageAnalysisAgent
            from backend.app.agents.testcase.test_case_generator_agent import TestCaseGeneratorAgent
            from backend.app.agents.testcase.mid_map_generation_agent import MidMapGenerationAgent
            from backend.app.agents.testcase.excel_export_agent import ExcelExportAgent

            # 注册测试用例平台智能体
            self._agent_classes.update({
                "document_parse": DocumentParseAgent,
                "image_analysis": ImageAnalysisAgent,
                "test_case_generator": TestCaseGeneratorAgent,
                "mid_map_generation": MidMapGenerationAgent,
                "excel_export": ExcelExportAgent
            })
            

            # 调试信息
            logger.info(f"注册的智能体类: {self._agent_classes}")
            logger.info(f"注册的智能体类数量: {len(self._agent_classes)}")

        except Exception as e:
            logger.error(f"智能体类注册失败: {str(e)}")



    async def register_agents(self, runtime: AgentRuntime) -> None:
        """注册智能体"""
        try:
            if agent_type not in self._agent_classes:
                raise ValueError(f"❌ 智能体类型 {agent_type} 不存在")
            
            agent_class = self._agent_classes[agent_type]

            # 注册智能体
            await agent_class.register(runtime, 
                                       agent_type,lambda:self.create_agent(agent_type,**kwargs))
        except Exception as e:
            print(f"❌ 智能体注册失败: {str(e)}")
            print(f"❌ 错误类型: {type(e)}")
            import traceback
            print(f"❌ 错误堆栈: {traceback.format_exc()}")

    async def register_agent_to_runtime(
            self, runtime: SingleThreadedAgentRuntime, 
            agent_type: str, 
            topic_type: str,
            **kwargs) -> None:
        """注册智能体到运行时

        Args:
            runtime (SingleThreadedAgentRuntime): 运行时
            agent_type (str): 智能体类型
            topic_type (str): 智能体主题类型
            kwargs (dict): 智能体构造参数
        """
        try:
            if agent_type not in self._agent_classes:
                raise ValueError(f"❌ 智能体类型 {agent_type} 不存在")
            
            agent_class = self._agent_classes[agent_type]

            # 注册智能体
            await agent_class.register(
                runtime, 
                agent_type,
                lambda: self.create_agent(agent_type, **kwargs)
            )

            # 记录注册信息
            self._agent[agent_type] = {
                "angent_type": agent_type,
                "topic_type": topic_type,
                "agent_name": AGENT_NAMES.get(agent_type, agent_type),
                "kwargs": kwargs
            }

        except Exception as e:
            print(f"❌ 智能体注册失败: {str(e)}")
            print(f"❌ 错误类型: {type(e)}")
            import traceback

    async def create_agent(self, 
                       agent_type: str, 
                       **kwargs) -> None:
    
        """创建自定义智能体"""
        try:
            if agent_type not in self._agent_classes:
                raise ValueError(f"❌ 智能体类型 {agent_type} 不存在")
            
            agent_class = self._agent_classes[agent_type]

            # 根据智能体类型选择模型客户端（完善？）

            if not kwargs.get('model_client_instance'):
                kwargs['model_client_instance'] = _deepseek_model_client()

            # 创建智能体实例

            agent = await agent_class(**kwargs)

            logger.info(f"智能体 {agent_type} 创建完成")
            return agent
        
        except Exception as e:
            print(f"❌ 智能体创建失败: {str(e)}")
            print(f"❌ 错误类型: {type(e)}")

    async def create_assistant_agent(self, **kwargs) -> None:
        pass

    async def register_agent(self,
                             angent_type: str,
                             agent_class: type,
                             **kwargs) -> None:
        """注册智能体"""
        self._agent_classes[agent_type] = agent_class
        self._agent_kwargs[agent_type] = kwargs
        pass
    