import assert from "node:assert/strict";
import fs from "node:fs";

const styles = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");

assert.ok(styles.includes(".event-card > *"));
assert.ok(styles.includes("min-width: 0;"));
assert.ok(styles.includes("overflow-wrap: anywhere;"));
assert.ok(styles.includes("overflow: hidden;"));
assert.equal(/img\[data-loading-image\][^{]+{[^}]*blur\(/s.test(styles), false);

console.log("profile layout static checks passed");
