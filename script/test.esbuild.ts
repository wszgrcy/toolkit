import * as esbuild from 'esbuild';
import * as path from 'path';
import * as glob from 'fast-glob';
import { sync } from 'fast-glob';

async function main() {
  const packages = sync('*', {
    onlyDirectories: true,
    cwd: path.join(process.cwd(), 'packages'),
  });
  const aliases: Record<string, string> = {};
  for (const pkg of packages) {
    aliases[`@cyia/${pkg}`] = path.join(
      process.cwd(),
      `packages/${pkg}/index.ts`,
    );
  }

  let options: esbuild.BuildOptions = {
    platform: 'node',
    sourcemap: 'linked',
    bundle: true,
    entryPoints: packages.flatMap((pkg) =>
      sync(`./packages/${pkg}/test/*.spec.ts`, {}),
    ),
    splitting: true,
    outdir: path.join(process.cwd(), './test-dist'),
    outExtension: {
      '.js': '.mjs',
    },
    format: 'esm',
    // minify: true,
    tsconfig: 'tsconfig.spec.json',
    charset: 'utf8',
    packages: 'external',
    alias: aliases,
    inject: [path.join(__dirname, './cjs-shim.ts')],
  };
  await esbuild.build(options);
}
main();
