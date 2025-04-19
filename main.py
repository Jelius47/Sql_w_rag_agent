from flask import Flask, render_template
from app.api.db_routes import db_bp
from app.api.file_routes import file_bp
from app.api.web_routes import web_bp
from app.api.rag_routes import rag_bp
from app.api.history_routes import history_bp

from flask_cors import CORS

from sqlalchemy.orm import session
from app.database import engine,SessionLocal
from app import models

import os

# creating models
models.Base.metadata.create_all(bind =engine)



app = Flask(__name__, 
            template_folder='app/templates', 
            static_folder='app/static')



def get_db():
    db = SessionLocal()
    try:
        yield db

    finally:
        db.close()

CORS(app)  # Allow frontend to access Flask API

app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB limit

# Register Blueprints
app.register_blueprint(db_bp)
app.register_blueprint(file_bp)
app.register_blueprint(web_bp)
app.register_blueprint(rag_bp)
app.register_blueprint(history_bp)

@app.route('/')
def index():
    return render_template('index.html')



if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # Render will inject PORT
    app.run(host="0.0.0.0", port=port)
