# import os
# from typing import List, Tuple
# from ..utils.load_config import LoadConfig
# from sqlalchemy import create_engine, inspect
# import pandas as pd
# from sqlalchemy import create_engine, inspect

# APPCFG = LoadConfig()


# class ProcessFiles:
#     """
#     A class to process uploaded files, converting them to a SQL database format.

#     This class handles both CSV and XLSX files, reading them into pandas DataFrames and
#     storing each as a separate table in the SQL database specified by the application configuration.
#     """
#     def __init__(self, files_dir: List, chatbot: List) -> None:
#         """
#         Initialize the ProcessFiles instance.

#         Args:
#             files_dir (List): A list containing the file paths of uploaded files.
#             chatbot (List): A list representing the chatbot's conversation history.
#         """
#         APPCFG = LoadConfig()
#         self.files_dir = files_dir
#         self.chatbot = chatbot
#         db_path = APPCFG.uploaded_files_sqldb_directory
#         db_path = f"sqlite:///{db_path}"
#         self.engine = create_engine(db_path)
#         print("Number of uploaded files:", len(self.files_dir))

#     def _process_uploaded_files(self) -> Tuple:
#         """
#         Private method to process the uploaded files and store them into the SQL database.

#         Returns:
#             Tuple[str, List]: A tuple containing an empty string and the updated chatbot conversation list.
#         """
#         for file_dir in self.files_dir:
#             file_names_with_extensions = os.path.basename(file_dir)
#             file_name, file_extension = os.path.splitext(
#                 file_names_with_extensions)
#             if file_extension == ".csv":
#                 df = pd.read_csv(file_dir)
#             elif file_extension == ".xlsx":
#                 df = pd.read_excel(file_dir)
#             else:
#                 raise ValueError("The selected file type is not supported")
#             df.to_sql(file_name, self.engine, index=False)
#         print("==============================")
#         print("All csv/xlsx files are saved into the sql database.")
#         self.chatbot.append(
#             (" ", "Uploaded files are ready. Please ask your question"))
#         return "", self.chatbot

#     def _validate_db(self):
#         """
#         private method to validate that the SQL database has been updated correctly with the right tables.
#         """
#         insp = inspect(self.engine)
#         table_names = insp.get_table_names()
#         print("==============================")
#         print("Available table nasmes in created SQL DB:", table_names)
#         print("==============================")

#     def run(self):
#         """
#         public method to execute the file processing pipeline.

#         Includes steps for processing uploaded files and validating the database.

#         Returns:
#             Tuple[str, List]: A tuple containing an empty string and the updated chatbot conversation list.
#         """
#         input_txt, chatbot = self._process_uploaded_files()
#         self._validate_db()
#         return input_txt, chatbot


# class UploadFile:
#     """
#     A class that acts as a controller to run various file processing pipelines
#     based on the chatbot's current functionality when handling uploaded files.
#     """
#     @staticmethod
#     def run_pipeline(files_dir: List, chatbot: List, chatbot_functionality: str):
#         """
#         Run the appropriate pipeline based on chatbot functionality.

#         Args:
#             files_dir (List): List of paths to uploaded files.
#             chatbot (List): The current state of the chatbot's dialogue.
#             chatbot_functionality (str): A string specifying the chatbot's current functionality.

#         Returns:
#             Tuple: A tuple of an empty string and the updated chatbot list, or None if functionality not matched.
#         """
#         if chatbot_functionality == "Process files":
#             pipeline_instance = ProcessFiles(
#                 files_dir=files_dir, chatbot=chatbot)
#             input_txt, chatbot = pipeline_instance.run()
#             return input_txt, chatbot
#         else:
#             pass # Other functionalities can be implemented here.


# file_service.py - Service for handling file uploads

import pandas as pd
import uuid
import os
from sqlalchemy import create_engine, MetaData, Table, Column, inspect
from sqlalchemy.types import String, Float, Integer, DateTime, Boolean
import numpy as np
from ..database import SessionLocal, engine
from ..models import UploadedFile, User
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from werkzeug.datastructures import FileStorage  # Flask's file handling

