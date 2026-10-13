const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {inflateSync}=require('node:zlib');

function renderer() {
  const window={addEventListener(){}};
  const document={getElementById:()=>null,body:{append(){}},addEventListener(){},
    createElement:()=>({style:{},setAttribute(){},getContext:()=>new Proxy({}, {get:()=>()=>{}})})};
  const source=fs.readFileSync(__dirname+'/goldfish.js','utf8').replace('  function dispense(x,y) {',
    '  window.art={landSprite,sprites,fish,animalScale,standingY};\n  function dispense(x,y) {');
  vm.runInNewContext(source,{window,document,innerWidth:1000,innerHeight:700,AbortController,
    matchMedia:()=>({matches:false}),requestAnimationFrame(){}});
  return window.art;
}

// Decode the RGBA8 reference PNG using Node alone so the pixel equality check
// needs neither a browser nor an image library. All PNG row filters are handled.
function referencePixels(file=__dirname+'/../sheep/sheep-pixel.png') {
  const png=fs.readFileSync(file), chunks=[];
  let width,height;
  for(let offset=8;offset<png.length;) {
    const length=png.readUInt32BE(offset), type=png.toString('ascii',offset+4,offset+8);
    const data=png.subarray(offset+8,offset+8+length);
    if(type==='IHDR') {
      width=data.readUInt32BE(0);height=data.readUInt32BE(4);
      assert.equal(data[8],8);assert.equal(data[9],6);assert.equal(data[12],0);
    }
    if(type==='IDAT') chunks.push(data);
    offset+=length+12;
  }
  const raw=inflateSync(Buffer.concat(chunks)), pixels=Buffer.alloc(width*height*4), stride=width*4;
  const paeth=(a,b,c)=>{
    const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
    return pa<=pb && pa<=pc ? a : pb<=pc ? b : c;
  };
  for(let y=0;y<height;y++) {
    const filter=raw[y*(stride+1)];assert.ok(filter<=4);
    for(let x=0;x<stride;x++) {
      const i=y*stride+x,a=x>=4 ? pixels[i-4] : 0,b=y ? pixels[i-stride] : 0,c=y && x>=4 ? pixels[i-stride-4] : 0;
      pixels[i]=(raw[y*(stride+1)+x+1]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;
    }
  }
  return {pixels,width,height};
}

test('all three fish end in the actual pasture sheep, pixel for pixel, at its 3x scale',()=>{
  const art=renderer(), {pixels,width}=referencePixels();
  for(const original of art.fish) {
    const f={...original,landAge:300,grounded:true,resting:true};
    const sprite=art.landSprite(f);
    assert.equal(art.animalScale(f)*2,3);
    assert.equal(art.standingY(f)+20*art.animalScale(f),344,'feet align with the native sheep floor');
    for(let y=0;y<40;y++) for(let x=0;x<64;x++) {
      const sx=x-13,sy=y-16;
      const i=(sy*width+sx)*4;
      const expected=sx>=0 && sx<32 && sy>=0 && sy<24 && pixels[i+3]
        ? '#'+pixels.subarray(i,i+3).toString('hex') : null;
      assert.equal(sprite.pixels[y*64+x],expected,`skin ${f.id}, pixel ${x},${y}`);
    }
    const walking=[0,1,2,3].map(walkPhase=>art.landSprite({...f,resting:false,walkPhase}));
    for(let i=0;i<walking.length;i++) {
      const bob=i%2;
      for(let y=0;y<39;y++)for(let x=0;x<64;x++)
        assert.equal(walking[i].pixels[y*64+x],sprite.pixels[(y+bob)*64+x],
          'terminal walking frames match the native flock waddle');
    }
    assert.notDeepEqual(walking[0].pixels,walking[1].pixels,'two native waddle states alternate');
  }
});

test('evolution starts with the existing fish art and every intermediate silhouette stays visible',()=>{
  const art=renderer();
  for(const original of art.fish) {
    for(let pose=0;pose<4;pose++) {
      const f={...original,landAge:0,resting:false,walkPhase:pose}, walking=art.landSprite(f), swimming=art.sprites[f.id][pose*4];
      for(let y=0;y<23;y++) for(let x=0;x<48;x++)
        assert.equal(walking.pixels[y*64+x],swimming.pixels[y*48+x],'original fish body is preserved above the legs');
      for(let step=0;step<=60;step++) {
        const sprite=art.landSprite({...f,landAge:step*5});
        assert.ok(sprite.pixels.filter(Boolean).length>180,`no disappearing body at step ${step}`);
        assert.ok(sprite.pixels.every(color=>color===null || /^#[0-9a-f]{6}$/i.test(color)),'solid, valid pixel colors');
        assert.ok(sprite.pixels.slice(39*64).every(color=>color===null),'feet are not clipped at the canvas edge');
        assert.ok(sprite.eye,'every stage and in-between pose has an eye');
        assert.ok(['#302d27','#43453f'].includes(sprite.pixels[sprite.eye.y*64+sprite.eye.x]),
          `pupil stays dark during evolution at step ${step}`);
      }
    }
  }
});

test('walking goldfish has thin legs and early land animals have solid feet without toes',()=>{
  const art=renderer();
  for(const original of art.fish) {
    const f={...original,resting:true,walkPhase:0,landAge:0};
    const goldfish=art.landSprite(f);
    assert.equal(goldfish.pixels.slice(30*64,31*64).filter(Boolean).length,6,'two three-pixel-wide legs');
    for(let stage=2;stage<=5;stage++) {
      const sprite=art.landSprite({...f,landAge:stage*30});
      assert.ok(sprite.pixels.slice(37*64,38*64).filter(Boolean).length<=4,'rounded foot ends have no splayed toe pixels');
    }
  }
});

test('all exported walking frames match the renderer used by the live animation',()=>{
  const {createHash}=require('node:crypto');
  const manifest=JSON.parse(fs.readFileSync(__dirname+'/walking-sprites.json','utf8'));
  assert.equal(manifest.sourceSha256,createHash('sha256').update(fs.readFileSync(__dirname+'/goldfish.js')).digest('hex'),
    'regenerate walking atlases after changing the renderer');
  const art=renderer();
  for(const sheet of manifest.sheets) {
    const {pixels,width,height}=referencePixels(__dirname+'/'+sheet.file);
    assert.equal(width,256);assert.equal(height,440);
    for(let stage=0;stage<11;stage++)for(let pose=0;pose<4;pose++) {
      const sprite=art.landSprite({...art.fish[sheet.id],landAge:stage*30,walkPhase:pose,resting:false});
      sprite.pixels.forEach((color,i)=>{
        const at=((stage*40+Math.floor(i/64))*width+pose*64+i%64)*4;
        const actual=pixels[at+3] ? '#'+pixels.subarray(at,at+3).toString('hex') : null;
        assert.equal(actual,color,`${sheet.name}, stage ${stage}, pose ${pose}, pixel ${i}`);
      });
    }
  }
});
