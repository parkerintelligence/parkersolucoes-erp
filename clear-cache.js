// Cache clearing script for Vite
const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing Vite cache completely...');

// Remove Vite cache directory
const viteCacheDir = path.join(__dirname, 'node_modules', '.vite');
if (fs.existsSync(viteCacheDir)) {
  fs.rmSync(viteCacheDir, { recursive: true, force: true });
  console.log('✅ Removed .vite cache directory');
} else {
  console.log('ℹ️ .vite cache directory not found');
}

// Remove dist directory
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
  console.log('✅ Removed dist directory');
}

console.log('🎉 Cache clearing complete! Restart your dev server.');