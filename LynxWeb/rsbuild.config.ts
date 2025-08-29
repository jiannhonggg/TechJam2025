import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    define: {
      // Ensure environment variables are available
      'import.meta.env.VITE_OPENAI_API_KEY': JSON.stringify(process.env.VITE_OPENAI_API_KEY || ''),
    },
  },
  server: {
    publicDir: [
      {
        name: path.join(
          __dirname,
          '/LynxWeb',
          'lynx-project',
          'dist',
        ),
      },
    ],
  },
});