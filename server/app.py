# server/app.py
# Proxy to root app.py
import os
import sys

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)
from app import app, PORT

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT, debug=False)
