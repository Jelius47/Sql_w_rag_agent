from flask import Blueprint, request, jsonify
from ..servises.rag_servise  import ChatBot


rag_bp = Blueprint("rag", __name__)
@rag_bp.route("/rag/search", methods=["POST"])
def rag_search():
    data = request.get_json()
    print("Received request body:", data)  # Debugging line

    prompt = data.get("query", "").strip()  # Ensure prompt is a valid string
    if not prompt:
        return jsonify({"error": "Message cannot be empty."}), 400  # Handle empty input

    result = ChatBot.respond(chatbot=[], message=prompt)
    return jsonify({"response": result[1][-1]})
