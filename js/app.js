const STORAGE_KEY = 'wuyin_gacha_pool_v1';
const DEFAULT_STATE = {
  notes: 3200,
  tickets: 6,
  fragments: 0,
  pity: 0,
  cards: {},
  history: []
};
let state = loadState();
let lastDrawType = 'one';
let currentFilter = 'all';

const MUSIC_KEY = 'wuyin_music_enabled_v1';
const CARD_AUDIO = {
  jiao_bawu: 'assets/audio/jiao_bawu.mp3',
  jiao_dizi: 'assets/audio/jiao_dizi.mp3',
  jiao_dongxiao: 'assets/audio/jiao_dongxiao.mp3',
  jiao_miaodi: 'assets/audio/jiao_miaodi.mp3',
  zhi_erhu: 'assets/audio/zhi_erhu.mp3',
  zhi_guzheng: 'assets/audio/zhi_guzheng.mp3',
  zhi_pipa: 'assets/audio/zhi_pipa.mp3',
  zhi_ruan: 'assets/audio/zhi_ruan.mp3',
  jiao_paixiao: 'assets/audio/jiao_paixiao.m4a',
  zhi_guqin: 'assets/audio/zhi_guqin.m4a'
};
let musicEnabled = localStorage.getItem(MUSIC_KEY) !== 'off';
let currentMusicCardId = null;
const cardAudioPlayer = new Audio();
cardAudioPlayer.preload = 'auto';
cardAudioPlayer.playsInline = true;

