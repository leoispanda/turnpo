const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const versionPath = path.join(root, "version.json");
const htmlPath = path.join(root, "index.html");

const versionData = JSON.parse(fs.readFileSync(versionPath, "utf8"));
const parts = String(versionData.version || "0.1.0").split(".").map(Number);

while (parts.length < 3) {
  parts.push(0);
}

parts[2] += 1;

const nextVersion = parts.join(".");
const nextData = {
  version: nextVersion,
  updatedAt: new Date().toISOString()
};

let html = fs.readFileSync(htmlPath, "utf8");
html = html.replace(/styles\.css(?:\?v=[0-9.]+)?/g, `styles.css?v=${nextVersion}`);
html = html.replace(/script\.js(?:\?v=[0-9.]+)?/g, `script.js?v=${nextVersion}`);
html = html.replace(/<span class="version-badge">v[^<]+<\/span>/, `<span class="version-badge">v${nextVersion}</span>`);

fs.writeFileSync(versionPath, `${JSON.stringify(nextData, null, 2)}\n`);
fs.writeFileSync(htmlPath, html);

console.log(`Bumped Turnpo version to v${nextVersion}`);
