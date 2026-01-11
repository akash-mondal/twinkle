import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/constants/index.ts',
    'src/types/index.ts',
    'src/utils/index.ts',
    'src/abis/index.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  noExternal: [], // Let external deps be handled by Node
  platform: 'node',
  target: 'node20',
  banner: {
    js: `import { createRequire as _cr } from 'module';import { fileURLToPath as _fu } from 'url';import { dirname as _dn } from 'path';const require = _cr(import.meta.url);const __filename = _fu(import.meta.url);const __dirname = _dn(__filename);`,
  },
});
