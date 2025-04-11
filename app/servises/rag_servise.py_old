# import os
# from typing import List, Tuple
# from utils.load_config import LoadConfig
# from langchain_community.utilities import SQLDatabase
# from langchain.chains import create_sql_query_chain
# from langchain_community.tools.sql_database.tool import QuerySQLDataBaseTool
# from langchain_core.prompts import PromptTemplate
# from langchain_core.output_parsers import StrOutputParser
# from langchain_core.runnables import RunnablePassthrough
# from operator import itemgetter
# from sqlalchemy import create_engine
# from langchain_community.agent_toolkits import create_sql_agent
# import langchain
# langchain.debug = True

# APPCFG = LoadConfig()


# class ChatBot:
#     """
#     A ChatBot class capable of responding to messages using different modes of operation.
#     It can interact with SQL databases, leverage language chain agents for Q&A,
#     and use embeddings for Retrieval-Augmented Generation (RAG) with ChromaDB.
#     """
#     @staticmethod
#     def respond(chatbot: List, message: str, chat_type: str, app_functionality: str) -> Tuple:
#         """
#         Respond to a message based on the given chat and application functionality types.

#         Args:
#             chatbot (List): A list representing the chatbot's conversation history.
#             message (str): The user's input message to the chatbot.
#             chat_type (str): Describes the type of the chat (interaction with SQL DB or RAG).
#             app_functionality (str): Identifies the functionality for which the chatbot is being used (e.g., 'Chat').

#         Returns:
#             Tuple[str, List, Optional[Any]]: A tuple containing an empty string, the updated chatbot conversation list,
#                                              and an optional 'None' value. The empty string and 'None' are placeholder
#                                              values to match the required return type and may be updated for further functionality.
#                                              Currently, the function primarily updates the chatbot conversation list.
#         """
#         if app_functionality == "Chat":
#             # If we want to use langchain agents for Q&A with our SQL DBs that was created from .sql files.
#             if chat_type == "Q&A with stored SQL-DB":
#                 # directories
#                 if os.path.exists(APPCFG.sqldb_directory):
#                     db = SQLDatabase.from_uri(
#                         f"sqlite:///{APPCFG.sqldb_directory}")
#                     execute_query = QuerySQLDataBaseTool(db=db)
#                     write_query = create_sql_query_chain(
#                         APPCFG.langchain_llm, db)
#                     answer_prompt = PromptTemplate.from_template(
#                         APPCFG.agent_llm_system_role)
#                     answer = answer_prompt | APPCFG.langchain_llm | StrOutputParser()
#                     chain = (
#                         RunnablePassthrough.assign(query=write_query).assign(
#                             result=itemgetter("query") | execute_query
#                         )
#                         | answer
#                     )
#                     response = chain.invoke({"question": message})

#                 else:
#                     chatbot.append(
#                         (message, f"SQL DB does not exist. Please first create the 'sqldb.db'."))
#                     return "", chatbot, None
#             # If we want to use langchain agents for Q&A with our SQL DBs that were created from CSV/XLSX files.
#             elif chat_type == "Q&A with Uploaded CSV/XLSX SQL-DB" or chat_type == "Q&A with stored CSV/XLSX SQL-DB":
#                 if chat_type == "Q&A with Uploaded CSV/XLSX SQL-DB":
#                     if os.path.exists(APPCFG.uploaded_files_sqldb_directory):
#                         engine = create_engine(
#                             f"sqlite:///{APPCFG.uploaded_files_sqldb_directory}")
#                         db = SQLDatabase(engine=engine)
#                         print(db.dialect)
#                     else:
#                         chatbot.append(
#                             (message, f"SQL DB from the uploaded csv/xlsx files does not exist. Please first upload the csv files from the chatbot."))
#                         return "", chatbot, None
#                 elif chat_type == "Q&A with stored CSV/XLSX SQL-DB":
#                     if os.path.exists(APPCFG.stored_csv_xlsx_sqldb_directory):
#                         engine = create_engine(
#                             f"sqlite:///{APPCFG.stored_csv_xlsx_sqldb_directory}")
#                         db = SQLDatabase(engine=engine)
#                     else:
#                         chatbot.append(
#                             (message, f"SQL DB from the stored csv/xlsx files does not exist. Please first execute `src/prepare_csv_xlsx_sqlitedb.py` module."))
#                         return "", chatbot, None
#                 print(db.dialect)
#                 print(db.get_usable_table_names())
#                 agent_executor = create_sql_agent(
#                     APPCFG.langchain_llm, db=db, agent_type="openai-tools", verbose=True)
#                 response = agent_executor.invoke({"input": message})
#                 response = response["output"]

