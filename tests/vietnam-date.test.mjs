import test from 'node:test';
import assert from 'node:assert/strict';
import { formatVietnamDate,parseVietnamDate,parseIsoDate,vietnamToday } from '../public/vietnam-date.js';

test('Vietnam date display is day/month/year and submitted values stay ISO',()=>{
  assert.equal(formatVietnamDate('2026-11-03'),'03/11/2026');
  assert.equal(parseVietnamDate('03/11/2026'),'2026-11-03');
  assert.equal(parseVietnamDate('11/03/2026'),'2026-03-11');
  assert.equal(parseVietnamDate('3/1/2026'),'2026-01-03');
  assert.equal(formatVietnamDate(parseVietnamDate('3/1/2026')),'03/01/2026');
});
test('invalid days, months and nonleap February cannot silently roll into another date',()=>{
  for(const value of ['31/11/2026','29/02/2027','29/02/1900','00/11/2026','03/13/2026','2026-11-03','11/03/26',''])assert.equal(parseVietnamDate(value),'');
  assert.equal(parseVietnamDate('29/02/2028'),'2028-02-29');
  assert.equal(parseVietnamDate('29/02/2000'),'2000-02-29');
  for(const value of ['2026-02-29','2026-13-01','2026-11-31','2026-1-3','bad']){assert.equal(parseIsoDate(value),null);assert.equal(formatVietnamDate(value),'');}
});
test('today follows the Vietnam calendar across UTC midnight and year boundaries',()=>{
  assert.equal(vietnamToday('2026-11-02T16:59:59Z'),'2026-11-02');
  assert.equal(vietnamToday('2026-11-02T17:00:00Z'),'2026-11-03');
  assert.equal(vietnamToday('2026-12-31T17:00:00Z'),'2027-01-01');
});
