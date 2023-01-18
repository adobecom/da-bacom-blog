/* eslint-disable no-undef */

import { expect } from '@esm-bundle/chai';

const testScript = 'this is a test';

describe('Sample test for Husky', () => {
  it('passes', () => {
    console.log('To be deleted after new tests are added');
    expect(testScript).to.equal(testScript);
  });
});
