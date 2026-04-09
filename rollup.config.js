import terser from '@rollup/plugin-terser';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.BUILD === 'production';

/**
 * Custom plugin to copy CSS files to dist
 */
function cssPlugin() {
  return {
    name: 'css-copy',
    generateBundle() {
      const distDir = resolve(__dirname, 'dist');
      if (!existsSync(distDir)) {
        mkdirSync(distDir, { recursive: true });
      }

      // Read and concatenate CSS files
      const variablesCss = safeRead(resolve(__dirname, 'src/styles/variables.css'));
      const mainCss = safeRead(resolve(__dirname, 'src/styles/main.css'));

      // Replace @import with actual content
      let combined = mainCss.replace(
        /@import\s+['"]\.\/variables\.css['"];?\s*/g,
        variablesCss + '\n'
      );

      writeFileSync(resolve(distDir, 'vanillabuilder.css'), combined);
    },
  };
}

function safeRead(path) {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return '';
  }
}

/** @type {import('rollup').RollupOptions} */
export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/vanillabuilder.js',
      format: 'umd',
      name: 'vanillabuilder',
      exports: 'named',
      sourcemap: !isProd,
      banner: `/* VanillaBuilder v0.1.0 - Zero-dependency web builder */`,
    },
    {
      file: 'dist/vanillabuilder.mjs',
      format: 'es',
      sourcemap: !isProd,
      banner: `/* VanillaBuilder v0.1.0 - Zero-dependency web builder */`,
    },
  ],
  plugins: [
    cssPlugin(),
    ...(isProd ? [terser({
      compress: {
        drop_console: false,
        passes: 2,
      },
      mangle: {
        reserved: ['vanillabuilder'],
      },
      output: {
        comments: /^!/,
      },
    })] : []),
  ],
};
