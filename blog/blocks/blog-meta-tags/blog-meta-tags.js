import { LIBS } from '../../scripts/scripts.js';

const utilsModule = await import(`${LIBS}/utils/utils.js`).catch(() => null);
const getMetadata = utilsModule?.getMetadata ?? (() => null);

const MAX_ROWS = 2;
const ROW_TOLERANCE = 1; // px, absorbs sub-pixel layout rounding between rows

// Single source of truth for the two-row clamp (see CSS file for a note pointing
// back here). Measures each pill's rendered row via offsetTop and hides — via the
// `hidden` attribute — any pill beyond MAX_ROWS. `hidden` sets `display: none`,
// which removes the element from layout, the accessibility tree, and tab order in
// one step, so overflow pills can never be reached by keyboard or screen reader.
function clampToRows(list, maxRows = MAX_ROWS) {
  const items = [...list.children];
  let rowCount = 0;
  let currentRowTop = null;

  items.forEach((li) => {
    const { offsetTop } = li;
    if (currentRowTop === null || offsetTop > currentRowTop + ROW_TOLERANCE) {
      rowCount += 1;
      currentRowTop = offsetTop;
    }
    li.hidden = rowCount > maxRows;
  });
}

// Path A: authored links. Author supplies the full resource-center URL per tag;
// the link text is the tag label. Decorate each authored <a> into a pill and
// collect them into a single <ul class="blog-meta-tags-list">.
function decorateAuthoredLinks(el) {
  const links = [...el.querySelectorAll('a')];
  if (!links.length) return null;

  const list = document.createElement('ul');
  list.className = 'blog-meta-tags-list';
  links.forEach((a) => {
    a.className = 'blog-meta-tag';
    const li = document.createElement('li');
    li.append(a);
    list.append(li);
  });
  return list;
}

// Path B (STUB): no authored links present. Eventually this will derive tags
// from page Card Metadata (Tags / primaryTag, e.g. `caas:content-type/blog`,
// `caas:topic/thought-leadership`) and build resource-center filter URLs.
// TODO(caas-url-format): dynamic tag generation deferred until resource-center
// filter URL format is confirmed. For now this only reads the metadata as a
// no-op seam and always yields nothing.
function buildDynamicTags() {
  const tags = getMetadata('tags');
  if (!tags) return null;
  // Intentionally not building pills yet — see TODO above.
  return null;
}

export default async function init(el) {
  try {
    const list = decorateAuthoredLinks(el) ?? buildDynamicTags();

    if (!list) {
      el.remove();
      return;
    }

    el.replaceChildren(list);
    clampToRows(list);
  } catch (e) {
    window.lana?.log(`blog-meta-tags: failed to decorate: ${e.message}`, { severity: 'warning', tags: 'blog-meta-tags' });
    el.remove();
  }
}
