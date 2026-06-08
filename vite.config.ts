import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        en_landing: resolve(__dirname, 'en/index.html'),
        en_docs: resolve(__dirname, 'en/docs/index.html'),
        fr_landing: resolve(__dirname, 'fr/index.html'),
        fr_docs: resolve(__dirname, 'fr/docs/index.html'),
        app: resolve(__dirname, 'app/index.html'),
      }
    }
  }
});
