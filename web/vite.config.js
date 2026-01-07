/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import react from '@vitejs/plugin-react';
import { defineConfig, transformWithEsbuild } from 'vite';
import pkg from '@douyinfe/vite-plugin-semi';
import path from 'path';
import { codeInspectorPlugin } from 'code-inspector-plugin';
const { vitePluginSemi } = pkg;

// https://vitejs.dev/config/
// 从环境变量读取基础路径，默认为 /llm
const basePath = process.env.VITE_BASE_PATH || '/llm';

export default defineConfig({
  base: basePath,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    codeInspectorPlugin({
      bundler: 'vite',
    }),
    {
      name: 'treat-js-files-as-jsx',
      async transform(code, id) {
        if (!/src\/.*\.js$/.test(id)) {
          return null;
        }

        // Use the exposed transform from vite, instead of directly
        // transforming with esbuild
        return transformWithEsbuild(code, id, {
          loader: 'jsx',
          jsx: 'automatic',
        });
      },
    },
    {
      name: 'replace-html-absolute-paths',
      transformIndexHtml(html) {
        // 替换 HTML 中的绝对路径，添加 basePath 前缀
        // 例如：/logo.png -> /llm/logo.png
        return html.replace(
          /(href|src)=["'](\/[^"']+)["']/g,
          (match, attr, path) => {
            // 跳过已经是 basePath 开头的路径，以及 /src/ 等构建路径
            if (path.startsWith(basePath) || path.startsWith('/src/')) {
              return match;
            }
            return `${attr}="${basePath}${path}"`;
          }
        );
      },
    },
    react(),
    vitePluginSemi({
      cssLayer: true,
    }),
  ],
  optimizeDeps: {
    force: true,
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.json': 'json',
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core': ['react', 'react-dom', 'react-router-dom'],
          'semi-ui': ['@douyinfe/semi-icons', '@douyinfe/semi-ui'],
          tools: ['axios', 'history', 'marked'],
          'react-components': [
            'react-dropzone',
            'react-fireworks',
            'react-telegram-login',
            'react-toastify',
            'react-turnstile',
          ],
          i18n: [
            'i18next',
            'react-i18next',
            'i18next-browser-languagedetector',
          ],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      // 匹配带基础路径的 API 请求，转发到后端时移除基础路径
      [`^${basePath}/api`]: {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => {
          // 移除基础路径前缀
          const basePathEscaped = basePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return path.replace(new RegExp(`^${basePathEscaped}`), '');
        },
      },
      [`^${basePath}/mj`]: {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => {
          const basePathEscaped = basePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return path.replace(new RegExp(`^${basePathEscaped}`), '');
        },
      },
      [`^${basePath}/pg`]: {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => {
          const basePathEscaped = basePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return path.replace(new RegExp(`^${basePathEscaped}`), '');
        },
      },
      [`^${basePath}/v1`]: {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => {
          const basePathEscaped = basePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return path.replace(new RegExp(`^${basePathEscaped}`), '');
        },
      },
    },
  },
});
