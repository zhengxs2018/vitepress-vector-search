import path from 'node:path'

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { externalizeDeps } from 'vite-plugin-externalize-deps'

/**
 * vite config
 * @ref https://vitejs.dev/
 */
export default defineConfig({
  plugins: [
    externalizeDeps({
      useFile: path.join(process.cwd(), 'package.json'),
    }),
    dts({
      root: __dirname,
      tsConfigFilePath: 'tsconfig.build.json',
      outputDir: 'dist-types',
    }),
  ],
  build: {
    sourcemap: true,
    copyPublicDir: false,
    reportCompressedSize: false,
    lib: {
      entry: ['src/index.ts'],
    },
    rollupOptions: {
      output: [
        {
          format: 'esm',
          dir: 'dist-esm',
          entryFileNames: '[name].mjs',
          chunkFileNames: '[name].mjs',
        },
        {
          format: 'cjs',
          dir: 'dist-cjs',
          entryFileNames: '[name].cjs',
          chunkFileNames: '[name].cjs',
        },
      ],
    },
  },
})
