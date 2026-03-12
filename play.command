#!/bin/bash
# Mr. Baseball Dynasty — Local Launcher
# Double-click this file to play!

cd "$(dirname "$0")/dist"
echo ""
echo "  ⚾ MR. BASEBALL DYNASTY"
echo "  Starting local server..."
echo ""
echo "  Open your browser to: http://localhost:3000"
echo "  Press Ctrl+C to stop the server."
echo ""
open "http://localhost:3000"
python3 -m http.server 3000
