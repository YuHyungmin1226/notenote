#!/bin/zsh

# Change directory to the location of this script
cd "$(dirname "$0")"

echo "Starting NoteNote..."
echo "Installing dependencies if needed..."
npm install

echo ""
echo "Starting Vite development server..."
npm run dev
