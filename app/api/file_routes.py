# app/api/file_routes.py

from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
import uuid
import pandas as pd
from ..servises.file_servise import FileUploadService
file_bp = Blueprint('file_bp', __name__, url_prefix='/file')
file_service = FileUploadService()

@file_bp.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    allowed_extensions = {'csv', 'xlsx', 'xls'}
    if not file.filename.lower().endswith(tuple(f'.{ext}' for ext in allowed_extensions)):
        return jsonify({"error": f"File type not allowed. Please upload {', '.join(allowed_extensions)}"}), 400
    
    try:
        user_id = request.form.get('user_id')
        result = file_service.process_file(file, user_id)
        
        # Format markdown response
        markdown_response = f"""
## File Upload Successful

**Filename**: {file.filename}
**Rows**: {result['rows']}
**Table Name**: {result['table_name']}

### Columns
{', '.join(result['columns'])}

### Data Preview
```
{pd.DataFrame(result['preview']).to_markdown()}
```

You can now query this data using SQL.
"""
        
        return jsonify({
            "status": "success",
            "message": f"File {file.filename} uploaded successfully",
            "response": markdown_response,
            "raw_data": result
        })
        
    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": f"Error processing file: {str(e)}"
        }), 500
