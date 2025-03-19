from flask import Blueprint, request, jsonify, current_app
from ..servises.file_servise import *

file_bp = Blueprint('file_bp', __name__, url_prefix='/file')

@file_bp.route('/upload', methods=['POST'])
def upload_file():
    file = request.files.get('file')
    if file:
        response ="" # TODO
        return jsonify(response)
    return jsonify({"status": "error", "message": "No file uploaded!"})
