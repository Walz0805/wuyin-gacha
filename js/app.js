const STORAGE_KEY = 'wuyin_gacha_piece_demo_v3';
const DEFAULT_STATE = { notes: 3200, tickets: 6, fragments: 0, pity: 0, pitySR: 0, pitySSR: 0, pieces: {}, duplicatePieces: {}, history: [] };
let state = loadState();
let lastDrawType = 'one';
let currentFilter = 'all';
const MUSIC_KEY = 'wuyin_music_enabled_v1';
let musicEnabled = localStorage.getItem(MUSIC_KEY) !== 'off';
let currentCardAudio = null;

function structuredClone(obj){ return JSON.parse(JSON.stringify(obj)); }
function loadState(){ try{ const raw=localStorage.getItem(STORAGE_KEY); return raw ? { ...structuredClone(DEFAULT_STATE), ...JSON.parse(raw) } : structuredClone(DEFAULT_STATE); }catch(e){ return structuredClone(DEFAULT_STATE); } }
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function getCard(id){ return CARDS.find(c=>c.id===id); }
function rarityClass(r){ return 'rarity-'+r.toLowerCase(); }
function rarityLabel(r){ return RARITIES[r]?.name || r; }
function toast(msg){ const el=document.getElementById('toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),2200); }
function ensurePieces(id){ if(!state.pieces[id]) state.pieces[id] = {}; return state.pieces[id]; }
function hasPiece(id, p){ return !!ensurePieces(id)[p]; }
function ownedPiecesCount(id){ return Object.keys(ensurePieces(id)).length; }
function isOwned(id){ return ownedPiecesCount(id) >= PIECE_COUNT; }
function progressText(id){ return `${ownedPiecesCount(id)} / ${PIECE_COUNT}`; }
function totalOwnedPieces(){ return CARDS.reduce((s,c)=>s+ownedPiecesCount(c.id),0); }
function decomposeValueByRarity(rarity){ return (typeof DUPLICATE_PIECE_FRAGMENT_VALUES !== 'undefined' && DUPLICATE_PIECE_FRAGMENT_VALUES[rarity]) || DUPLICATE_PIECE_FRAGMENT_VALUE || 1; }
function fragmentValue(rarity){ return decomposeValueByRarity(rarity || 'SSR'); }
function ensureDuplicatePieces(id){ if(!state.duplicatePieces) state.duplicatePieces={}; if(!state.duplicatePieces[id]) state.duplicatePieces[id]={}; return state.duplicatePieces[id]; }
function duplicatePieceCount(id, pieceIndex){ return Number(state.duplicatePieces?.[id]?.[pieceIndex] || 0); }
function addDuplicatePiece(id, pieceIndex){ const bag=ensureDuplicatePieces(id); bag[pieceIndex]=(Number(bag[pieceIndex])||0)+1; }
function removeDuplicatePiece(id, pieceIndex, count=1){ const bag=ensureDuplicatePieces(id); const next=Math.max(0,(Number(bag[pieceIndex])||0)-count); if(next>0) bag[pieceIndex]=next; else delete bag[pieceIndex]; if(Object.keys(bag).length===0) delete state.duplicatePieces[id]; }
function duplicateItems(){ const items=[]; CARDS.forEach(card=>{ for(let p=1;p<=PIECE_COUNT;p++){ const count=duplicatePieceCount(card.id,p); if(count>0){ const value=decomposeValueByRarity(card.rarity); items.push({card, pieceIndex:p, count, value, total:count*value, pieceImage:pieceImage(card.id,p)}); } } }); return items; }
function duplicateCount(id,pieceIndex){ return duplicatePieceCount(id,pieceIndex); }
function duplicateCards(){ return duplicateItems(); }
function totalDuplicateCount(){ return duplicateItems().reduce((s,item)=>s+item.count,0); }
function totalPotentialFragments(){ return duplicateItems().reduce((s,item)=>s+item.total,0); }

function updateMusicToggle(){ const btn=document.getElementById('musicToggleBtn'); if(!btn) return; btn.textContent=musicEnabled?'音乐：开':'音乐：关'; btn.classList.toggle('off', !musicEnabled); }
function setMusicEnabled(enabled){ musicEnabled=enabled; localStorage.setItem(MUSIC_KEY, enabled?'on':'off'); updateMusicToggle(); if(!enabled) stopCardMusic(); }
function stopCardMusic(){ if(currentCardAudio){ currentCardAudio.pause(); currentCardAudio.currentTime=0; currentCardAudio=null; } }
function uniqueAudioList(list){ return [...new Set(list.filter(Boolean))]; }
function playAudioWithFallback(list, options={}){
  if(!musicEnabled) return;
  if(typeof options === 'string') options={failMessage:options};
  const candidates=uniqueAudioList(list);
  if(!candidates.length) return;
  if(options.stopBefore !== false) stopCardMusic();
  let index=0;
  const start=Math.max(0, Number(options.start || 0));
  const end=Math.max(0, Number(options.end || 0));
  function tryNext(){
    if(index>=candidates.length){
      if(options.failMessage) toast(options.failMessage);
      return;
    }
    const src=candidates[index++];
    const audio=new Audio(src);
    let handled=false;
    currentCardAudio=audio;
    audio.onerror=()=>{
      if(handled) return;
      handled=true;
      if(currentCardAudio===audio) currentCardAudio=null;
      tryNext();
    };
    audio.addEventListener('loadedmetadata',()=>{
      if(start>0){
        if(Number.isFinite(audio.duration) && start>=audio.duration){
          if(currentCardAudio===audio) currentCardAudio=null;
          tryNext();
          return;
        }
        audio.currentTime=start;
      }
    },{once:true});
    if(end>start){
      audio.addEventListener('timeupdate',()=>{
        if(audio.currentTime>=end) stopCardMusic();
      });
    }
    audio.play().then(()=>{
      handled=true;
    }).catch(err=>{
      if(handled) return;
      handled=true;
      if(currentCardAudio===audio) currentCardAudio=null;
      if(err && err.name==='NotAllowedError'){
        toast('音乐播放被浏览器拦截，请再点一次');
      }else{
        tryNext();
      }
    });
  }
  tryNext();
}
function fullAudioCandidates(card){ return [card.fullAudio, `assets/audio/${card.id}.mp3`, `assets/audio/${card.id}_full.mp3`, card.pieceAudio]; }
function pieceAudioCandidates(card, pieceIndex){ return [card.pieceAudio, card.fullAudio, `assets/audio/${card.id}.mp3`, CARD_AUDIO[`${card.id}_p${pieceIndex}`]]; }
function playPieceMusic(cardId, pieceIndex){
  const c=getCard(cardId);
  if(!musicEnabled || !c) return;
  const segment=Number(c.audioSegmentSeconds || 10);
  const start=(pieceIndex-1)*segment;
  const end=pieceIndex*segment;
  if(c.pieceAudio || c.fullAudio){
    playAudioWithFallback(pieceAudioCandidates(c,pieceIndex), {start,end,failMessage:'请放入对应角色音乐文件'});
    return;
  }
  playAudioWithFallback([CARD_AUDIO[`${cardId}_p${pieceIndex}`]], {failMessage:'已预留音乐路径，请放入对应 mp3 文件'});
}
function playCardMusic(id){ const c=getCard(id); if(!musicEnabled) return; if(!c || !isOwned(id)) return; playAudioWithFallback(fullAudioCandidates(c), {failMessage:'已解锁完整卡，请放入对应完整音乐文件'}); }
function playCardCutsceneMusic(id){ const c=getCard(id); if(!musicEnabled || !c) return; playAudioWithFallback(fullAudioCandidates(c), {failMessage:'', stopBefore:true}); }

function normalizePityState(){
  state.pitySR = Math.max(0, Number(state.pitySR ?? state.pity ?? 0));
  state.pitySSR = Math.max(0, Number(state.pitySSR ?? state.pity ?? 0));
  state.pity = state.pitySSR;
}
function srPityLimit(){ return Number(typeof SR_PITY_COUNT !== 'undefined' ? SR_PITY_COUNT : 10); }
function ssrPityLimit(){ return Number(typeof SSR_PITY_COUNT !== 'undefined' ? SSR_PITY_COUNT : 100); }
function pityRemain(kind){
  normalizePityState();
  if(kind === 'SSR') return Math.max(1, ssrPityLimit() - state.pitySSR);
  return Math.max(1, srPityLimit() - state.pitySR);
}
function weightedRollRarity(){
  const entries=Object.entries(RARITIES).filter(([rarity,info])=>Number(info.prob)>0 && CARDS.some(c=>c.rarity===rarity));
  const total=entries.reduce((s,[,info])=>s+Number(info.prob||0),0);
  if(total<=0) return 'SSR';
  let r=Math.random()*total;
  for(const [rarity,info] of entries){
    r-=Number(info.prob||0);
    if(r<0) return rarity;
  }
  return entries[entries.length-1][0];
}
function applyPityAfterRoll(rarity){
  normalizePityState();
  if(rarity === 'SSR'){
    state.pitySSR = 0;
    state.pitySR = 0;
  }else{
    state.pitySSR += 1;
    if(rarity === 'SR') state.pitySR = 0;
    else state.pitySR += 1;
  }
  state.pity = state.pitySSR;
}

function renderResources(){
  normalizePityState();
  const notesEl=document.getElementById('notesCount');
  const ticketEl=document.getElementById('ticketCount');
  const fragmentEl=document.getElementById('fragmentCount');
  if(notesEl) notesEl.textContent=state.notes||0;
  if(ticketEl) ticketEl.textContent=state.tickets||0;
  if(fragmentEl) fragmentEl.textContent=state.fragments||0;
  const total=CARDS.length*PIECE_COUNT;
  const owned=totalOwnedPieces();
  const srRemain=pityRemain('SR');
  const ssrRemain=pityRemain('SSR');
  const pityText=document.getElementById('pityText');
  if(pityText) pityText.textContent=`拼图总进度 ${owned} / ${total}｜灵韵及以上保底还剩 ${srRemain} 抽｜天籁保底还剩 ${ssrRemain} 抽`;
  const pityBar=document.getElementById('pityBar');
  if(pityBar) pityBar.style.width=`${Math.min(100, (ssrPityLimit()-ssrRemain)/ssrPityLimit()*100)}%`;
}
function renderFeatured(){ const ssr=CARDS.filter(c=>c.rarity==='SSR'); document.getElementById('featuredRow').innerHTML=ssr.map(c=>`<div class="featured-chip"><b>${c.toneName}</b> · ${c.instrument} · ${progressText(c.id)}</div>`).join(''); }
function mobileHeroScore(card){ return ownedPiecesCount(card.id) + (isOwned(card.id)?100:0); }
function getMobileHeroCard(){ if(!CARDS.length) return null; return CARDS.slice().sort((a,b)=>mobileHeroScore(b)-mobileHeroScore(a) || CARDS.indexOf(a)-CARDS.indexOf(b))[0]; }
function renderMobileHero(){
  const hero=document.getElementById('mobileHeroCard');
  if(hero) hero.remove();
}
function renderToneProgress(){ const box=document.getElementById('toneProgress'); if(!box) return; box.innerHTML=Object.entries(TONES).map(([id,t])=>{ const list=CARDS.filter(c=>c.tone===id); const owned=list.reduce((s,c)=>s+ownedPiecesCount(c.id),0); const total=list.length*PIECE_COUNT || 1; const pct=owned/total*100; return `<div class="tone-item" style="color:${t.color}"><div class="tone-row"><div class="tone-name"><i class="tone-dot"></i><span>${t.mode} · ${t.theme}</span></div><b>${owned}/${total}</b></div><div class="tone-bar"><span style="width:${pct}%"></span></div></div>`; }).join(''); }
function renderPreview(){ let list=currentFilter==='all'?CARDS:CARDS.filter(c=>c.rarity===currentFilter); const el=document.getElementById('cardPreview'); if(!el) return; el.innerHTML=list.map(cardHTML).join(''); document.querySelectorAll('.preview-card').forEach(el=>el.addEventListener('click',()=>openDetail(el.dataset.id))); }
function cardHTML(c){ const cnt=ownedPiecesCount(c.id); const owned=cnt>0; const complete=isOwned(c.id); const glow=c.rarity==='SSR'?'rarity-glow-ssr':(c.rarity==='SR'?'rarity-glow-sr':''); return `<div class="preview-card ${owned?'':'locked-card'} ${glow}" data-id="${c.id}"><img src="${c.image}" alt="${c.name}"><span class="rarity-badge ${rarityClass(c.rarity)}">${rarityLabel(c.rarity)}</span>${owned?`<span class="owned-badge">碎片 ${cnt}/${PIECE_COUNT}</span>`:''}<div class="card-mask"><b>${complete?c.name:(owned?c.instrument+' · 拼图收集中':'？？？')}</b><span>${c.toneName} · ${c.instrument}</span></div></div>`; }
function renderBagFilters(){ const sel=document.getElementById('bagToneFilter'); if(!sel) return; sel.innerHTML='<option value="all">全部五音</option>'+Object.entries(TONES).map(([id,t])=>`<option value="${id}">${t.mode}</option>`).join(''); }
function renderBag(){ const grid=document.getElementById('bagGrid'); if(!grid) return; const tone=document.getElementById('bagToneFilter').value; const rarity=document.getElementById('bagRarityFilter').value; let list=CARDS.filter(c=>(tone==='all'||c.tone===tone)&&(rarity==='all'||c.rarity===rarity)); grid.innerHTML=list.map(c=>{ const glow=c.rarity==='SSR'?'rarity-glow-ssr':(c.rarity==='SR'?'rarity-glow-sr':''); return `<div class="bag-item ${ownedPiecesCount(c.id)>0?'':'locked-card'} ${glow}" data-id="${c.id}"><img src="${c.image}"><span class="rarity-badge ${rarityClass(c.rarity)}">${rarityLabel(c.rarity)}</span>${ownedPiecesCount(c.id)>0?`<span class="owned-badge">${progressText(c.id)}</span>`:''}<div class="card-mask"><b>${isOwned(c.id)?c.name:'拼图未完成'}</b><span>${c.instrument}</span></div></div>`; }).join(''); document.querySelectorAll('.bag-item').forEach(el=>el.addEventListener('click',()=>openDetail(el.dataset.id))); }
function updateAll(){ renderResources(); renderMobileHero(); renderToneProgress(); renderPreview(); renderBag(); renderDecompose(); saveState(); }

function rollRarity(){ return weightedRollRarity(); }
function pickCardByRarity(rarity){ const pool=CARDS.filter(c=>c.rarity===rarity); return pool.length ? pool[Math.floor(Math.random()*pool.length)] : null; }
function grantPiece(card){ const pieceIndex=Math.floor(Math.random()*PIECE_COUNT)+1; const before=ownedPiecesCount(card.id); const wasDuplicate=hasPiece(card.id,pieceIndex); const decomposeValue=decomposeValueByRarity(card.rarity); if(wasDuplicate){ addDuplicatePiece(card.id,pieceIndex); }else{ ensurePieces(card.id)[pieceIndex]=true; } const after=ownedPiecesCount(card.id); return { ...card, pieceIndex, pieceImage: pieceImage(card.id,pieceIndex), isNew:!wasDuplicate, wasDuplicate, decomposeValue, beforePieces:before, afterPieces:after, completed: after>=PIECE_COUNT && before<PIECE_COUNT } }
function drawCards(count){
  normalizePityState();
  const results=[];
  for(let i=0;i<count;i++){
    const forceSSR=state.pitySSR >= ssrPityLimit()-1;
    const forceSR=state.pitySR >= srPityLimit()-1;
    let rarity=forceSSR ? 'SSR' : (forceSR ? 'SR' : rollRarity());
    if(forceSR && !forceSSR && rarity !== 'SSR') rarity='SR';
    let card=pickCardByRarity(rarity);
    if(!card){
      rarity='N';
      card=pickCardByRarity('N') || CARDS[Math.floor(Math.random()*CARDS.length)];
    }
    const result=grantPiece(card);
    result.guaranteedSSR=forceSSR;
    result.guaranteedSR=forceSR && !forceSSR;
    applyPityAfterRoll(result.rarity);
    results.push(result);
    state.history.unshift({ id:card.id, pieceIndex:result.pieceIndex, time:Date.now(), new:result.isNew, type:'piece', rarity:result.rarity });
  }
  return results;
}
function canPay(count){ const ticketNeed=count, noteNeed=count*160; if(state.tickets>=ticketNeed){ state.tickets-=ticketNeed; return true; } if(state.notes>=noteNeed){ state.notes-=noteNeed; return true; } toast('资源不足，已为你保留“补充资源”按钮'); return false; }
async function startDraw(count){ stopCardMusic(); if(!canPay(count)) return; lastDrawType=count===1?'one':'ten'; const results=drawCards(count); saveState(); updateAll(); await playAnimation(results); showResults(results); }
function createAnimCard(card){ const div=document.createElement('div'); const img=card.pieceImage||card.image; div.className=`flying-card ${card.rarity.toLowerCase()}`; div.dataset.id=card.id; div.dataset.piece=card.pieceIndex||''; div.innerHTML=`<div class="inner"><div class="face back"></div><div class="face front"><img src="${img}" onerror="this.onerror=null;this.src='${card.image}'"></div></div>`; return div; }
function playSSRPrelude(){ return new Promise(resolve=>{ const layer=document.getElementById('gachaLayer'); const omen=document.createElement('div'); omen.className='ssr-omen'; omen.innerHTML=`<div class="ssr-omen-scroll"><div class="ssr-omen-seal">碎片</div><div class="ssr-omen-cloud cloud-a"></div><div class="ssr-omen-cloud cloud-b"></div><div class="ssr-omen-text">金纹启卷 · 拼图归位</div></div>`; layer.appendChild(omen); setTimeout(()=>omen.classList.add('show'),30); setTimeout(()=>omen.classList.add('leave'),1450); setTimeout(()=>{omen.remove();resolve();},1900); }); }
function drawMainAnimationSrc(hasSSR){ return hasSSR ? 'assets/animations/draw_ssr.mp4' : 'assets/animations/draw_normal.mp4'; }
function cardCutsceneSrc(cardId){ return `assets/animations/cards/${cardId}.mp4`; }
function uniqueResultCards(results){ const seen=new Set(); const list=[]; results.forEach(item=>{ if(!seen.has(item.id)){ seen.add(item.id); list.push(item); } }); return list; }
function clearGachaStage(){ const stage=document.getElementById('gachaStage'); if(stage) stage.innerHTML=''; }
function playCutsceneStage(options, shouldStop){
  return new Promise(resolve=>{
    if(shouldStop && shouldStop()){ resolve(); return; }
    const stage=document.getElementById('gachaStage');
    const hint=document.getElementById('revealHint');
    if(!stage){ resolve(); return; }
    stage.innerHTML='';
    if(hint){ hint.textContent=options.hint || '召灵动画播放中'; hint.classList.remove('hidden'); }
    const panel=document.createElement('div');
    panel.className=`cutscene-panel ${options.kind || ''}`;
    const fallbackImg=options.image ? `<img class="cutscene-card-img ${options.rarity==='SSR'?'rarity-cutscene-ssr':(options.rarity==='SR'?'rarity-cutscene-sr':'')}" src="${options.image}" onerror="this.style.display='none'">` : '';
    panel.innerHTML=`
      <div class="cutscene-fallback">
        <div class="cutscene-magic-ring"></div>
        ${fallbackImg}
        <div class="cutscene-copy">
          <div class="cutscene-kicker">${options.kicker || '五音召灵'}</div>
          <h3>${options.title || '召灵启卷'}</h3>
          <p>${options.subtitle || '器灵气息正在凝聚'}</p>
        </div>
      </div>`;
    stage.appendChild(panel);
    let finished=false;
    const minTime=Number(options.fallbackDuration || 1100);
    function done(){
      if(finished) return;
      finished=true;
      resolve();
    }
    const video=document.createElement('video');
    video.className='cutscene-video';
    video.src=options.src;
    video.muted=true;
    video.playsInline=true;
    video.autoplay=true;
    video.preload='auto';
    video.onended=()=>setTimeout(done,120);
    video.onerror=()=>setTimeout(done,minTime);
    video.oncanplay=()=>{
      if(finished) return;
      panel.classList.add('has-video');
      video.play().catch(()=>setTimeout(done,minTime));
    };
    panel.appendChild(video);
    setTimeout(()=>{ if(!finished && shouldStop && shouldStop()) done(); },100);
    setTimeout(()=>{ if(!finished && !panel.classList.contains('has-video')) done(); },minTime + 300);
    setTimeout(()=>{ if(!finished) done(); },Number(options.maxDuration || 5200));
  });
}
async function playDrawCutsceneSequence(results, shouldStop){
  const hasSSR=results.some(c=>c.rarity==='SSR');
  await playCutsceneStage({
    kind:hasSSR?'main-ssr':'main-normal',
    src:drawMainAnimationSrc(hasSSR),
    title:hasSSR?'天籁将临':'灵韵启声',
    subtitle:hasSSR?'金纹启卷，器灵碎片即将归位。':'五音流转，器灵回应召唤。',
    kicker:'主召灵动画',
    hint:'主召灵动画播放中',
    fallbackDuration:hasSSR?1650:1250,
    maxDuration:6200
  }, shouldStop);
  if(shouldStop && shouldStop()) return;
  const list=uniqueResultCards(results);
  const shouldPlaySingleCardMusic = results.length === 1;
  for(const card of list){
    if(shouldStop && shouldStop()) return;
    if(shouldPlaySingleCardMusic) playCardCutsceneMusic(card.id);
    await playCutsceneStage({
      kind:'card-cutscene',
      src:cardCutsceneSrc(card.id),
      image:card.image,
      rarity:card.rarity,
      title:`${card.instrument} · 器灵显影`,
      subtitle:`本次抽到了 ${card.instrument} 的拼图碎片。`,
      kicker:'角色卡动画',
      hint:`${card.instrument} 动画播放中`,
      fallbackDuration:1250,
      maxDuration:5600
    }, shouldStop);
  }
}
function playAnimation(results){
  return new Promise(resolve=>{
    const layer=document.getElementById('gachaLayer'),stage=document.getElementById('gachaStage'),hint=document.getElementById('revealHint');
    layer.classList.remove('hidden');
    if(stage) stage.innerHTML='';
    if(hint){ hint.textContent='召灵动画准备中'; hint.classList.remove('hidden'); }
    let done=false;
    function finish(){
      if(done) return;
      done=true;
      layer.querySelectorAll('.ssr-omen').forEach(el=>el.remove());
      layer.classList.add('hidden');
      if(stage) stage.innerHTML='';
      if(hint) hint.classList.add('hidden');
      resolve();
    }
    document.getElementById('skipBtn').onclick=finish;
    (async()=>{
      await playDrawCutsceneSequence(results,()=>done);
      if(done) return;
      ssrFlash();
      setTimeout(finish,420);
    })();
  });
}
function ssrFlash(){ const f=document.createElement('div'); f.className='flash-ssr'; document.body.appendChild(f); setTimeout(()=>f.remove(),1000); }
function showResults(results){ const modal=document.getElementById('resultModal'),grid=document.getElementById('resultGrid'); grid.innerHTML=results.map(c=>{ const glow=c.rarity==='SSR'?'rarity-glow-ssr':(c.rarity==='SR'?'rarity-glow-sr':''); return `<div class="result-item ${c.isNew?'new':'dupe'} ${glow}" data-id="${c.id}" data-piece="${c.pieceIndex}"><img src="${c.pieceImage}" onerror="this.onerror=null;this.src='${c.image}'"><span class="rarity-badge ${rarityClass(c.rarity)}">${rarityLabel(c.rarity)}</span>${c.isNew?'<span class="owned-badge">新碎片</span>':'<span class="owned-badge">重复待分解</span>'}<div class="card-mask"><b>${c.instrument} · 碎片 ${c.pieceIndex}/${PIECE_COUNT}</b><span>${c.isNew?'已点亮':'可分解 +'+c.decomposeValue+' 音律碎片'} · 进度 ${c.afterPieces}/${PIECE_COUNT}</span></div></div>`; }).join(''); grid.querySelectorAll('.result-item').forEach(el=>el.addEventListener('click',()=>openDetail(el.dataset.id, Number(el.dataset.piece)))); modal.classList.remove('hidden'); }
function renderDecompose(){ const listEl=document.getElementById('decomposeList'); if(!listEl) return; const fragmentEl=document.getElementById('decomposeFragmentCount'); const dupeEl=document.getElementById('decomposeDupeCount'); const potentialEl=document.getElementById('decomposePotentialCount'); const btn=document.getElementById('decomposeAllBtn'); const btnText=btn?.querySelector('span'); const items=duplicateItems(); const dupeTotal=totalDuplicateCount(); const gainTotal=totalPotentialFragments(); if(fragmentEl) fragmentEl.textContent=state.fragments||0; if(dupeEl) dupeEl.textContent=`${dupeTotal} 个`; if(potentialEl) potentialEl.textContent=`+${gainTotal}`; if(btnText) btnText.textContent=dupeTotal>0?`一键分解全部（+${gainTotal}）`:'暂无可分解碎片'; if(btn) btn.disabled=dupeTotal<=0; if(dupeTotal<=0){ listEl.innerHTML='<div class="empty-decompose">当前没有重复碎片。抽到已经拥有的拼图后，会先进入这里，之后可手动分解成音律碎片。</div>'; return; } listEl.innerHTML=items.map(item=>`<div class="decompose-item" data-id="${item.card.id}" data-piece="${item.pieceIndex}"><img src="${item.pieceImage}" onerror="this.onerror=null;this.src='${item.card.image}'"><div class="decompose-info"><span class="rarity-badge inline ${rarityClass(item.card.rarity)}">${rarityLabel(item.card.rarity)}</span><b>${item.card.instrument} · 碎片 ${item.pieceIndex}/${PIECE_COUNT}</b><p>重复 ${item.count} 个 · 每个可分解 ${item.value} 音律碎片 · 合计 +${item.total}</p></div><div class="decompose-gain">+${item.total}</div><button class="tool-btn decompose-one-btn" type="button" data-id="${item.card.id}" data-piece="${item.pieceIndex}">分解 1 个</button></div>`).join(''); listEl.querySelectorAll('.decompose-item').forEach(el=>el.addEventListener('click',()=>openDetail(el.dataset.id, Number(el.dataset.piece)))); listEl.querySelectorAll('.decompose-one-btn').forEach(btn=>btn.addEventListener('click',e=>{ e.stopPropagation(); decomposeOne(btn.dataset.id, Number(btn.dataset.piece)); })); }
function decomposeOne(cardId,pieceIndex){ const count=duplicatePieceCount(cardId,pieceIndex); if(count<=0){ toast('没有可分解的重复碎片'); return; } const card=getCard(cardId); const gain=decomposeValueByRarity(card.rarity); removeDuplicatePiece(cardId,pieceIndex,1); state.fragments=(state.fragments||0)+gain; updateAll(); toast(`已分解 ${card.instrument} · 碎片 ${pieceIndex}，+${gain} 音律碎片`); }
function decomposeAll(){ const dupeTotal=totalDuplicateCount(); const gainTotal=totalPotentialFragments(); if(dupeTotal<=0){ toast('当前没有可分解的重复碎片'); return; } state.fragments=(state.fragments||0)+gainTotal; state.duplicatePieces={}; updateAll(); toast(`已分解 ${dupeTotal} 个重复碎片，+${gainTotal} 音律碎片`); }
function openDetail(id,pieceIndex){ const c=getCard(id); const cnt=ownedPiecesCount(c.id); const isPiece=Number.isFinite(pieceIndex)&&pieceIndex>=1&&pieceIndex<=PIECE_COUNT; const detailImg=document.getElementById('detailImage'); detailImg.onerror=()=>{ detailImg.onerror=null; detailImg.src=c.image; }; detailImg.src=isPiece?pieceImage(c.id,pieceIndex):c.image; const badge=document.getElementById('detailRarity'); badge.textContent=c.rarityName; badge.className='detail-rarity '+rarityClass(c.rarity); document.getElementById('detailName').textContent=isPiece?`${c.instrument} · 碎片 ${pieceIndex}/${PIECE_COUNT}`:(cnt>0?c.name:'未获得碎片'); document.getElementById('detailDesc').textContent=cnt>0?`${c.description}\n当前拼图进度：${cnt}/${PIECE_COUNT}。`:'该角色卡尚未获得任何拼图碎片。抽到碎片后，对应区域会在典藏阁中点亮。'; document.getElementById('detailInstrument').textContent=c.instrument; document.getElementById('detailTone').textContent=c.toneName; document.getElementById('detailElement').textContent=c.element; document.getElementById('detailOwned').textContent=isPiece?(hasPiece(c.id,pieceIndex)?'已获得该碎片':'尚未获得该碎片'):(isOwned(c.id)?'完整角色卡已解锁':`碎片 ${cnt}/${PIECE_COUNT}`); document.getElementById('detailModal').classList.remove('hidden'); if(!isPiece && isOwned(c.id)) playCardMusic(c.id); }
function openModal(id){ document.getElementById(id).classList.remove('hidden'); }
function closeModal(id){ document.getElementById(id).classList.add('hidden'); if(id==='detailModal'||id==='resultModal') stopCardMusic(); }

document.getElementById('drawOneBtn').onclick=()=>startDraw(1);
document.getElementById('drawTenBtn').onclick=()=>startDraw(10);
document.getElementById('againOneBtn').onclick=()=>{closeModal('resultModal');startDraw(1)};
document.getElementById('againTenBtn').onclick=()=>{closeModal('resultModal');startDraw(10)};
document.getElementById('openBagBtn').onclick=()=>{renderBag();openModal('bagModal')};
document.getElementById('openDecomposeBtn').onclick=()=>{renderDecompose();openModal('decomposeModal')};
document.getElementById('decomposeAllBtn').onclick=decomposeAll;
document.getElementById('openRulesBtn').onclick=()=>openModal('rulesModal');
document.getElementById('addResourceBtn').onclick=()=>{state.notes+=3200;state.tickets+=10;updateAll();toast('已补充 3200 音符与 10 张抽卡券')};
document.getElementById('resetBtn').onclick=()=>{if(confirm('确认重置所有抽卡数据？')){state=structuredClone(DEFAULT_STATE);updateAll();toast('已重置存档')}};
document.querySelectorAll('[data-close]').forEach(btn=>btn.addEventListener('click',()=>closeModal(btn.dataset.close)));
document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)closeModal(m.id)}));
document.querySelectorAll('.filter-btn').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');currentFilter=btn.dataset.filter;renderPreview()}));
document.getElementById('bagToneFilter').onchange=renderBag;
document.getElementById('bagRarityFilter').onchange=renderBag;
const musicToggleButton=document.getElementById('musicToggleBtn');if(musicToggleButton){musicToggleButton.onclick=()=>setMusicEnabled(!musicEnabled)};
const openProgressButton=document.getElementById('openProgressBtn');const closeProgressButton=document.getElementById('closeProgressBtn');const progressPanel=document.querySelector('.side');if(openProgressButton&&progressPanel){openProgressButton.onclick=()=>progressPanel.classList.add('open')}if(closeProgressButton&&progressPanel){closeProgressButton.onclick=()=>progressPanel.classList.remove('open')}document.addEventListener('keydown',e=>{if(e.key==='Escape'&&progressPanel)progressPanel.classList.remove('open')});
updateMusicToggle();renderFeatured();renderMobileHero();renderBagFilters();updateAll();
