const {test}=require('node:test'),assert=require('node:assert/strict');
const {session}=require('./test-dom.cjs');

function observe(s) {
  const ctx=s.document.getElementById('doodles-goldfish').context,images=[];
  const clear=ctx.clearRect;
  ctx.clearRect=(...args)=>{images.length=0;clear(...args);};
  const draw=ctx.drawImage;
  ctx.drawImage=(sprite,...args)=>{
    images.push({sprite,args,smoothing:ctx.imageSmoothingEnabled});draw(sprite,...args);
  };
  return kind=>images.filter(({sprite})=>sprite.width===(kind==='glasses'?11:32));
}
test('disco glasses follow every evolving face and switch off without modifying sprites',()=>{
  const s=session();s.load('goldfish.js');const painted=observe(s);
  s.advance(20);assert.equal(painted('glasses').length,0);
  s.event(s.document,'pasture-disco-change',{detail:{open:true}});
  s.advance(20);assert.equal(painted('glasses').length,3,'one pair per fish');
  const f=s.window.fishState().fish[0];
  for(let age=0;age<300;age+=5) {
    Object.assign(f,{grounded:true,evolution:'sheep',landAge:age,resting:true,stroll:10});
    s.advance(20);
    assert.equal(painted('glasses').length,3,'glasses at age '+age);
    assert.ok(painted('glasses').every(image=>image.args.every(Number.isFinite)&&image.smoothing===false));
  }
  s.event(s.document,'pasture-disco-change',{detail:{open:false}});
  s.advance(20);assert.equal(painted('glasses').length,0);
});
test('rain threshold is strictly above 50 and accessories survive the sheep handoff',()=>{
  const s=session();s.load('goldfish.js');s.load('../sheep/sheep-overlay.js');
  const painted=observe(s),flock=s.document.getElementById('pasture-sheep');
  for(const amount of [0,50,51,100,50,0,75]) {
    s.event(s.document,'pasture-rain-change',{detail:{amount}});s.advance(20);
    assert.equal(flock.classList.contains('raining'),amount>50);
    assert.equal(painted('umbrella').length,amount>50?3:0);
    assert.ok(painted('umbrella').every(image=>image.smoothing===false));
  }
  const disco=s.document.createElement('div');disco.id='pixel-disco';disco.dataset.party='true';s.document.body.append(disco);
  s.event(s.document,'pasture-disco-change',{detail:{open:true}});
  Object.assign(s.window.fishState().fish[0],{grounded:true,evolution:'sheep',landAge:299.99});
  s.advance(100);
  const sheep=s.document.querySelector('.sheep.evolved');
  assert.ok(sheep.classList.contains('disco'));
  assert.ok(sheep.querySelector('.rain-umbrella'));
  assert.ok(flock.classList.contains('raining'));
  assert.equal(painted('umbrella').length,2,'only the two remaining fish paint canvas umbrellas');
  s.event(s.document,'pasture-rain-change',{detail:{amount:50}});s.advance(20);
  assert.equal(flock.classList.contains('raining'),false);
  assert.equal(painted('umbrella').length,0);
  assert.ok(sheep.classList.contains('disco'),'rain clearing leaves disco on');
});
test('animals loaded after weather and disco restore accessories immediately',()=>{
  const s=session();
  for(const [id,key,value] of [['pixel-disco','party','true'],['ktown-weather-clouds','rainAmount','51']]) {
    const el=s.document.createElement('div');el.id=id;el.dataset[key]=value;s.document.body.append(el);
  }
  s.load('goldfish.js');s.load('../sheep/sheep-overlay.js');const painted=observe(s);
  s.media.matches=true;s.advance(20);
  assert.equal(painted('glasses').length,3);
  assert.equal(painted('umbrella').length,3);
  assert.ok(s.document.getElementById('pasture-sheep').classList.contains('raining'));
  assert.ok(s.document.querySelectorAll('.sheep').every(el=>el.classList.contains('disco')));
});
