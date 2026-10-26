import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const listeners = {};
let renders = 0;
const detail = { addEventListener(type, callback) { listeners[type] = callback; } };
const month = { month: '2026-11', markdown: 'My saved notes', reflection: 'My reflection', materials: [] };
const snapshot = JSON.stringify(month);
const context = vm.createContext({
  document: { getElementById: id => id === 'embaMonthDetail' ? detail : { focus() {} } },
  escapeHtml: value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;'),
  state: { openBlockId: '', materialReader: null },
  selectedMonth: () => month,
  renderMonthDetail: () => renders++,
  renderMaterialReader: () => '<reader/>',
  renderOpenBlockPanel: () => '<saved-archive/>'
});
vm.runInContext(fs.readFileSync(new URL('../emba/november-reading-facts.js', import.meta.url), 'utf8'), context);
vm.runInContext(fs.readFileSync(new URL('../emba/november-study.js', import.meta.url), 'utf8'), context);
const run = expression => vm.runInContext(expression, context);
const select = dataset => listeners.click({
  target: { closest: selector => selector.includes('module-select') && dataset.novemberModuleSelect !== undefined || selector.includes('day-select') && dataset.novemberDaySelect !== undefined ? { dataset, id: 'tab' } : null },
  stopImmediatePropagation() {}
});
assert.equal(run('isNovemberStudy({month:"2026-09"})'), false);
assert.equal(run('isNovemberStudy({month:"2026-11"})'), true);
assert.match(run('renderNovemberStudyModules(selectedMonth())'), /data-november-module="pre-study"/);
// Resource links can open directly; unsupported query values keep the normal default.
context.URLSearchParams = URLSearchParams;
context.window = { location: { search: '?month=2026-11&study=resources' } };
assert.equal(run('novemberInitialModule()'), 'resources');
context.window.location.search = '?study=unsupported';
assert.equal(run('novemberInitialModule()'), 'pre-study');
delete context.window;
// Navigation resets only the reader view and leaves all saved month content untouched.
context.state.openBlockId = 'markdown';
context.state.materialReader = { file: 'some-note.md' };
select({ novemberModuleSelect: 'post-study' });
assert.equal(context.state.openBlockId, '');
assert.equal(context.state.materialReader, null);
assert.equal(run('NOVEMBER_STUDY_UI.module'), 'post-study');
select({ novemberDaySelect: '3' });
assert.match(run('renderNovemberStudyModules(selectedMonth())'), /data-november-post-day="2026-11-05"/);
const validRenders = renders;
select({ novemberDaySelect: '-1' });
select({ novemberModuleSelect: 'unknown' });
assert.equal(renders, validRenders);
assert.equal(run('NOVEMBER_STUDY_UI.day'), 3);
// Saved monthly notes, reflection and upload editors remain reachable from the new planner.
context.state.openBlockId = 'markdown';
assert.match(run('renderNovemberStudyModules(selectedMonth())'), /<saved-archive\/>/);
context.state.openBlockId = '';
context.state.materialReader = { file: 'november-plan.md' };
assert.match(run('renderNovemberStudyModules(selectedMonth())'), /<reader\/>/);
context.state.materialReader = null;
// All published course PDFs are discoverable together, without opening daily disclosures.
select({ novemberModuleSelect: 'resources' });
const resourcesHtml = run('renderNovemberStudyModules(selectedMonth())');
assert.match(resourcesHtml, /Canvas/);
assert.ok(!resourcesHtml.includes('18 份课程原文件已保存'));
const shownFileIds = [...resourcesHtml.matchAll(/courses\/28848\/files\/(\d+)/g)].map(match => match[1]);
const originalManifest = JSON.parse(fs.readFileSync(new URL('../emba/november-files.json', import.meta.url), 'utf8'));
const expectedFileIds = Object.keys(originalManifest.files);
assert.equal(expectedFileIds.length, 18);
assert.deepEqual([...new Set(shownFileIds)].sort(), expectedFileIds.sort());
context.state.materialReader = { file: 'november-plan.md' };
assert.match(run('renderNovemberStudyModules(selectedMonth())'), /<reader\/>/);
context.state.materialReader = null;
// A disclosure survives a tab switch without turning into stored study content.
listeners.toggle({ target: { isConnected: true, matches: () => true, dataset: { novemberDisclosure: 'post-1-sources' }, open: true } });
select({ novemberModuleSelect: 'post-study' });
select({ novemberDaySelect: '0' });
assert.match(run('renderNovemberStudyModules(selectedMonth())'), /data-november-disclosure="post-1-sources" open/);
assert.equal(JSON.stringify(month), snapshot);
const materials = JSON.parse(fs.readFileSync(new URL('../emba/materials.json', import.meta.url), 'utf8'));
const november = materials.months.filter(item => item.month === '2026-11');
assert.equal(november.length, 1);
assert.equal(november[0].markdown, '');
assert.equal(november[0].reflection, '');
assert.deepEqual(november[0].thinkingQuestions, []);
const index = JSON.parse(fs.readFileSync(new URL('../emba/content/knowledge-index.json', import.meta.url), 'utf8'));
const notes = index.notes.filter(item => item.month === '2026-11');
assert.equal(notes.filter(note => note.type === 'monthly_index').length, 1);
const mirrors = notes.filter(note => note.type === 'source_document_mirror');
assert.equal(mirrors.length, 18);
assert.deepEqual(mirrors.map(note => String(note.source_canvas_id)).sort(), expectedFileIds.sort());
for (const note of notes) assert.ok(fs.existsSync(new URL('..' + note.md_file, import.meta.url)));
for (const note of mirrors) {
  assert.equal(note.source_file, originalManifest.files[note.source_canvas_id].url);
  assert.equal(note.source_sha256, originalManifest.files[note.source_canvas_id].sha256);
}
console.log('November planner PASS: phase/day navigation, invalid input, disclosure state, reader/archive routing and saved content preservation.');