function updateMusicToggle(){
  const btn = document.getElementById('musicToggleBtn');
  if(!btn) return;
  btn.textContent = musicEnabled ? '音乐：开' : '音乐：关';
  btn.classList.toggle('off', !musicEnabled);
}
function setMusicEnabled(enabled){
  musicEnabled = enabled;
  localStorage.setItem(MUSIC_KEY, enabled ? 'on' : 'off');
  updateMusicToggle();
  if(!musicEnabled){
    stopCardMusic();
    setMusicHint('音乐已关闭');
  }else{
    toast('音乐已开启。若手机拦截自动播放，请点详情里的“播放音乐”。');
    if(currentMusicCardId) playCardMusic(currentMusicCardId);
  }
}
function ensureDetailMusicControl(){
  const content = document.querySelector('#detailModal .detail-content');
  if(!content) return null;
  let row = document.getElementById('detailMusicRow');
  if(!row){
    row = document.createElement('div');
    row.id = 'detailMusicRow';
    row.className = 'card-music-row';
    row.innerHTML = '<button id="detailMusicPlayBtn" class="mini-btn card-music-btn" type="button">播放音乐</button><span id="detailMusicHint" class="card-music-hint"></span>';
    content.appendChild(row);
    document.getElementById('detailMusicPlayBtn').onclick = () => {
      if(currentMusicCardId) playCardMusic(currentMusicCardId, true);
    };
  }
  return row;
}
function setMusicHint(msg){
  const hint = document.getElementById('detailMusicHint');
  if(hint) hint.textContent = msg || '';
}
function setMusicButtonVisible(visible, text='播放音乐'){
  const btn = document.getElementById('detailMusicPlayBtn');
  if(!btn) return;
  btn.textContent = text;
  btn.classList.toggle('hidden', !visible);
}
function stopCardMusic(){
  cardAudioPlayer.pause();
  try{ cardAudioPlayer.currentTime = 0; }catch(e){}
}
function playCardMusic(id, manual=false){
  currentMusicCardId = id;
  ensureDetailMusicControl();
  stopCardMusic();
  if(!musicEnabled){
    setMusicButtonVisible(false);
    setMusicHint('音乐已关闭');
    return;
  }
  if(!isOwned(id)){
    setMusicButtonVisible(false);
    setMusicHint('未获得的卡牌不能播放音乐');
    return;
  }
  const src = CARD_AUDIO[id];
  if(!src){
    setMusicButtonVisible(false);
    setMusicHint('这张卡暂未放入音频文件');
    return;
  }
  setMusicButtonVisible(false);
  setMusicHint(manual ? '正在播放……' : '正在尝试播放……');
  cardAudioPlayer.src = src;
  cardAudioPlayer.load();
  cardAudioPlayer.play().then(()=>{
    setMusicHint('正在播放乐器音色');
  }).catch(()=>{
    setMusicButtonVisible(true, '播放音乐');
    setMusicHint('手机浏览器拦截了自动播放，请点左侧按钮播放');
  });
}
function loadState(){try{const raw=localStorage.getItem(STORAGE_KEY);return raw?{...DEFAULT_STATE,...JSON.parse(raw)}:structuredClone(DEFAULT_STATE)}catch(e){return structuredClone(DEFAULT_STATE)}}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function structuredClone(obj){return JSON.parse(JSON.stringify(obj))}
function ownedCount(id){return state.cards[id]||0}
function isOwned(id){return ownedCount(id)>0}
function rarityClass(r){return 'rarity-'+r.toLowerCase()}
function rarityLabel(r){return (RARITIES[r] && RARITIES[r].name) ? RARITIES[r].name : r}
function rarityFullName(r){return `${rarityLabel(r)}器灵`}
function getCard(id){return CARDS.find(c=>c.id===id)}
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2200)}
function fragmentValue(rarity){return rarity==='SSR'?150:rarity==='SR'?50:rarity==='R'?20:10}
function duplicateCount(id){return Math.max(0, ownedCount(id)-1)}
function duplicateCards(){return CARDS.filter(c=>duplicateCount(c.id)>0)}
function totalDuplicateCount(){return CARDS.reduce((sum,c)=>sum+duplicateCount(c.id),0)}
function totalPotentialFragments(){return CARDS.reduce((sum,c)=>sum+duplicateCount(c.id)*fragmentValue(c.rarity),0)}
function renderResources(){document.getElementById('notesCount').textContent=state.notes;document.getElementById('ticketCount').textContent=state.tickets;const fragmentEl=document.getElementById('fragmentCount');if(fragmentEl)fragmentEl.textContent=state.fragments||0;document.getElementById('pityText').textContent=`${state.pity} / 80`;document.getElementById('pityBar').style.width=`${Math.min(100,state.pity/80*100)}%`}
function renderFeatured(){const ssr=CARDS.filter(c=>c.rarity==='SSR');document.getElementById('featuredRow').innerHTML=ssr.map(c=>`<div class="featured-chip"><b>${c.toneName}</b> · ${c.instrument}</div>`).join('')}
function renderToneProgress(){const box=document.getElementById('toneProgress');box.innerHTML=Object.entries(TONES).map(([id,t])=>{const list=CARDS.filter(c=>c.tone===id);const owned=list.filter(c=>isOwned(c.id)).length;const pct=owned/list.length*100;return `<div class="tone-item" style="color:${t.color}"><div class="tone-row"><div class="tone-name"><i class="tone-dot"></i><span>${t.mode} · ${t.theme}</span></div><b>${owned}/${list.length}</b></div><div class="tone-bar"><span style="width:${pct}%"></span></div></div>`}).join('')}
function renderPreview(){let list= currentFilter==='all'?CARDS:CARDS.filter(c=>c.rarity===currentFilter);document.getElementById('cardPreview').innerHTML=list.map(cardHTML).join('');document.querySelectorAll('.preview-card').forEach(el=>el.addEventListener('click',()=>openDetail(el.dataset.id)))}
function cardHTML(c){const owned=isOwned(c.id);return `<div class="preview-card ${owned?'':'locked-card'}" data-id="${c.id}"><img src="${c.image}" alt="${c.name}"><span class="rarity-badge ${rarityClass(c.rarity)}">${rarityLabel(c.rarity)}</span>${owned?`<span class="owned-badge">已拥有 ×${ownedCount(c.id)}</span>`:''}<div class="card-mask"><b>${owned?c.name:'？？？'}</b><span>${c.toneName} · ${c.instrument}</span></div></div>`}
function renderBagFilters(){const sel=document.getElementById('bagToneFilter');sel.innerHTML='<option value="all">全部五音</option>'+Object.entries(TONES).map(([id,t])=>`<option value="${id}">${t.mode}</option>`).join('')}
function renderBag(){const tone=document.getElementById('bagToneFilter').value;const rarity=document.getElementById('bagRarityFilter').value;let list=CARDS.filter(c=>(tone==='all'||c.tone===tone)&&(rarity==='all'||c.rarity===rarity));document.getElementById('bagGrid').innerHTML=list.map(c=>`<div class="bag-item ${isOwned(c.id)?'':'locked-card'}" data-id="${c.id}"><img src="${c.image}"><span class="rarity-badge ${rarityClass(c.rarity)}">${rarityLabel(c.rarity)}</span>${isOwned(c.id)?`<span class="owned-badge">×${ownedCount(c.id)}</span>`:''}<div class="card-mask"><b>${isOwned(c.id)?c.name:'未归藏'}</b><span>${c.instrument}</span></div></div>`).join('');document.querySelectorAll('.bag-item').forEach(el=>el.addEventListener('click',()=>openDetail(el.dataset.id)))}
function updateAll(){renderResources();renderToneProgress();renderPreview();renderBag();renderDecompose();saveState()}
function rollRarity(forceSR=false){if(state.pity>=79)return 'SSR';if(forceSR){const r=Math.random();return r<0.20?'SSR':'SR'}const r=Math.random();if(r<0.03)return 'SSR';if(r<0.15)return 'SR';if(r<0.40)return 'R';return 'N'}
function pickCardByRarity(rarity){const pool=CARDS.filter(c=>c.rarity===rarity);return pool[Math.floor(Math.random()*pool.length)]}
function drawCards(count){const results=[];let forceIndex=-1;if(count===10) forceIndex=9;for(let i=0;i<count;i++){let force=false;if(i===forceIndex && !results.some(c=>c.rarity==='SR'||c.rarity==='SSR'))force=true;let rarity=rollRarity(force);let card=pickCardByRarity(rarity);const before=ownedCount(card.id);state.pity++;if(card.rarity==='SSR')state.pity=0;state.cards[card.id]=(state.cards[card.id]||0)+1;const isNew=before===0;results.push({...card,isNew,wasDuplicate:!isNew});state.history.unshift({id:card.id,time:Date.now(),new:isNew});}return results}
function canPay(count){const ticketNeed=count, noteNeed=count*160;if(state.tickets>=ticketNeed){state.tickets-=ticketNeed;return true}if(state.notes>=noteNeed){state.notes-=noteNeed;return true}toast('资源不足，已为你保留“补充资源”按钮');return false}
async function startDraw(count){if(!canPay(count))return;lastDrawType=count===1?'one':'ten';const results=drawCards(count);saveState();updateAll();await playAnimation(results);showResults(results)}
function createAnimCard(card,small=false){const div=document.createElement('div');div.className=`flying-card ${card.rarity.toLowerCase()}`;div.dataset.id=card.id;div.innerHTML=`<div class="inner"><div class="face back"></div><div class="face front"><img src="${card.image}"></div></div>`;return div}
function playSSRPrelude(){
  return new Promise(resolve=>{
    const layer=document.getElementById('gachaLayer');
    const omen=document.createElement('div');
    omen.className='ssr-omen';
    omen.innerHTML=`
      <div class="ssr-omen-scroll">
        <div class="ssr-omen-seal">天籁</div>
        <div class="ssr-omen-cloud cloud-a"></div>
        <div class="ssr-omen-cloud cloud-b"></div>
        <div class="ssr-omen-text">金纹启卷 · 天籁将临</div>
      </div>`;
    layer.appendChild(omen);
    setTimeout(()=>omen.classList.add('show'),30);
    setTimeout(()=>omen.classList.add('leave'),1450);
    setTimeout(()=>{omen.remove();resolve();},1900);
  });
}
function playAnimation(results){
  return new Promise(resolve=>{
    const layer=document.getElementById('gachaLayer'),stage=document.getElementById('gachaStage'),hint=document.getElementById('revealHint');
    const hasSSR=results.some(c=>c.rarity==='SSR');
    const isTenDraw=results.length===10;
    layer.classList.remove('hidden');
    stage.innerHTML='';
    hint.classList.add('hidden');
    let done=false;
    function finish(){
      if(done)return;
      done=true;
      layer.querySelectorAll('.ssr-omen').forEach(el=>el.remove());
      layer.classList.add('hidden');
      resolve();
    }
    document.getElementById('skipBtn').onclick=finish;
    const startReveal=async()=>{
      if(hasSSR){
        await playSSRPrelude();
      }
      if(done)return;
      if(results.length===1){
        const card=createAnimCard(results[0]);
        stage.appendChild(card);
        hint.textContent=hasSSR?'天籁将临，点击卡背翻开':'点击卡背翻开';
        hint.classList.remove('hidden');
        card.addEventListener('click',()=>{
          card.classList.add('flipped');
          hint.classList.add('hidden');
          if(results[0].rarity==='SSR')ssrFlash();
          setTimeout(finish,1200);
        });
      }else{
        const grid=document.createElement('div');
        grid.className='ten-grid';
        stage.appendChild(grid);
        results.forEach((card,i)=>{
          setTimeout(()=>{
            if(done)return;
            const el=createAnimCard(card,true);
            grid.appendChild(el);
            el.addEventListener('click',()=>{
              el.classList.add('flipped');
              if(card.rarity==='SSR')ssrFlash();
            });
          },i*90);
        });
        hint.textContent=hasSSR?'天籁气息已现，点击卡背翻开':'点击卡背翻开，或等待自动揭晓';
        hint.classList.remove('hidden');
        setTimeout(()=>{
          if(done)return;
          grid.querySelectorAll('.flying-card').forEach(el=>el.classList.add('flipped'));
          if(hasSSR)ssrFlash();
          setTimeout(finish,1500);
        },hasSSR?2600:2200);
      }
    };
    setTimeout(startReveal,850);
  });
}
function ssrFlash(){const f=document.createElement('div');f.className='flash-ssr';document.body.appendChild(f);setTimeout(()=>f.remove(),1000)}
function showResults(results){const modal=document.getElementById('resultModal'),grid=document.getElementById('resultGrid');grid.innerHTML=results.map(c=>`<div class="result-item ${c.isNew?'new':'dupe'}" data-id="${c.id}"><img src="${c.image}"><span class="rarity-badge ${rarityClass(c.rarity)}">${rarityLabel(c.rarity)}</span>${c.isNew?'<span class="owned-badge">初得</span>':'<span class="owned-badge">重复</span>'}<div class="card-mask"><b>${c.name}</b><span>${c.instrument}</span></div></div>`).join('');grid.querySelectorAll('.result-item').forEach(el=>el.addEventListener('click',()=>openDetail(el.dataset.id)));modal.classList.remove('hidden')}
function renderDecompose(){const listEl=document.getElementById('decomposeList');if(!listEl)return;const dupes=duplicateCards();const fragmentEl=document.getElementById('decomposeFragmentCount');const dupeEl=document.getElementById('decomposeDupeCount');const potentialEl=document.getElementById('decomposePotentialCount');if(fragmentEl)fragmentEl.textContent=state.fragments||0;if(dupeEl)dupeEl.textContent=totalDuplicateCount();if(potentialEl)potentialEl.textContent=totalPotentialFragments();if(!dupes.length){listEl.innerHTML='<div class="empty-decompose">暂无可分解的重复卡。抽到第二张及以上同名卡后，会出现在这里。</div>';return;}listEl.innerHTML=dupes.map(c=>{const count=duplicateCount(c.id);const gain=count*fragmentValue(c.rarity);return `<div class="decompose-item" data-id="${c.id}">
    <img src="${c.image}" alt="${c.name}">
    <div class="decompose-info">
      <div><span class="rarity-badge inline ${rarityClass(c.rarity)}">${rarityLabel(c.rarity)}</span><b>${c.name}</b></div>
      <p>${c.toneName} · ${c.instrument} · 拥有 ${ownedCount(c.id)} 张，可分解 ${count} 张</p>
    </div>
    <div class="decompose-gain">+${gain} 碎片</div>
    <button class="mini-btn decompose-one-btn" data-id="${c.id}">分解</button>
  </div>`}).join('');listEl.querySelectorAll('.decompose-one-btn').forEach(btn=>btn.addEventListener('click',(e)=>{e.stopPropagation();decomposeCard(btn.dataset.id)}));}
