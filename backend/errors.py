"""Custom exceptions and centralised Flask error handlers."""
from flask import jsonify
from pymongo.errors import PyMongoError


class AppError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.message, self.status = message, status


def register_error_handlers(app):
    @app.errorhandler(AppError)
    def _app_error(e):
        return jsonify(error=e.message), e.status

    @app.errorhandler(PyMongoError)
    def _db_error(e):
        app.logger.error("Database error: %s", e)
        return jsonify(error="Database is unavailable. Please try again shortly."), 503

    @app.errorhandler(404)
    def _404(e):
        return jsonify(error="Resource not found."), 404

    @app.errorhandler(405)
    def _405(e):
        return jsonify(error="Method not allowed."), 405

    @app.errorhandler(Exception)
    def _500(e):
        app.logger.exception("Unhandled error")
        return jsonify(error="Unexpected server error."), 500