class FileUploadService:
    def __init__(self):
        self.engine = engine
        
    def _determine_sql_type(self, dtype):
        """Convert pandas dtype to SQLAlchemy type."""
        if pd.api.types.is_integer_dtype(dtype):
            return Integer
        elif pd.api.types.is_float_dtype(dtype):
            return Float
        elif pd.api.types.is_datetime64_dtype(dtype):
            return DateTime
        elif pd.api.types.is_bool_dtype(dtype):
            return Boolean
        else:
            return String
    
    def _clean_column_name(self, name: str) -> str:
        """Convert column name to valid PostgreSQL column name."""
        # Replace spaces and special chars with underscore
        cleaned = ''.join(c if c.isalnum() else '_' for c in name)
        # Ensure it doesn't start with a number
        if cleaned and cleaned[0].isdigit():
            cleaned = 'col_' + cleaned
        return cleaned.lower()
    
    def process_file(self, file: FileStorage, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Process uploaded file and store in PostgreSQL."""
        # Create a temporary file
        temp_file_path = f"/tmp/{uuid.uuid4()}_{file.filename}"
        
        try:
            # Save to temp file
            file.save(temp_file_path)
            
            # Read file based on extension
            if file.filename.endswith('.csv'):
                df = pd.read_csv(temp_file_path)
            elif file.filename.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(temp_file_path)
            else:
                raise ValueError("Unsupported file format. Please upload CSV or Excel file.")
                
            # Clean column names
            df.columns = [self._clean_column_name(col) for col in df.columns]
            
            # Generate a unique table name
            table_name = f"uploaded_data_{uuid.uuid4().hex[:8]}"
            
            # Get column types
            column_types = {col: self._determine_sql_type(df[col].dtype) for col in df.columns}
            
            # Store data in PostgreSQL
            df.to_sql(
                name=table_name,
                con=self.engine,
                if_exists='fail',  # Fail if table already exists
                index=False,
                dtype=column_types
            )
            
            # Store metadata in UploadedFile table
            columns_info = {
                col: str(df[col].dtype) for col in df.columns
            }
            
            with SessionLocal() as db:
                uploaded_file = UploadedFile(
                    user_id=uuid.UUID(user_id) if user_id else None,
                    filename=file.filename,
                    file_type=file.filename.split('.')[-1],
                    rows_count=len(df),
                    columns=columns_info,
                    data_table_name=table_name
                )
                db.add(uploaded_file)
                db.commit()
                db.refresh(uploaded_file)
                
                # Return info about the upload
                return {
                    "status": "success",
                    "message": f"File {file.filename} uploaded successfully",
                    "file_id": str(uploaded_file.id),
                    "table_name": table_name,
                    "rows": len(df),
                    "columns": list(df.columns),
                    "preview": df.head(5).to_dict(orient="records")
                }
                
        except Exception as e:
            # Clean up in case of error
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            raise e
        finally:
            # Always clean up temp file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

    def query_file(self, file_id: str, query: str) -> Dict[str, Any]:
        """Run SQL query against an uploaded file."""
        with SessionLocal() as db:
            file_record = db.query(UploadedFile).filter(UploadedFile.id == uuid.UUID(file_id)).first()
            if not file_record:
                raise ValueError(f"File with ID {file_id} not found")
            
            # Execute query against the data table
            try:
                # Add safety check to ensure only SELECT statements are allowed
                if not query.strip().lower().startswith("select"):
                    raise ValueError("Only SELECT queries are allowed for security reasons")
                
                # Execute the query
                result = pd.read_sql(query, self.engine)
                
                return {
                    "status": "success",
                    "rows": len(result),
                    "data": result.to_dict(orient="records")
                }
            except Exception as e:
                raise ValueError(f"Query execution error: {str(e)}")