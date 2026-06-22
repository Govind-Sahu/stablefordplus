import { build } from 'vite';
import { copyFileSync } from 'fs';

console.log('Building with Vite...');
await build();
copyFileSync('dist/index.html', 'dist/404.html');
console.log('Build complete.');
