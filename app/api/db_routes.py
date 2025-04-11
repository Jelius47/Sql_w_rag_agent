from flask import Blueprint, request, jsonify
from ..agent_graph.tool_chinook_sqlagent import query_postgres_db  # converts human language to SQL and executes

db_bp = Blueprint('db_bp', __name__, url_prefix='/db')


@db_bp.route('/query', methods=['POST'])
def query_db():
    query = request.json.get('query')  # natural language query

    if not query:
        return jsonify({"error": "Missing query"}), 400

    try:
        # Convert natural language to SQL and execute
        result = query_postgres_db(query)

        return jsonify({
                "status": "success",
                "result": result
            })
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