#             elif chat_type == "RAG with stored CSV/XLSX ChromaDB":
#                 # response = APPCFG.azure_openai_client.embeddings.create(
#                 #     input=message,
#                 #     model=APPCFG.embedding_model_name
#                 # )
#                 response_embedings =APPCFG.embedding_model.embed_query(message)
#                 query_embeddings = response_embedings
#                 vectordb = APPCFG.chroma_client.get_collection(
#                     name=APPCFG.collection_name)
#                 results = vectordb.query(
#                     query_embeddings=query_embeddings,
#                     n_results=APPCFG.top_k
#                 )
#                 prompt = f"User's question: {message} \n\n Search results:\n {results}"

#                 messages = [
#                     {"role": "system", "content": str(
#                         APPCFG.rag_llm_system_role
#                     )},
#                     {"role": "user", "content": prompt}
#                 ]
#                 llm_response = APPCFG.azure_openai_client.chat.completions.create(
#                     model=APPCFG.model_name,
#                     messages=messages
#                 )
#                 response = llm_response.choices[0].message.content

#             # Get the `response` variable from any of the selected scenarios and pass it to the user.
#             chatbot.append(
#                 (message, response))
#             return "", chatbot
#         else:
#             pass


from typing import List, Tuple
from ..configs.load_config import LoadProjectConfig
from ..agent_graph.load_tools_config import LoadToolsConfig
from ..agent_graph.build_full_graph import build_graph
from ..utils.app_utils import create_directory
from ..utils.memory import Memory
from langchain_core.messages import HumanMessage



URL = "https://github.com/Farzad-R/LLM-Zero-to-Hundred/tree/master/RAG-GPT"
hyperlink = f"[RAG-GPT user guideline]({URL})"

PROJECT_CFG = LoadProjectConfig()
TOOLS_CFG = LoadToolsConfig()

graph = build_graph()
config = {"configurable": {"thread_id": TOOLS_CFG.thread_id}}

create_directory("memory")


class ChatBot:
    """
    A class to handle chatbot interactions by utilizing a pre-defined agent graph. The chatbot processes
    user messages, generates appropriate responses, and saves the chat history to a specified memory directory.

    Attributes:
        config (dict): A configuration dictionary that stores specific settings such as the `thread_id`.

    Methods:
        respond(chatbot: List, message: str) -> Tuple:
            Processes the user message through the agent graph, generates a response, appends it to the chat history,
            and writes the chat history to a file.
    """
    @staticmethod
    def respond(chatbot: List, message: str) -> Tuple:
        """
        Processes a user message using the agent graph, generates a response, and appends it to the chat history.
        The chat history is also saved to a memory file for future reference.

        Args:
            chatbot (List): A list representing the chatbot conversation history. Each entry is a tuple of the user message and the bot response.
            message (str): The user message to process.

        Returns:
            Tuple: Returns an empty string (representing the new user input placeholder) and the updated conversation history.
        """
        # The config is the **second positional argument** to stream() or invoke()!
        if not isinstance(message, str) or not message.strip():
            raise ValueError("Invalid message format. Message must be a non-empty string.")

        events = graph.stream(
            {"messages": [HumanMessage(content=message)]}, config, stream_mode="values"
        )
        for event in events:
            event["messages"][-1].pretty_print()

        chatbot.append(
            (message, event["messages"][-1].content))

        Memory.write_chat_history_to_file(
            gradio_chatbot=chatbot, folder_path=PROJECT_CFG.memory_dir, thread_id=TOOLS_CFG.thread_id)
        return "", chatbot
