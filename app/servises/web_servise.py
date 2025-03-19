import os
from dotenv import load_dotenv
from langchain_community.tools.tavily_search import TavilySearchResults


class SearchService:
    def __init__(self, max_results=2):
        load_dotenv()  # Load environment variables from .env file
        self.api_key = os.getenv("TAVILY_API_KEY")
        os.environ['TAVILY_API_KEY'] = self.api_key  # Set for Tavily usage
        self.search_tool = TavilySearchResults(max_results=max_results)

    def search(self, query):
        try:
            result = self.search_tool.invoke(query)
            return {"status": "success", "data": result}
        except Exception as e:
            return {"status": "error", "message": str(e)}

# Example Usage:
if __name__ == "__main__":
    search_service = SearchService(max_results=2)
    response = search_service.search("What's a 'node' in LangGraph?")
    print(response)
