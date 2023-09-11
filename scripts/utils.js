/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * The decision engine for where to get Milo's libs from.
 */
export const [setLibs, getLibs] = (() => {
  let libs;
  return [
    (prodLibs, location) => {
      libs = (() => {
        const { hostname, search } = location || window.location;
        if (!(hostname.includes('.hlx.') || hostname.includes('local'))) return prodLibs;
        const branch = new URLSearchParams(search).get('milolibs') || 'main';
        if (branch === 'local') return 'http://localhost:6456/libs';
        return branch.includes('--') ? `https://${branch}.hlx.live/libs` : `https://${branch}--milo--adobecom.hlx.live/libs`;
      })();
      return libs;
    }, () => libs,
  ];
})();

/*
 * ------------------------------------------------------------
 * Edit above at your own risk.
 * ------------------------------------------------------------
 */

/**
 * Builds a block DOM Element from a two dimensional array
 * @param {string} blockName name of the block
 * @param {any} content two dimensional array or string or object of content
 */
function buildBlock(blockName, content) {
  const table = Array.isArray(content) ? content : [[content]];
  const blockEl = document.createElement('div');

  blockEl.classList.add(blockName);
  table.forEach((row) => {
    const rowEl = document.createElement('div');
    row.forEach((col) => {
      const colEl = document.createElement('div');
      const vals = col.elems || [col];
      vals.forEach((val) => {
        if (val) {
          if (typeof val === 'string') {
            colEl.innerHTML += val;
          } else {
            colEl.appendChild(val);
          }
        }
      });
      rowEl.appendChild(colEl);
    });
    blockEl.appendChild(rowEl);
  });
  return (blockEl);
}

function buildTagsBlock() {
  const metadata = document.head.querySelectorAll('meta[property="article:tag"]');
  if (!metadata.length) return;
  const tagsArray = [...metadata].map((el) => el.content);
  const tagsBlock = buildBlock('tags', tagsArray.join(', '));
  const main = document.querySelector('main');
  const recBlock = main.querySelector('.recommended-articles');
  if (recBlock) {
    // Put tags block before recommended articles block
    if (recBlock.parentElement.childElementCount === 1) {
      recBlock.parentElement.previousElementSibling.append(tagsBlock);
    } else {
      recBlock.before(tagsBlock);
    }
  } else {
    main.lastElementChild.append(tagsBlock);
  }
}

function getImageCaption(picture) {
  // Check if the parent element has a caption
  const parentEl = picture.parentNode;
  let caption = parentEl.querySelector('em');
  if (caption) return caption;

  // If the parent element doesn't have a caption, check if the next sibling does
  const parentSiblingEl = parentEl.nextElementSibling;
  caption = parentSiblingEl
    && !parentSiblingEl.querySelector('picture')
    && parentSiblingEl.firstChild.tagName === 'EM'
    ? parentSiblingEl.querySelector('em')
    : undefined;
  return caption;
}

async function buildArticleHeader(el) {
  const miloLibs = getLibs();
  const { getMetadata, getConfig } = await import(`${miloLibs}/utils/utils.js`);
  const { loadTaxonomy, getLinkForTopic, getTaxonomyModule } = await import(`${miloLibs}/blocks/article-feed/article-helpers.js`);
  if (!getTaxonomyModule()) {
    await loadTaxonomy();
  }
  const div = document.createElement('div');
  const h1 = el.querySelector('h1');
  const picture = el.querySelector('picture');
  const caption = getImageCaption(picture);
  const figure = document.createElement('div');
  figure.append(picture, caption);
  const tag = getMetadata('article:tag');
  const category = tag || 'News';
  const author = getMetadata('author') || 'Adobe Communications Team';
  const { codeRoot } = getConfig();
  const authorURL = getMetadata('author-url') || (author ? `${codeRoot}/authors/${author.replace(/[^0-9a-z]/gi, '-').toLowerCase()}` : null);
  const publicationDate = getMetadata('publication-date');

  const categoryTag = getLinkForTopic(category);

  const articleHeaderBlockEl = buildBlock('article-header', [
    [`<p>${categoryTag}</p>`],
    [h1],
    [`<p>${authorURL ? `<a href="${authorURL}">${author}</a>` : author}</p>
      <p>${publicationDate}</p>`],
    [figure],
  ]);
  div.append(articleHeaderBlockEl);
  el.prepend(div);
}

export async function buildAutoBlocks() {
  const miloLibs = getLibs();
  const { getMetadata } = await import(`${miloLibs}/utils/utils.js`);
  const mainEl = document.querySelector('main');
  try {
    if (getMetadata('publication-date') && !mainEl.querySelector('.article-header')) {
      buildTagsBlock(mainEl);
      await buildArticleHeader(mainEl);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}
