import { expect } from '@esm-bundle/chai';
import { executeServerCommand, readFile } from '@web/test-runner-commands';

// Skins use --s2a-* tokens, never raw px. The only px allowed are where a token can't go:
const rawPx = (css) => css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split(/[{};]/)
  .map((part) => part.trim())
  // media query breakpoints: custom properties can't be used there
  .filter((part) => !/^@(media|container)\b/.test(part))
  // 1px hairline borders
  .map((part) => (/^(border|outline)[\w-]*\s*:/.test(part) ? part.replace(/(?<![\d.])1px\b/g, '') : part))
  // 0px: a unitless 0 is invalid inside min(), max() and clamp()
  .map((part) => part.replace(/(?<![\d.])0px\b/g, ''))
  .filter((part) => /(?<![\w-])\d*\.?\d+px\b/.test(part));

describe('Skins', () => {
  it('finds raw px', () => {
    expect(rawPx('a { margin: 0 3px; } @media (width >= 600px) { b { border: 1px solid; inset: max(0px, 1%); } }'))
      .to.deep.equal(['margin: 0 3px']);
  });

  it('use no raw px', async () => {
    const skins = await executeServerCommand('list-skins');
    expect(skins).to.include('blog-c2.css');
    const found = await Promise.all(skins.map(async (skin) => [
      skin, rawPx(await readFile({ path: `../../blog/styles/skins/${skin}` })),
    ]));
    expect(found.filter(([, px]) => px.length)).to.deep.equal([]);
  });
});
