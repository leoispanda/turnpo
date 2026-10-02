import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";

const source = fs.readFileSync(new URL("../script.js", import.meta.url), "utf8");
// Load the real profile helpers and seed data without starting the page or API calls.
const helpers = source.slice(0, source.indexOf('$("#searchForm").addEventListener'));
assert.ok(helpers.length > 0);

function harness() {
  const nodes = new Map();
  const storage = new Map();
  const frames = [];
  const scrolls = [];
  const decode = (value) => value.replace(/&(amp|lt|gt|quot|#039);/g, (_, key) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#039": "'" })[key]);
  let document;
  let window;
  const disconnect = (node) => {
    node.isConnected = false;
    node.children.forEach(disconnect);
    if (node.id && nodes.get(`#${node.id}`) === node) nodes.delete(`#${node.id}`);
    if (document.activeElement === node) document.activeElement = document.body;
  };
  const matches = (node, selector) => {
    if (selector.startsWith("#")) return node.id === selector.slice(1);
    if (selector.startsWith(".")) return node.classList.contains(selector.slice(1));
    const attribute = selector.match(/^\[data-([a-z-]+)(?:=['"]([^'"]*)['"])?\]$/);
    if (!attribute) return false;
    const key = attribute[1].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    return key in node.dataset && (attribute[2] === undefined || node.dataset[key] === attribute[2]);
  };
  const descendants = (node) => node.children.flatMap((child) => [child, ...descendants(child)]);
  const append = (parent, child) => {
    child.parent = parent;
    parent.children.push(child);
    if (child.id) nodes.set(`#${child.id}`, child);
    return child;
  };
  function parseCards(parent, html) {
    const cardMarkup = [...html.matchAll(/<article\b[^>]*data-content-id="([^"]*)"[^>]*>/g)];
    cardMarkup.forEach((match, index) => {
      const card = append(parent, element("", { contentId: decode(match[1]) }));
      card.documentTop = (parent.parent?.documentTop ?? 0) + 50 + index * 180;
      card.height = 160;
      const end = cardMarkup[index + 1]?.index ?? html.length;
      const cardHtml = html.slice(match.index, end);
      if (cardHtml.includes('class="event-gallery"')) {
        const gallery = append(card, element());
        gallery.classList.add("event-gallery");
        gallery.open = false;
      }
    });
  }
  function parseHTML(node, html) {
    if (node.id === "timelineList") {
      const blocks = [...html.matchAll(/<article class="year-block ([^"]*)" id="([^"]*)" tabindex="-1" data-year-block="([^"]*)">/g)];
      blocks.forEach((match, index) => {
        const block = append(node, element(decode(match[2]), { yearBlock: decode(match[3]) }));
        block.documentTop = 1000 + index * 500;
        match[1].split(/\s+/).filter(Boolean).forEach((name) => block.classList.add(name));
        const end = blocks[index + 1]?.index ?? html.length;
        const blockHtml = html.slice(match.index + match[0].length, end);
        const toggleMatch = blockHtml.match(/<button class="year-title"[^>]*data-toggle-year="([^"]*)" aria-expanded="([^"]*)" aria-controls="([^"]*)"/);
        const toggle = append(block, element("", { toggleYear: decode(toggleMatch[1]) }));
        toggle.documentTop = block.documentTop;
        toggle.setAttribute("aria-expanded", toggleMatch[2]);
        toggle.setAttribute("aria-controls", toggleMatch[3]);
        const stack = append(block, element(decode(toggleMatch[3])));
        stack.classList.add("event-stack");
        const stackStart = blockHtml.match(/<div class="event-stack"[^>]*>/);
        stack.innerHTML = blockHtml.slice(stackStart.index + stackStart[0].length);
      });
    } else if (node.classList.contains("event-stack")) {
      parseCards(node, html);
    } else if (node.id === "yearFilters" && html) {
      const newer = append(node, element("", { yearStep: "newer" }));
      newer.disabled = false;
      const select = append(node, element("timelineYearSelect"));
      select.options = [...html.matchAll(/<option value="([^"]*)"( selected)?>([^<]*)<\/option>/g)].map((match) => ({ value: decode(match[1]), selected: Boolean(match[2]) }));
      select.value = select.options.find((option) => option.selected)?.value ?? select.options[0]?.value ?? "";
      const older = append(node, element("", { yearStep: "older" }));
      older.disabled = false;
    }
  }
  function element(id = "", dataset = {}) {
    const classes = new Set();
    const attrs = new Map();
    const listeners = new Map();
    let html = "";
    return {
      id, dataset, hidden: false, isConnected: true, children: [], textContent: "", options: [], documentTop: 0, height: 44,
      style: { scrollMarginTop: "", setProperty(name, value) { this[name] = String(value); }, getPropertyValue(name) { return this[name] || ""; } },
      get innerHTML() { return html; },
      set innerHTML(value) {
        this.children.forEach(disconnect);
        this.children = [];
        html = value;
        parseHTML(this, value);
        this.onHTMLChange?.();
      },
      classList: {
        contains: (name) => classes.has(name),
        toggle(name, force = !classes.has(name)) { if (force) classes.add(name); else classes.delete(name); },
        add: (...names) => names.forEach((name) => classes.add(name)),
        remove: (...names) => names.forEach((name) => classes.delete(name))
      },
      setAttribute: (name, value) => attrs.set(name, String(value)),
      getAttribute: (name) => attrs.get(name),
      addEventListener: (name, callback) => listeners.set(name, callback),
      fire: (name, event = {}) => listeners.get(name)?.(event),
      contains(node) { return node === this || descendants(this).includes(node) || node?.parent === this; },
      focus(options) { document.activeElement = this; this.focusOptions = options; },
      scrollIntoView(options) { this.scrolled = options; this.scrollCount = (this.scrollCount || 0) + 1; },
      getBoundingClientRect() {
        const top = this.viewportTop ?? this.documentTop - window.scrollY;
        return { top, bottom: top + this.height, height: this.height };
      },
      matches(selector) { return selector.split(",").some((part) => matches(this, part.trim())); },
      closest(selector) { return this.matches(selector) ? this : this.parent?.closest(selector) ?? null; },
      querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; },
      querySelectorAll(selector) { return descendants(this).filter((node) => node.matches(selector)); }
    };
  }
  const get = (selector) => {
    if (!nodes.has(selector)) nodes.set(selector, element(selector.replace(/^#/, "")));
    return nodes.get(selector);
  };
  document = {
    body: element("body"), activeElement: null,
    querySelector(selector) {
      if (selector === "#timelineYearSelect") return nodes.get(selector) ?? null;
      if (selector.startsWith("[data-year-step")) return get("#yearFilters").querySelector(selector);
      return get(selector);
    },
    getElementById: (id) => nodes.get(`#${id}`) ?? null,
    querySelectorAll() { return []; }
  };
  window = {
    scrollY: 0, innerHeight: 800,
    scrollTo(options) { scrolls.push(options); this.scrollY = options.top; }
  };
  const context = vm.createContext({
    document, URL, structuredClone, HTMLImageElement: class {},
    requestAnimationFrame: (callback) => frames.push(callback),
    window,
    history: { pushState() {} },
    localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }
  });
  vm.runInContext(helpers, context);
  const topbar = get(".topbar");
  topbar.classList.add("topbar");
  topbar.viewportTop = 0;
  topbar.height = 80;
  return { run: (code) => vm.runInContext(code, context), context, get, document, window, scrolls, flushFrames: () => { while (frames.length) frames.shift()(); } };
}

const fixture = `
  const fixture = starterProfile({ username: "test-person", displayName: "Test Person" });
  const item = (id, year, extra = {}) => ({ id, year, title: id, publicSummary: "A meaningful change.", category: "life", status: "published", userApproved: true, ...extra });
  fixture.lifeStories = [
    item("newest", "2026"), item("same-year", "2026"), item("older [&\\\"']", "2025"), item("oldest", "2024"),
    item("PRIVATE_HIDDEN", "2030", { status: "hidden" }),
    item("PRIVATE_DELETED", "2030", { status: "deleted" }),
    item("PRIVATE_UNAPPROVED", "2030", { userApproved: false }),
    item("PRIVATE_STATE_HIDDEN", "2030"), item("PRIVATE_STATE_DELETED", "2030"),
    item("PRIVATE_WORK_STATE", "2030", { category: "work" })
  ];
  fixture.aiWorks = [item("Visible project", "2026", { link: "https://example.com/project" }), item("PRIVATE_PROJECT", "2030", { status: "hidden" })];
  fixture.publicState.hiddenStoryIds = ["PRIVATE_STATE_HIDDEN"];
  fixture.publicState.deletedStoryIds = ["PRIVATE_STATE_DELETED"];
  fixture.publicState.hiddenWorkIds = ["PRIVATE_WORK_STATE"];
  profiles[fixture.username] = fixture;
  activeUsername = fixture.username;
`;

function delayedPublicProfile(h) {
  let release;
  h.context.publicProfileResponse = new Promise((resolve) => { release = resolve; });
  h.run('body.classList.add("profile-open"); profileApi = () => publicProfileResponse; renderProfile = () => renderTimeline();');
  const request = h.run("loadPublishedProfileOnline(activeUsername)");
  return { release, request };
}

function shiftTimelineAfterRender(h, distance) {
  h.get("#timelineList").onHTMLChange = () => {
    h.get("#timelineList").querySelectorAll("[data-year-block], [data-toggle-year], [data-content-id]").forEach((node) => { node.documentTop += distance; });
  };
}

test("the first public year jump initializes defaults and opens its target", () => {
  const h = harness();
  h.run(fixture);
  h.run('jumpToTimelineYear("2024")');
  assert.equal(h.run('loadCollapsedYears().has("2024")'), false);
  assert.equal(h.run('loadCollapsedYears().has("2025")'), true);
  assert.equal(h.document.activeElement, h.get("#timeline-year-2024"));
  assert.equal(h.get("#timeline-year-2024").classList.contains("is-collapsed"), false);
  h.flushFrames();
  assert.equal(h.get("#timeline-year-2024").scrolled.behavior, "instant");
});

test("individual year toggles preserve neighboring cards, galleries, controls, and focus", () => {
  const h = harness();
  h.run(fixture);
  h.run('fixture.lifeStories[0].images = ["/assets/one.jpg", "/assets/two.jpg"]; renderTimeline();');
  const newestYear = h.get("#timeline-year-2026");
  const newestCard = newestYear.querySelector("[data-content-id]");
  const gallery = newestCard.querySelector(".event-gallery");
  gallery.open = true;
  const select = h.get("#timelineYearSelect");
  select.focus();
  const olderYear = h.get("#timeline-year-2025");
  const toggle = olderYear.querySelector("[data-toggle-year]");
  const stack = olderYear.querySelector(".event-stack");
  assert.equal(stack.querySelectorAll("[data-content-id]").length, 0);

  h.run('setTimelineYearCollapsed("2025", false)');
  assert.equal(h.get("#timeline-year-2025"), olderYear);
  assert.equal(olderYear.classList.contains("is-collapsed"), false);
  assert.equal(toggle.getAttribute("aria-expanded"), "true");
  assert.equal(stack.querySelectorAll("[data-content-id]").length, 1);
  assert.equal(stack.querySelector("[data-content-id]").dataset.contentId, h.run("fixture.lifeStories[2].id"));
  assert.equal(stack.innerHTML.includes("PRIVATE_"), false);
  assert.equal(h.get("#timeline-year-2026"), newestYear);
  assert.equal(newestYear.querySelector("[data-content-id]"), newestCard);
  assert.equal(newestCard.querySelector(".event-gallery"), gallery);
  assert.equal(gallery.open, true);
  assert.equal(h.get("#timelineYearSelect"), select);
  assert.equal(h.document.activeElement, select);
  assert.equal(h.run('loadCollapsedYears().has("2024")'), true);

  h.run('setTimelineYearCollapsed("2025", true)');
  assert.equal(h.get("#timeline-year-2025"), olderYear);
  assert.equal(olderYear.querySelector(".event-stack"), stack);
  assert.equal(stack.innerHTML, "");
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  assert.equal(gallery.open, true);
  assert.equal(h.document.activeElement, select);
  assert.equal(h.scrolls.length, 0);
});

test("repeating an expanded year leaves its cards and open gallery intact", () => {
  const h = harness();
  h.run(fixture);
  h.run('fixture.lifeStories[0].images = ["/assets/one.jpg", "/assets/two.jpg"]; renderTimeline();');
  const card = h.get("#timeline-year-2026").querySelector("[data-content-id]");
  const gallery = card.querySelector(".event-gallery");
  gallery.open = true;
  h.run('setTimelineYearCollapsed("2026", false)');
  assert.equal(h.get("#timeline-year-2026").querySelector("[data-content-id]"), card);
  assert.equal(gallery.open, true);
});

test("year toggles immediately compensate a browser viewport shift in both directions", () => {
  const h = harness();
  h.run(fixture);
  h.run("renderTimeline()");
  const block = h.get("#timeline-year-2025");
  const toggle = block.querySelector("[data-toggle-year]");
  const stack = block.querySelector(".event-stack");
  h.window.scrollY = 600;
  const previousTop = toggle.getBoundingClientRect().top;
  // Simulate browser anchoring changing the viewport while the stack is replaced.
  stack.onHTMLChange = () => { h.window.scrollY -= 120; };
  h.run('setTimelineYearCollapsed("2025", false)');
  assert.equal(toggle.getBoundingClientRect().top, previousTop);
  assert.equal(h.window.scrollY, 600);
  assert.equal(h.scrolls[0].behavior, "instant");
  stack.onHTMLChange = () => { h.window.scrollY += 70; };
  h.run('setTimelineYearCollapsed("2025", true)');
  assert.equal(toggle.getBoundingClientRect().top, previousTop);
  assert.equal(h.window.scrollY, 600);
  assert.equal(h.scrolls.length, 2);
  assert.equal(h.scrolls[1].behavior, "instant");
});

test("the first explicit expansion initializes defaults before saving the open year", () => {
  const h = harness();
  h.run(fixture);
  h.run('setTimelineYearCollapsed("2025", false)');
  assert.equal(h.run('loadCollapsedYears().has("2025")'), false);
  assert.equal(h.run('loadCollapsedYears().has("2024")'), true);
  assert.equal(h.get("#timeline-year-2025").classList.contains("is-collapsed"), false);
  assert.equal(h.get("#timeline-year-2024").classList.contains("is-collapsed"), true);
  h.run("renderTimeline()");
  assert.equal(h.get("#timeline-year-2025").classList.contains("is-collapsed"), false);
});

test("year navigation expands the selected year and focuses before its deferred instant scroll", () => {
  const h = harness();
  h.run(fixture);
  h.run("renderTimeline()");
  const newestYear = h.get("#timeline-year-2026");
  const target = h.get("#timeline-year-2025");
  const select = h.get("#timelineYearSelect");
  select.focus();
  h.run('jumpToTimelineYear("2025")');
  assert.equal(target.classList.contains("is-collapsed"), false);
  assert.equal(target.querySelectorAll("[data-content-id]").length, 1);
  assert.equal(h.run('loadCollapsedYears().has("2025")'), false);
  assert.equal(h.get("#timeline-year-2026"), newestYear);
  assert.equal(h.get("#timelineYearSelect"), select);
  assert.equal(select.value, "2025");
  assert.equal(h.document.querySelector("[data-year-step='newer']").disabled, false);
  assert.equal(h.document.querySelector("[data-year-step='older']").disabled, false);
  assert.equal(h.document.activeElement, target);
  assert.equal(target.focusOptions.preventScroll, true);
  assert.equal(target.scrolled, undefined);
  h.flushFrames();
  assert.equal(target.scrolled.behavior, "instant");
  assert.equal(target.scrolled.block, "start");
  assert.equal(target.scrollCount, 1);
});

test("rapid year navigation scrolls only the latest target, including All years", () => {
  const h = harness();
  h.run(fixture);
  h.run("renderTimeline()");
  const older = h.get("#timeline-year-2025");
  const oldest = h.get("#timeline-year-2024");
  h.run('jumpToTimelineYear("2025"); jumpToTimelineYear("2024");');
  h.flushFrames();
  assert.equal(older.scrolled, undefined);
  assert.equal(oldest.scrollCount, 1);
  assert.equal(h.get("#timelineYearSelect").value, "2024");
  assert.equal(h.document.querySelector("[data-year-step='older']").disabled, true);

  h.run('jumpToTimelineYear("2025"); jumpToTimelineYear("");');
  h.flushFrames();
  assert.equal(older.scrolled, undefined);
  assert.equal(h.get("#timelineList").scrolled.behavior, "instant");
  assert.equal(h.get("#timelineYearSelect").value, "");
});

test("timeline changes cancel an old year jump even if its target keeps focus", () => {
  for (const mutation of ['setTimelineYearCollapsed("2024", false)', 'setAllTimelineYearsCollapsed(false)', "renderTimeline()"]) {
    const h = harness();
    h.run(fixture);
    h.run('renderTimeline(); jumpToTimelineYear("2025");');
    const target = h.get("#timeline-year-2025");
    h.run(mutation);
    h.flushFrames();
    assert.equal(target.scrolled, undefined, mutation);
  }
});

test("a year jump cannot scroll a removed target or steal newly changed focus", () => {
  const h = harness();
  h.run(fixture);
  h.run('renderTimeline(); jumpToTimelineYear("2025");');
  const target = h.get("#timeline-year-2025");
  h.get("#outsideControl").focus();
  h.flushFrames();
  assert.equal(target.scrolled, undefined);
  h.run('jumpToTimelineYear("2025")');
  target.isConnected = false;
  h.flushFrames();
  assert.equal(target.scrolled, undefined);
});

test("a delayed public profile preserves opened years, reading position, and year or card focus", async () => {
  const interactions = [
    { action: 'setTimelineYearCollapsed("2025", false)', focus: "title" },
    { action: 'jumpToTimelineYear("2025")', focus: "year" },
    { action: 'setTimelineYearCollapsed("2025", false)', focus: "card" },
    { action: "setAllTimelineYearsCollapsed(false)", focus: "title" }
  ];
  for (const { action, focus } of interactions) {
    const h = harness();
    h.run(fixture);
    h.run("renderTimeline()");
    h.context.targetId = h.run("fixture.lifeStories[2].id");
    const delayed = delayedPublicProfile(h);
    h.run(action);
    h.flushFrames();
    const year = h.get("#timeline-year-2025");
    const oldAnchor = focus === "card" ? year.querySelector("[data-content-id]") : year.querySelector("[data-toggle-year]");
    const oldFocus = focus === "year" ? year : oldAnchor;
    oldFocus.focus();
    h.window.scrollY = focus === "card" ? 1540 : 1330;
    const previousTop = oldAnchor.getBoundingClientRect().top;
    shiftTimelineAfterRender(h, 180);
    const remote = h.run('const remote = structuredClone(fixture); remote.publicState.collapsedYears = ["2026", "2025", "2024"]; remote;');
    delayed.release({ profile: remote });
    assert.equal(await delayed.request, true, action);

    const updatedYear = h.get("#timeline-year-2025");
    const newAnchor = focus === "card" ? updatedYear.querySelector("[data-content-id]") : updatedYear.querySelector("[data-toggle-year]");
    const newFocus = focus === "year" ? updatedYear : newAnchor;
    assert.equal(updatedYear.classList.contains("is-collapsed"), false, action);
    assert.equal(h.run('loadCollapsedYears().has("2025")'), false, action);
    assert.equal(oldAnchor.isConnected, false, action);
    assert.equal(newAnchor.getBoundingClientRect().top, previousTop, action);
    assert.equal(h.document.activeElement, newFocus, action);
    assert.equal(newFocus.focusOptions.preventScroll, true, action);
    assert.equal(h.scrolls.length, 1, action);
    assert.equal(h.scrolls[0].behavior, "instant", action);
    if (focus === "card") {
      assert.equal(newAnchor.dataset.contentId, h.context.targetId);
      assert.equal(newFocus.tabIndex, -1);
    }
  }
});

test("a delayed profile still applies changed public defaults before any timeline interaction", async () => {
  const h = harness();
  h.run(fixture);
  h.run("renderTimeline()");
  assert.equal(h.get("#timeline-year-2026").classList.contains("is-collapsed"), false);
  assert.equal(h.get("#timeline-year-2025").classList.contains("is-collapsed"), true);
  const delayed = delayedPublicProfile(h);
  const remote = h.run('const remote = structuredClone(fixture); remote.publicState.collapsedYears = ["2026"]; remote;');
  delayed.release({ profile: remote });
  assert.equal(await delayed.request, true);
  assert.equal(h.get("#timeline-year-2026").classList.contains("is-collapsed"), true);
  assert.equal(h.get("#timeline-year-2025").classList.contains("is-collapsed"), false);
  assert.equal(h.get("#timeline-year-2024").classList.contains("is-collapsed"), false);
  assert.equal(h.scrolls.length, 0);
});

test("interacting with one profile does not suppress another profile's updated defaults", async () => {
  const h = harness();
  h.run(fixture);
  h.run('renderTimeline(); setTimelineYearCollapsed("2025", false);');
  h.run('const other = structuredClone(fixture); other.username = "other-person"; other.id = "profile-other-person"; profiles[other.username] = other; activeUsername = other.username; renderTimeline();');
  const delayed = delayedPublicProfile(h);
  const remote = h.run('const remote = structuredClone(other); remote.publicState.collapsedYears = ["2026"]; remote;');
  delayed.release({ profile: remote });
  assert.equal(await delayed.request, true);
  assert.equal(h.get("#timeline-year-2026").classList.contains("is-collapsed"), true);
  assert.equal(h.get("#timeline-year-2025").classList.contains("is-collapsed"), false);
  h.run("activeUsername = fixture.username; renderTimeline();");
  assert.equal(h.get("#timeline-year-2026").classList.contains("is-collapsed"), false);
  assert.equal(h.get("#timeline-year-2025").classList.contains("is-collapsed"), false);
  assert.equal(h.get("#timeline-year-2024").classList.contains("is-collapsed"), true);
});

test("year navigation reserves the measured sticky header height and sixteen pixels of space", () => {
  const h = harness();
  h.run(fixture);
  h.run("renderTimeline()");
  const topbar = h.get(".topbar");
  for (const headerHeight of [80, 179, 260]) {
    topbar.height = headerHeight;
    h.run('jumpToTimelineYear("2025")');
    const target = h.get("#timeline-year-2025");
    const margin = target.style.scrollMarginTop || target.style.getPropertyValue("scroll-margin-top");
    assert.match(margin, /px$/, `header height ${headerHeight}`);
    assert.ok(parseFloat(margin) >= topbar.getBoundingClientRect().bottom + 16, `header height ${headerHeight}`);
    h.flushFrames();
    assert.equal(target.scrolled.behavior, "instant");
  }
});

test("a delayed profile preserves the containing year's position when its visible reading card disappears", async () => {
  for (const change of ["removed", "replaced"]) {
    const h = harness();
    h.run(fixture);
    h.run('fixture.lifeStories.push(item("surviving-year-neighbor", "2025")); renderTimeline();');
    const delayed = delayedPublicProfile(h);
    h.run('jumpToTimelineYear("2025")');
    h.flushFrames();
    h.get(".topbar").height = 179;
    h.window.scrollY = 1390;
    const year = h.get("#timeline-year-2025");
    const title = year.querySelector("[data-toggle-year]");
    const oldCard = year.querySelector("[data-content-id]");
    const previousTitleTop = title.getBoundingClientRect().top;
    assert.equal(previousTitleTop, 110);
    assert.ok(title.getBoundingClientRect().bottom < h.get(".topbar").getBoundingClientRect().bottom);
    const snapshot = h.run("captureTimelineViewport()");
    assert.equal(snapshot.contentId, oldCard.dataset.contentId, change);
    h.context.readingCardId = oldCard.dataset.contentId;
    h.context.remoteChange = change;
    shiftTimelineAfterRender(h, 180);
    const remote = h.run(`
      const remote = structuredClone(fixture);
      remote.lifeStories = remote.lifeStories.filter((story) => story.id !== readingCardId);
      if (remoteChange === "replaced") remote.lifeStories.push(item("remote-replacement", "2025"));
      remote.publicState.collapsedYears = ["2026", "2025", "2024"];
      remote;
    `);
    delayed.release({ profile: remote });
    assert.equal(await delayed.request, true, change);
    const updatedYear = h.get("#timeline-year-2025");
    const updatedTitle = updatedYear.querySelector("[data-toggle-year]");
    assert.equal(oldCard.isConnected, false, change);
    assert.equal(updatedYear.querySelectorAll("[data-content-id]").some((card) => card.dataset.contentId === h.context.readingCardId), false, change);
    assert.equal(updatedTitle.getBoundingClientRect().top, previousTitleTop, change);
    assert.equal(updatedYear.classList.contains("is-collapsed"), false, change);
    assert.equal(h.run("activeTimelineYear"), "2025", change);
    assert.equal(h.document.activeElement, updatedYear, change);
    assert.equal(h.scrolls.length, 1, change);
    assert.equal(h.scrolls[0].behavior, "instant", change);
  }
});
