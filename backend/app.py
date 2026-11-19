"""Flask application factory / entry point."""
from flask import Flask
from flask_cors import CORS
from config import Config
from db import init_db
from errors import register_error_handlers
from routes import bp


def create_app():
    Config.validate()
    app = Flask(__name__)
    CORS(app, origins=[Config.FRONTEND_ORIGIN])
    register_error_handlers(app)
    app.register_blueprint(bp)
    init_db()
    return app


if __name__ == "__main__":
    create_app().run(port=Config.PORT, threaded=True)
