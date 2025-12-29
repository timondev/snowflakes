import type { BuildConfig } from 'bun';
import packageJson from '../package.json' assert { type: 'json' };

const defaultBuildConfig: BuildConfig = {
    entrypoints: ['./src/snowflake.ts'],
    outdir: './dist',
    minify: true,
}

// Clean dist folder.
await Bun.spawn(["rm", "-rf", "./dist"]).exited;

// Write package.json to dist folder.
Bun.write("./dist/package.json", JSON.stringify({
    ...packageJson,
    "devDependencies": undefined,
    "peerDependencies": undefined,
    "scripts": undefined,
    "module": "snowflake.js",
    "main": "snowflake.cjs",
    "types": "snowflake.d.ts",
    "sideEffects": false,
}, null, 0));

// Copy README.md and LICENSE to dist folder.
await Bun.spawn(["cp", "./README.md", "./dist/README.md"]).exited;
await Bun.spawn(["cp", "./LICENSE", "./dist/LICENSE"]).exited;

// Build ESM and CJS versions.
await Promise.all([
    Bun.build({
        ...defaultBuildConfig,
        format: 'esm',
        naming: "[dir]/[name].js",
    }),
    Bun.build({
        ...defaultBuildConfig,
        format: 'cjs',
        naming: "[dir]/[name].cjs",
    })
]);

// TypeScript build for declaration files.
await Bun.spawn(["bun", "tsc", "-p", "tsconfig.build.json"]).exited;

// Pack the module to verify integrity.
await Bun.spawn(["bun", "pm", "pack"], { cwd: "./dist" }).exited;