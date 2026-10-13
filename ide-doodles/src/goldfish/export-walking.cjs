// Export the same cached poses that goldfish.js draws at runtime. Node only.
// Run: node ide-doodles/src/goldfish/export-walking.cjs
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {deflateSync}=require('node:zlib'),{createHash}=require('node:crypto');
const source=fs.readFileSync(path.join(__dirname,'goldfish.js'),'utf8');
const window={addEventListener(){}};
const document={getElementById:()=>null,body:{append(){}},addEventListener(){},
  createElement:()=>({style:{},setAttribute(){},getContext:()=>new Proxy({}, {get:()=>()=>{}})})};
vm.runInNewContext(source.replace('  function dispense(x,y) {',
  '  window.art={landSprite,landForms,fish};\n  function dispense(x,y) {'),{
  window,document,innerWidth:1000,innerHeight:700,AbortController,
  matchMedia:()=>({matches:false}),requestAnimationFrame(){}});
const {art}=window;
const crcTable=Array.from({length:256},(_,n)=>{
  for(let bit=0;bit<8;bit++)n=n&1 ? 0xedb88320^(n>>>1) : n>>>1;
  return n>>>0;
});
function chunk(type,data){
  const body=Buffer.concat([Buffer.from(type),data]);let crc=0xffffffff;
  for(const byte of body)crc=crcTable[(crc^byte)&255]^(crc>>>8);
  const size=Buffer.alloc(4),sum=Buffer.alloc(4);size.writeUInt32BE(data.length);sum.writeUInt32BE((crc^0xffffffff)>>>0);
  return Buffer.concat([size,body,sum]);
}
function png(width,height,pixels){
  const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
  const rows=Buffer.alloc(height*(width*4+1));
  for(let y=0;y<height;y++)pixels.copy(rows,y*(width*4+1)+1,y*width*4,(y+1)*width*4);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
}
const frameWidth=64,frameHeight=40,columns=4,width=frameWidth*columns,height=frameHeight*art.landForms.length;
const names=['orange','cream','coral'];
const sheets=names.map((name,id)=>{
  const data=Buffer.alloc(width*height*4);
  for(let stage=0;stage<art.landForms.length;stage++)for(let pose=0;pose<columns;pose++){
    const sprite=art.landSprite({...art.fish[id],landAge:stage*30,walkPhase:pose,resting:false});
    sprite.pixels.forEach((color,i)=>{
      if(!color)return;
      const at=((stage*frameHeight+Math.floor(i/frameWidth))*width+pose*frameWidth+i%frameWidth)*4;
      Buffer.from(color.slice(1),'hex').copy(data,at);data[at+3]=255;
    });
  }
  const file='walking-'+name+'.png';fs.writeFileSync(path.join(__dirname,file),png(width,height,data));
  return {id,name,file};
});
const manifest={source:'goldfish.js',sourceSha256:createHash('sha256').update(source).digest('hex'),
  frameWidth,frameHeight,columns,rows:art.landForms.length,sheets,
  stages:art.landForms.map((form,index)=>({index,name:form.name,seconds:index*30})),
  terminalBehavior:'At 300 seconds the animal joins the native pasture sheep controller. Final atlas frames match its two-state waddle.'};
fs.writeFileSync(path.join(__dirname,'walking-sprites.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Exported ${sheets.length*columns*art.landForms.length} walking frames across ${sheets.length} palettes.`);
