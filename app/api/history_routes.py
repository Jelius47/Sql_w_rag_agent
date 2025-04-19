from flask import Blueprint, request, jsonify
from sqlalchemy.orm import joinedload
from ..database import SessionLocal
from ..models import User, Chat, Message

history_bp = Blueprint('history_bp', __name__, url_prefix='/db')

# Get all chat titles (sidebar) for a given user
@history_bp.route('/<uuid:user_id>/chats', methods=['GET'])
def get_user_chats(user_id):
    db = SessionLocal()
    try:
        user = db.query(User).options(joinedload(User.chats)).filter(User.id == user_id).first()

        if not user:
            return jsonify({"error": "User not found"}), 404

        chats = [{
            "chat_id": str(chat.id),
            "title": chat.title or "Untitled",
            "created_at": chat.created_at.isoformat()
        } for chat in sorted(user.chats, key=lambda c: c.created_at, reverse=True)]

        return jsonify({"status": "success", "chats": chats})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        db.close()


# Get messages for a specific chat (chat history view)
@history_bp.route('/<uuid:chat_id>/messages', methods=['GET'])
def get_chat_messages(chat_id):
    db = SessionLocal()
    try:
        chat = db.query(Chat).options(joinedload(Chat.messages)).filter(Chat.id == chat_id).first()

        if not chat:
            return jsonify({"error": "Chat not found"}), 404

        messages = [{
            "sender": msg.sender,
            "content": msg.content,
            "created_at": msg.created_at.isoformat()
        } for msg in sorted(chat.messages, key=lambda m: m.created_at)]

        return jsonify({
            "status": "success",
            "chat_title": chat.title or "Untitled",
            "messages": messages
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        db.close()
