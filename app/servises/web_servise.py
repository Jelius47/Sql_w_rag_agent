import os
from dotenv import load_dotenv
from langchain_community.tools.tavily_search import TavilySearchResults

class SearchService:
    _instance = None
    
    def __new__(cls, max_results=2):
        if cls._instance is None:
            cls._instance = super(SearchService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self, max_results=2):
        if self._initialized:
            return
        load_dotenv()
        self.api_key = os.getenv("TAVILY_API_KEY")
        os.environ['TAVILY_API_KEY'] = self.api_key
        self.search_tool = TavilySearchResults(max_results=max_results)
        self._initialized = True
    
    @classmethod
    def search(cls, query):
        """Class method that handles the singleton instance internally"""
        instance = cls()
        try:
            result = instance.search_tool.invoke(query)
            return [("", result)]  # Format matching your expected response structure
        except Exception as e:
            return [("", {"error": str(e)})] 