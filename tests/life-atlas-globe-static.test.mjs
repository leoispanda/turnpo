import assert from "node:assert/strict";
import fs from "node:fs";

const script = fs.readFileSync(new URL("../script.js", import.meta.url), "utf8");

const atlasAssets = [
  "assets/earth-blue-marble-texture-4096.jpg",
  "assets/earth-terrain-bump-2048.jpg",
  "assets/earth-ocean-specular-2048.jpg",
  "assets/earth-cloud-alpha-2048.jpg"
];

for (const assetPath of atlasAssets) {
  const assetUrl = new URL(`../${assetPath}`, import.meta.url);
  const stat = fs.statSync(assetUrl);
  assert.ok(stat.size > 1024, `${assetPath} should exist and not be empty`);
  assert.ok(stat.size < 2 * 1024 * 1024, `${assetPath} should stay under 2 MB`);
}

assert.ok(script.includes('const LIFE_ATLAS_TERRAIN_TEXTURE = "/assets/earth-terrain-bump-2048.jpg";'));
assert.ok(script.includes('const LIFE_ATLAS_SPECULAR_TEXTURE = "/assets/earth-ocean-specular-2048.jpg";'));
assert.ok(script.includes('const LIFE_ATLAS_CLOUD_TEXTURE = "/assets/earth-cloud-alpha-2048.jpg";'));
assert.ok(script.includes("displacementMap: terrainTexture"));
assert.ok(script.includes("bumpMap: terrainTexture"));
assert.ok(script.includes("metalnessMap: specularTexture"));
assert.ok(script.includes("alphaMap: cloudTexture"));
assert.ok(script.includes("cloudLayer.rotation.y += 0.00018"));
assert.ok(script.includes("visibleWidth >= Math.min(rect.width * 0.08, 96)"));
assert.equal(script.includes("lifeAtlasScrollActivated"), false);

console.log("life atlas globe static checks passed");
