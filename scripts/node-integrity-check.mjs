// 雾锁迷踪 · 节点完整性自动巡检
// 检查每个场景节点的完整渲染输出，报告文本被截断、HTML断裂等问题
// 用法: node scripts/node-integrity-check.mjs
import fs from 'fs';
import vm from 'vm';

const E = {
  state:{clues:[],items:[],contacts:[],flags:{},chapter:0,sceneLog:[],visitedNodes:{},endings:[],inGameTime:{day:1,hour:14,minute:0},pressure:{heat:0,deadline:{day:2,hour:23,minute:0}},weatherIdx:0,atmosphere:''},
  addClue(n,d){if(!this.state.clues.find(c=>c.name===n))this.state.clues.push({name:n,desc:d})},
  hasClue(n){return this.state.clues.some(c=>c.name===n)},
  addItem(n,d){if(!this.state.items.find(i=>i.name===n))this.state.items.push({name:n,desc:d})},
  hasItem(n){return this.state.items.some(i=>i.name===n)},
  addContact(n){if(!this.state.contacts.includes(n))this.state.contacts.push(n)},
  setFlag(k,v){this.state.flags[k]=v},getFlag(k){return this.state.flags[k]},
  discoverRelation(){},registerRelation(){},setWeather(){},
  renderAtmosphere(){return''},setTime(){},advanceTime(){},spendTime(){},
  timeToMinutes(){return 0},pressureLabel(){return''},
  caseStrength(){return{name:'',desc:''}},renderClueWall(){return''},
  canDeduce(){return false},openDeduction(){},
};
function strip(s){return s.replace(/<[^>]*>/g,'').replace(/&[^;]+;/g,' ').replace(/\s+/g,' ').trim()}

try {
  const chapterFiles = (() => {
    const manifest = fs.readFileSync('src/story-chapters.js', 'utf8');
    const files = [];
    for (const quote of ["'", '"']) {
      for (const part of manifest.split(quote)) {
        if (part.startsWith('src/story/') && part.endsWith('.js')) files.push(part);
      }
    }
    return [...new Set(files)];
  })();
  const storyCode = [fs.readFileSync('src/story.js','utf8'), ...chapterFiles.map(f => fs.readFileSync(f,'utf8'))].join('\n');
  const code = storyCode.replace(/const nodes =/g, 'var nodes =');
  const sandbox = vm.createContext({E,console,String,Number,Boolean,Array,Object,Math,RegExp,Date,setTimeout,window:{}});
  vm.runInContext(code, sandbox);
  const nodes = sandbox.nodes;
  const keys = Object.keys(nodes||{});
  console.log(`\n📋 巡检 ${keys.length} 个剧情节点...\n`);

  const reports=[];
  for(const id of keys){
    const n=nodes[id]; if(!n||!n.text) continue;
    try{
      const raw=typeof n.text==='function'?n.text(E.state):n.text;
      const plain=strip(raw);
      if(plain&&plain.length>2){
        const ot=(raw.match(/<span[^>]*>/g)||[]).length;
        const ct=(raw.match(/<\/span>/g)||[]).length;
        if(ot!==ct) reports.push({t:'ERROR',id,m:`<span>未闭合（打开${ot}关闭${ct}）`});
        const lc=plain.charAt(plain.length-1);
        if(lc==='：') reports.push({t:'WARN',id,m:'文本以冒号结尾，确认是否完整'});
      }
      if(n.choices){
        const ch=typeof n.choices==='function'?n.choices(E.state):n.choices;
        for(const c of(ch||[])){
          let target='';
          if(typeof c.goto==='function'){ try{target=c.goto(E.state)||''}catch(e){} }
          else target=typeof c.goto==='string'?c.goto:'';
          if(target&&!nodes[target]) reports.push({t:'ERROR',id,m:`goto「${target}」不存在`});
        }
      }
    }catch(e){reports.push({t:'ERROR',id,m:e.message.slice(0,80)});}
  }

  const errs=reports.filter(r=>r.t==='ERROR'), warns=reports.filter(r=>r.t==='WARN');
  console.log(`结果: ✅ ${keys.length-errs.length-warns.length} | ⚠️ ${warns.length} | ❌ ${errs.length}\n`);
  for(const r of reports) console.log(`${r.t==='ERROR'?'❌':'⚠️'} [${r.id}] ${r.m}`);
  if(!reports.length) console.log('✨ 全部通过');
  process.exit(errs.length?1:0);
}catch(e){ console.log('❌ 加载失败:', e.message); process.exit(1); }
