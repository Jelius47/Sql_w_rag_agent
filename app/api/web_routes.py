from flask import Blueprint, request, jsonify
from ..servises.web_servise  import SearchService

web_bp = Blueprint('web_bp', __name__, url_prefix='/web')

@web_bp.route('/search', methods=['POST'])
def web_search():
    print("Incoming request data:", request.json)  # Debug log
    data = request.get_json()
    
    if not data or 'query' not in data:
        print("Missing query parameter")  # Debug log
        return jsonify({"error": "Missing query parameter"}), 400
    
    query = data['query'].strip()
    print("Processing query:", query)  # Debug log
    
    if not query:
        print("Empty query received")  # Debug log
        return jsonify({"error": "Query cannot be empty"}), 400
    
    try:
        result = SearchService.search(query)
        print("Search results:", result)  # Debug log
        return jsonify({
            "status": "success",
            "result": result
        })
    except Exception as e:
        print("Search error:", str(e))  # Debug log
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500