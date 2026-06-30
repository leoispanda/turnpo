import assert from "node:assert/strict";
import fs from "node:fs";

const styles = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");

assert.ok(styles.includes(".event-card > *"));
assert.ok(styles.includes("min-width: 0;"));
assert.ok(styles.includes("overflow-wrap: anywhere;"));
assert.ok(styles.includes("overflow: hidden;"));
assert.ok(styles.includes("body:not(.owner-mode) .travel-place-list"));
assert.ok(styles.includes("top: auto;"));
assert.ok(styles.includes("scroll-snap-type: x proximity;"));
assert.ok(styles.includes("body:not(.owner-mode) .travel-place-card small"));
assert.ok(styles.includes("body.theme-light:not(.owner-mode) .travel-place-list"));
assert.equal(/img\[data-loading-image\][^{]+{[^}]*blur\(/s.test(styles), false);

console.log("profile layout static checks passed");
