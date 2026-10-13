const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseWeather,rainAmount,rainGusts,API}=require('./ktown-weather.js');
const now=Date.parse('2026-09-25T19:00:00Z');
const response=(extra={})=>({utc_offset_seconds:-14400,current:{cloud_cover:100,weather_code:63,is_day:1,time:'2026-09-25T15:00',interval:900,rain:.5,showers:.25,wind_speed_10m:20,wind_gusts_10m:36,...extra}});

test('the same request includes liquid rainfall and wind with explicit units',()=>{
  const url=new URL(API);
  for(const name of ['rain','showers','wind_speed_10m','wind_gusts_10m'])assert(url.searchParams.get('current').split(',').includes(name));
  assert.equal(url.searchParams.get('precipitation_unit'),'mm');assert.equal(url.searchParams.get('wind_speed_unit'),'kmh');
});
test('rain rate honors the current accumulation interval and includes showers',()=>{
  const parsed=parseWeather(response(),now);assert.equal(parsed.rainRate,3);assert.equal(parsed.windSpeed,20);assert.equal(parsed.windGusts,36);
  assert.equal(parseWeather(response({interval:1800}),now).rainRate,1.5);
  assert.equal(parseWeather(response({rain:0,showers:0}),now).rainRate,0);
});
test('density increases with rain rate, caps at 100, and excludes dry weather and snow',()=>{
  let previous=0;
  for(const rate of [.01,.1,.5,1,2,5,10,50]){const density=rainAmount({code:63,rainRate:rate});assert(density>=previous && density<=100);previous=density;}
  assert.equal(rainAmount({code:63,rainRate:10}),100);assert.equal(rainAmount({code:63,rainRate:0}),0);
  for(const code of [0,1,3,45,71,73,75,85,86])assert.equal(rainAmount({code,rainRate:12}),0);
});
test('missing or malformed optional data keeps code-based rain and default gusts',()=>{
  for(const invalid of [undefined,null,-1,NaN,Infinity,'3']){
    const parsed=parseWeather(response({rain:invalid,wind_speed_10m:invalid,wind_gusts_10m:invalid}),now);
    assert.equal(parsed.rainRate,null);assert.equal(rainAmount(parsed),60);assert.equal(rainGusts(parsed),null);
  }
  for(const interval of [0,-900,NaN,undefined,7200])assert.equal(parseWeather(response({interval}),now).rainRate,null);
  assert.equal(rainAmount({code:51}),25);assert.equal(rainAmount({code:65}),100);
});
test('calm wind has no gusts, stronger wind increases them, and extreme winds stay bounded',()=>{
  assert.equal(rainGusts({windSpeed:0,windGusts:0}),0);
  assert.equal(rainGusts({windSpeed:20,windGusts:36}),60);
  assert.equal(rainGusts({windSpeed:30,windGusts:10}),50);
  assert.equal(rainGusts({windGusts:90}),100);
  assert.equal(rainGusts(null),null);
});
