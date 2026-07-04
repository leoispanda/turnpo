import assert from "node:assert/strict";
import fs from "node:fs";

const script = fs.readFileSync(new URL("../script.js", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");

assert.ok(script.includes('data-cover-image="${index}"'));
assert.ok(script.includes("const coverButton = event.target.closest(\"[data-cover-image]\");"));
assert.ok(script.includes("const [coverImage] = images.splice(coverIndex, 1);"));
assert.ok(script.includes("renderImageUpload([coverImage, ...images]);"));
assert.ok(script.includes("Cover image updated. Remember to save content."));
assert.ok(styles.includes(".image-thumb-actions"));
assert.ok(styles.includes(".image-thumb-actions .small-action"));

console.log("image upload static checks passed");
