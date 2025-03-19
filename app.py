from flask import Flask, render_template
from app.api.db_routes import db_bp
from app.api.file_routes import file_bp
from app.api.web_routes import web_bp
from app.api.rag_routes import rag_bp

app = Flask(__name__, 
            template_folder='app/templates', 
            static_folder='app/static')


app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB limit

# Register Blueprints
app.register_blueprint(db_bp)
app.register_blueprint(file_bp)
app.register_blueprint(web_bp)
app.register_blueprint(rag_bp)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
