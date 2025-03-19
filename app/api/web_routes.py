from flask import Blueprint, request, jsonify
from ..servises.web_servise  import SearchService

web_bp = Blueprint('web_bp', __name__, url_prefix='/web')

@web_bp.route('/search', methods=['POST'])
def web_search():
    query = request.json.get('query')
    result = SearchService.search(query)
    return jsonify(result)
