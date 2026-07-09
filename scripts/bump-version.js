const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const versionPath = path.join(root, "version.json");
const htmlPath = path.join(root, "index.html");
const embaHtmlPath = path.join(root, "emba", "index.html");

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

let embaHtml = fs.readFileSync(embaHtmlPath, "utf8");
embaHtml = embaHtml.replace(/styles\.css(?:\?v=[0-9.]+)?/g, `styles.css?v=${nextVersion}`);
embaHtml = embaHtml.replace(/emba\.css(?:\?v=[0-9.]+)?/g, `emba.css?v=${nextVersion}`);
embaHtml = embaHtml.replace(/emba\.js(?:\?v=[0-9.]+)?/g, `emba.js?v=${nextVersion}`);

fs.writeFileSync(versionPath, `${JSON.stringify(nextData, null, 2)}\n`);
fs.writeFileSync(htmlPath, html);
fs.writeFileSync(embaHtmlPath, embaHtml);

console.log(`Bumped Turnpo version to v${nextVersion}`);
