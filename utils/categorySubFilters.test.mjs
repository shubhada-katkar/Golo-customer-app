import assert from 'node:assert/strict';
import { matchesCategory, matchesCategorySubFilter } from './categorySubFilters.js';

const electronicsAd = {
  category: 'Electronics & Home appliances',
  categorySpecificData: { applianceType: 'Refrigerator' },
};

const greetingsAd = {
  category: 'Greetings & Tributes',
  categorySpecificData: { noticeType: 'tribute' },
};

assert.equal(matchesCategory(electronicsAd, 'Electronics & Home'), true);
assert.equal(matchesCategory(electronicsAd, 'Furniture'), false);
assert.equal(matchesCategorySubFilter(greetingsAd, 'Greetings', 'tribute'), true);
assert.equal(matchesCategorySubFilter(greetingsAd, 'Greetings', 'greetings'), false);

console.log('category subfilter tests passed');
