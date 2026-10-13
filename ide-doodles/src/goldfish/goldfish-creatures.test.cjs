const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {session}=require('./test-dom.cjs');
function setup(storage) {
  const s=session(storage);s.load('../sheep/sheep-overlay.js');s.load('goldfish.js');
  return s;
}
test('all random buckets now choose sheep and survive reload',()=>{
  for(const roll of [.1,.5,.9]) {
    const kind='sheep';
    const s=setup();vm.runInContext(`Math.random=()=>${roll}`,s.context);
    const f=s.window.fishState().fish[0];f.grounded=true;
    s.advance(40);assert.equal(f.evolution,kind);
    f.landAge=299.98;s.advance(60);assert.equal(f.kind,kind);
    s.event(s.window,'beforeunload');
    const next=setup(new Map(s.storage)),restored=next.window.fishState().fish[0];
    assert.equal(restored.kind,kind);assert.equal(restored.landAge,300);
    assert.equal(restored.evolution,kind);
  }
});
test('saved bird and frog branches migrate to sheep without losing progress',()=>{
  for(const kind of ['frog','bird']) for(const complete of [false,true]) {
    const s=setup(),f=s.window.fishState().fish[0];
    Object.assign(f,{kind:complete?kind:'fish',evolution:kind,landAge:complete?300:120,grounded:!complete||kind==='frog'});
    s.event(s.window,'beforeunload');
    const next=setup(new Map(s.storage)),restored=next.window.fishState().fish[0];
    assert.equal(restored.evolution,'sheep');
    assert.equal(restored.kind,complete?'sheep':'fish');
    assert.equal(restored.landAge,complete?300:120);
    assert.equal(restored.grounded,true);
  }
});
test('returning an unfinished fish to water resets its branch',()=>{
  const s=setup(),f=s.window.fishState().fish[0];
  Object.assign(f,{grounded:true,evolution:'sheep',landAge:90});s.advance(40);
  s.pointer(s.window,'pointerdown',f.x*2,f.y*2);s.pointer(s.window,'pointermove',300,150);s.pointer(s.window,'pointerup',300,150);
  assert.equal(f.landAge,0);assert.equal(f.evolution,null);assert.equal(f.kind,'fish');
});
