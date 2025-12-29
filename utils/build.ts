import type { BuildConfig } from 'bun';
import packageJson from '../package.json' assert { type: 'json' };

const defaultBuildConfig: BuildConfig = {
    entrypoints: ['./src/snowflake.ts'],
    outdir: './dist',
    minify: true,
}

await Bun.spawn(["rm", "-rf", "./dist"]).exited;

Bun.write("./dist/package.json", JSON.stringify({
    ...packageJson,
    "module": "snowflake.js",
    "main": "snowflake.cjs",
    "sideEffects": false,
}, null, 0));

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

await Bun.spawn(["bun", "tsc", "-p", "tsconfig.build.json"]).exited;
await Bun.spawn(["bun", "pm", "pack"], { cwd: "./dist" }).exited;