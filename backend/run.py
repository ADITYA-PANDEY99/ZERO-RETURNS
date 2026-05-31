"""
ZeroReturn Backend — Quick Start Runner
========================================
Convenience script to start the backend server.

Usage:
    python run.py               # default: port 8000, auto-reload
    python run.py --port 8080
    python run.py --no-reload   # production mode
"""
import argparse
import os
import sys

from dotenv import load_dotenv

load_dotenv()


def main():
    parser = argparse.ArgumentParser(description="ZeroReturn Backend Server")
    parser.add_argument("--host",      type=str, default="0.0.0.0",    help="Bind host")
    parser.add_argument("--port",      type=int, default=8000,          help="Bind port")
    parser.add_argument("--no-reload", action="store_true",             help="Disable auto-reload")
    parser.add_argument("--workers",   type=int, default=1,             help="Worker processes")
    args = parser.parse_args()

    reload = not args.no_reload
    env = os.getenv("ENVIRONMENT", "development")

    print("=" * 60)
    print("ZeroReturn Backend")
    print("=" * 60)
    print(f"  Environment : {env}")
    print(f"  Host        : {args.host}")
    print(f"  Port        : {args.port}")
    print(f"  Auto-reload : {reload}")
    print(f"  Workers     : {args.workers}")
    print(f"  Groq API    : {'configured' if os.getenv('GROQ_API_KEY') else 'not set (using rule-based chatbot)'}")
    print(f"  Supabase    : {'configured' if os.getenv('SUPABASE_URL') else 'not set (using mock data)'}")
    print("=" * 60)
    print(f"  API docs    : http://localhost:{args.port}/docs")
    print(f"  Health      : http://localhost:{args.port}/health")
    print(f"  WebSocket   : ws://localhost:{args.port}/ws/live-updates")
    print("=" * 60)
    print()

    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        reload=reload,
        workers=args.workers if not reload else 1,
        log_level="info",
    )


if __name__ == "__main__":
    main()
