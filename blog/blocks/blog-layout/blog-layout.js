async function mountModule(name, el) {
  if (!el) return;
  const mod = await import(`../${name}/${name}.js`).catch(() => null);
  const modInit = mod?.default;
  if (!modInit) return;
  try {
    await modInit(el);
  } catch {
    window.lana?.log(`blog-layout: failed to mount ${name}`, { severity: 'warning', tags: 'blog-layout' });
  }
}

function buildRelatedPlaceholder() {
  const placeholder = document.createElement('div');
  placeholder.className = 'blog-related-placeholder';
  placeholder.setAttribute('aria-label', 'Related content');
  return placeholder;
}

export default async function init(el) {
  document.body.classList.add('blog-2026');

  const main = el.closest('main') || document.querySelector('main');
  const layoutSection = el.closest('.section');

  const grid = document.createElement('div');
  grid.className = 'blog-article-grid';

  const rail = document.createElement('aside');
  rail.className = 'blog-rail';

  const content = document.createElement('div');
  content.className = 'blog-content';

  if (main && layoutSection) {
    const sections = [...main.children].filter((child) => child.classList?.contains('section'));
    const layoutIdx = sections.indexOf(layoutSection);
    const sectionsAfter = layoutIdx >= 0 ? sections.slice(layoutIdx + 1) : [];
    sectionsAfter.forEach((section) => {
      if (section.querySelector('.article-header')) return;
      content.append(section);
    });
  }

  layoutSection?.remove();

  const sideNavContainer = document.createElement('div');
  sideNavContainer.className = 'blog-side-nav';
  const metaTagsContainer = document.createElement('div');
  metaTagsContainer.className = 'blog-meta-tags';

  rail.append(sideNavContainer, metaTagsContainer, buildRelatedPlaceholder());

  grid.append(rail, content);

  if (main) {
    main.append(grid);
  } else {
    el.append(grid);
  }

  const progressBarContainer = document.createElement('div');
  progressBarContainer.className = 'blog-progress-bar';
  content.prepend(progressBarContainer);

  await Promise.all([
    mountModule('blog-side-nav', sideNavContainer),
    mountModule('blog-meta-tags', metaTagsContainer),
    mountModule('blog-progress-bar', progressBarContainer),
  ]);
}
