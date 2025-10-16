#智能体基类


from abc import ABC
from autogen_core import RoutedAgent


class BaseAgent(RoutedAgent,ABC):

    pass

    def __init__(self,
                 agent_id: str,
                 agent_name: str,
                 model_client_instance=None,
                 collector: Optional[StreamResponseCollector] = None,
                **kwargs):
        pass

    async def handle_message(self, message, source):
        pass
