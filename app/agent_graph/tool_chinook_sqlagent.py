from typing import List
from langchain_openai import ChatOpenAI
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain.chains.openai_tools import create_extraction_chain_pydantic
from langchain_community.utilities import SQLDatabase
from langchain.chains import create_sql_query_chain
from langchain_core.runnables import RunnablePassthrough
from operator import itemgetter
from langchain_core.tools import tool
from .load_tools_config import LoadToolsConfig
from dotenv import load_dotenv
import os

load_dotenv()

TOOLS_CFG = LoadToolsConfig()

POSTGRES_URI = os.getenv("POSTGRES_URI")
if not POSTGRES_URI:
    raise ValueError("POSTGRES_URI environment variable not set.")


class Table(BaseModel):
    name: str = Field(description="Name of table in SQL database.")


def get_tables(categories: List[Table]) -> List[str]:
    return [category.name for category in categories]


class PostgresSQLAgent:
    def __init__(self, llm: str, llm_temperature: float) -> None:
        self.sql_agent_llm = ChatOpenAI(
            model=llm, temperature=llm_temperature
        )

        self.db = SQLDatabase.from_uri(POSTGRES_URI)
        print("Connected tables:", self.db.get_usable_table_names())

        category_chain_system = (
            "Return only the names of the SQL tables relevant to the user's question. "
            "Return valid SQL table names exactly as they appear in the database."
        )
        category_chain = create_extraction_chain_pydantic(
            Table, self.sql_agent_llm, system_message=category_chain_system
        )

        table_chain = {"input": itemgetter("question")} | category_chain | get_tables
        query_chain = create_sql_query_chain(self.sql_agent_llm, self.db)

        self.full_chain = RunnablePassthrough.assign(
            table_names_to_use=table_chain
        ) | query_chain


@tool
def query_postgres_db(query: str) -> str:
    """Query the PostgreSQL SQL Database. Input should be a natural language question."""
    agent = PostgresSQLAgent(
        llm=TOOLS_CFG.chinook_sqlagent_llm,
        llm_temperature=TOOLS_CFG.chinook_sqlagent_llm_temperature
    )
    sql_query = agent.full_chain.invoke({"question": query})
    return agent.db.run(sql_query)
