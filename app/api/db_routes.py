from flask import Blueprint, request, jsonify
from ..agent_graph.tool_chinook_sqlagent import query_chinook_sqldb

db_bp = Blueprint('db_bp', __name__, url_prefix='/db')

@db_bp.route('/query', methods=['POST'])
def query_db():
    query = request.json.get('query')
    result = query_chinook_sqldb(query)
    return jsonify(result)
