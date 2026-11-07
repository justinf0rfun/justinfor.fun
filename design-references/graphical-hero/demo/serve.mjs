import { createRequire } from "node:module";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const astroRequire = createRequire(require.resolve("astro/package.json"));
const reactRequire = createRequire(require.resolve("@astrojs/react/package.json"));
const { createServer, build } = await import(pathToFileURL(astroRequire.resolve("vite")).href);
const { default: react } = await import(pathToFileURL(reactRequire.resolve("@vitejs/plugin-react")).href);
const building = process.argv.includes("--build");
const referenceRoot = fileURLToPath(new URL("../", import.meta.url));
const config = {
  configFile: false,
  root: fileURLToPath(new URL("./", import.meta.url)),
  publicDir: fileURLToPath(new URL("../../../public/", import.meta.url)),
  plugins: [react()],
  resolve: { dedupe: ["react", "react-dom"], alias: { torph: fileURLToPath(new URL("./vendor/torph/dist/index.mjs", import.meta.url)) } },
  define: { __REFERENCE_ROOT__: JSON.stringify(referenceRoot) },
  server: { host: "127.0.0.1", port: 4324, strictPort: true, fs: { allow: [fileURLToPath(new URL("../../../", import.meta.url))] } },
  build: { outDir: fileURLToPath(new URL("../.demo-build/", import.meta.url)), emptyOutDir: true, copyPublicDir: false },
};
if (building) {
  await build(config);
  for (const name of ["justin-avatar.png", "zuoyebang-icon.png", "didi-icon.png"]) {
    await copyFile(join(config.publicDir, name), join(config.build.outDir, name));
  }
  const manifest = JSON.parse(await readFile(join(referenceRoot, "manifest.json"), "utf8"));
  const files = new Set([
    ...manifest.assets.map(asset => asset.presentationPath),
    ...manifest.fonts.map(font => font.path),
    "artwork/artwork.css",
  ]);
  for (const file of files) {
    const target = join(config.build.outDir, "reference", file);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(join(referenceRoot, file), target);
  }
}
else { const server = await createServer(config); await server.listen(); server.printUrls(); }