function decomposeCard(id){const c=getCard(id);const count=duplicateCount(id);if(!c||count<=0){toast('没有可分解的重复卡');return;}const gain=count*fragmentValue(c.rarity);state.cards[id]-=count;state.fragments=(state.fragments||0)+gain;state.history.unshift({id,time:Date.now(),type:'decompose',count,gain});updateAll();toast(`已分解 ${c.instrument} ×${count}，获得 ${gain} 音律碎片`)}
function decomposeAll(){const dupes=duplicateCards();if(!dupes.length){toast('暂无可分解的重复卡');return;}let totalCards=0,totalFragments=0;dupes.forEach(c=>{const count=duplicateCount(c.id);const gain=count*fragmentValue(c.rarity);state.cards[c.id]-=count;totalCards+=count;totalFragments+=gain;});state.fragments=(state.fragments||0)+totalFragments;state.history.unshift({time:Date.now(),type:'decompose_all',count:totalCards,gain:totalFragments});updateAll();toast(`已分解 ${totalCards} 张重复卡，获得 ${totalFragments} 音律碎片`)}
function openDetail(id){const c=getCard(id);document.getElementById('detailImage').src=c.image;const badge=document.getElementById('detailRarity');badge.textContent=c.rarityName;badge.className='detail-rarity '+rarityClass(c.rarity);document.getElementById('detailName').textContent=isOwned(c.id)?c.name:'未归藏器灵';document.getElementById('detailDesc').textContent=isOwned(c.id)?c.description:'该器灵尚未归藏，完整卡面与设定将在抽到后显示。';document.getElementById('detailInstrument').textContent=c.instrument;document.getElementById('detailTone').textContent=c.toneName;document.getElementById('detailElement').textContent=c.element;document.getElementById('detailOwned').textContent=isOwned(c.id)?`拥有 ${ownedCount(c.id)} 张`:'尚未拥有';document.getElementById('detailModal').classList.remove('hidden');playCardMusic(c.id)}
function openModal(id){document.getElementById(id).classList.remove('hidden')}
function closeModal(id){document.getElementById(id).classList.add('hidden');if(id==='detailModal')stopCardMusic()}
// events
document.getElementById('drawOneBtn').onclick=()=>startDraw(1);document.getElementById('drawTenBtn').onclick=()=>startDraw(10);document.getElementById('againOneBtn').onclick=()=>{closeModal('resultModal');startDraw(1)};document.getElementById('againTenBtn').onclick=()=>{closeModal('resultModal');startDraw(10)};document.getElementById('openBagBtn').onclick=()=>{renderBag();openModal('bagModal')};document.getElementById('openDecomposeBtn').onclick=()=>{renderDecompose();openModal('decomposeModal')};document.getElementById('decomposeAllBtn').onclick=decomposeAll;document.getElementById('openRulesBtn').onclick=()=>openModal('rulesModal');document.getElementById('addResourceBtn').onclick=()=>{state.notes+=3200;state.tickets+=10;updateAll();toast('已补充 3200 音符与 10 张抽卡券')};document.getElementById('resetBtn').onclick=()=>{if(confirm('确认重置所有抽卡数据？')){state=structuredClone(DEFAULT_STATE);updateAll();toast('已重置存档')}};document.querySelectorAll('[data-close]').forEach(btn=>btn.addEventListener('click',()=>closeModal(btn.dataset.close)));document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)closeModal(m.id)}));document.querySelectorAll('.filter-btn').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');currentFilter=btn.dataset.filter;renderPreview()}));document.getElementById('bagToneFilter').onchange=renderBag;document.getElementById('bagRarityFilter').onchange=renderBag;const musicToggleButton=document.getElementById('musicToggleBtn');if(musicToggleButton){musicToggleButton.onclick=()=>setMusicEnabled(!musicEnabled)};

const openProgressButton = document.getElementById('openProgressBtn');
const closeProgressButton = document.getElementById('closeProgressBtn');
const progressPanel = document.querySelector('.side');
if(openProgressButton && progressPanel){
  openProgressButton.onclick = () => progressPanel.classList.add('open');
}
if(closeProgressButton && progressPanel){
  closeProgressButton.onclick = () => progressPanel.classList.remove('open');
}
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape' && progressPanel) progressPanel.classList.remove('open');
});
updateMusicToggle();renderFeatured();renderBagFilters();updateAll();
