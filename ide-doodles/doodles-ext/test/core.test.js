'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { skyAt, colorsAt } = require('../lib/sky');
const { restoreColors } = require('../lib/settings');
const weather = require('../../src/weather/ktown-weather');
test('sky wraps at midnight and interpolates valid colors throughout the day', () => {
  assert.equal(skyAt(0), skyAt(24));
  assert.equal(skyAt(-1), skyAt(23));
  assert.equal(skyAt(8), '#d6edf9');
  for (let h = 0; h < 24; h += 0.1) {
    for (const c of Object.values(colorsAt(h))) assert.match(c, /^#[a-f0-9]{6}$/);
  }
});
test('restoration removes owned colors, restores originals and preserves manual/unrelated settings', () => {
  const original = {'editor.background':'#111111', 'other':'before'};
  const last = {'editor.background':'#cccccc', 'terminal.background':'#dddddd', 'panel.background':'#eeeeee'};
  const current = {...last, 'terminal.background':'#123456', unrelated:'keep'};
  assert.deepEqual(restoreColors(current, original, last), {'editor.background':'#111111', 'terminal.background':'#123456', unrelated:'keep'});
  assert.equal(current['panel.background'], '#eeeeee');
});
test('weather rejects invalid and stale observations', () => {
  const now = Date.parse('2026-09-22T12:00:00Z');
  const data = {current:{cloud_cover:50,time:'2026-09-22T08:00',weather_code:3,is_day:1},utc_offset_seconds:-14400};
  assert.equal(weather.parseWeather(data, now).observed, now);
  assert.throws(() => weather.parseWeather({...data,current:{...data.current,cloud_cover:101}},now));
  assert.throws(() => weather.parseWeather(data, now + 3*3600000));
});
test('rain covers drizzle, showers and storms but not snow or fog', () => {
  for(const code of [51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99]) assert.equal(weather.isRain({code}),true);
  for(const code of [0,1,2,3,45,48,71,73,75,77,85,86,undefined]) assert.equal(weather.isRain({code}),false);
});
test('rainbow needs a fresh rain-to-daylight-clear transition', () => {
  const rainy={code:61,isDay:1,observed:1000};
  const sunny={code:1,isDay:1,observed:301000};
  assert.equal(weather.rainbowTransition(rainy,sunny),true);
  for(const previous of [null,{...rainy,code:3},{...rainy,code:1}]) assert.equal(weather.rainbowTransition(previous,sunny),false);
  for(const next of [{...sunny,isDay:0},{...sunny,code:3},{...sunny,observed:1000},{...sunny,observed:0},{...sunny,observed:10801000}]) assert.equal(weather.rainbowTransition(rainy,next),false);
});
