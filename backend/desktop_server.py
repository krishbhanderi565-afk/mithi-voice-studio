import os
import sys
import argparse
import logging
import uvicorn

# Configure unbuffered output for real-time logging in Electron
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

# Add current and parent directory to sys.path
HERE = os.path.dirname(os.path.abspath(__file__))
PARENT = os.path.dirname(HERE)
for p in (HERE, PARENT):
    if p not in sys.path:
        sys.path.insert(0, p)

from app.main import app
from app.config import settings

def main():
    parser = argparse.ArgumentParser(description="MAVS Desktop Backend Server")
    parser.add_argument("--host", default="127.0.0.1", help="Binding host (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8000, help="Binding port (default: 8000)")
    parser.add_argument("--data-dir", default=None, help="Custom user data directory")
    parser.add_argument("--model-dir", default=None, help="Custom model weights directory")
    args = parser.parse_args()

    if args.data_dir:
        os.environ["MAVS_DATA_DIR"] = args.data_dir
    if args.model_dir:
        os.environ["MITHI_MODEL_DIR"] = args.model_dir

    print(f"[MAVS Backend] Starting desktop engine on http://{args.host}:{args.port}")
    uvicorn.run(app, host=args.host, port=args.port, log_level="info", access_log=False)

if __name__ == "__main__":
    main()
