from flask import Blueprint, request, jsonify
from ..servises.rag_servise  import ChatBot


rag_bp = Blueprint('rag_bp', __name__, url_prefix='/rag')

@rag_bp.route('/search', methods=['POST'])
def rag_search():

    prompt = request.json.get('query')
    print(prompt)
    try:
        result = ChatBot.respond(chatbot=[],message=prompt)

        return jsonify({
                "status": "success",
                "result": result
            })
    
    except Exception as e:
        print("Rag  error:", str(e))  # Debug log
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
