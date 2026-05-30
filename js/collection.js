const STORAGE_KEY = 'wuyin_gacha_piece_demo_v3';
const DEFAULT_STATE = { notes: 3200, tickets: 6, fragments: 0, pity: 0, pieces: {}, duplicatePieces: {}, history: [] };
let state = loadState();
let currentCardId = null;
let currentPiece = null;
const completedOnce = new Set();
let collectionToneFilter = 'all';
let collectionRarityFilter = 'all';
let collectionWheelFloat = 0;
let collectionWheelFrame = null;
let collectionWheelMoving = false;
const MUSIC_KEY = 'wuyin_music_enabled_v1';
let currentCollectionAudio = null;
function collectionMusicEnabled(){ return localStorage.getItem(MUSIC_KEY) !== 'off'; }

function stopCollectionMusic(){
  if(currentCollectionAudio){
    currentCollectionAudio.pause();
    currentCollectionAudio.currentTime = 0;
    currentCollectionAudio = null;
  }
}
function playCollectionAudio(src, options={}){
  stopCollectionMusic();
  if(!src){ toast(options.failText || '还没有配置音乐文件'); return; }
  if(!collectionMusicEnabled()) return;
  const audio = new Audio(src);
  currentCollectionAudio = audio;
  const start = Math.max(0, Number(options.start || 0));
  const end = Number(options.end || 0);
  audio.onerror = () => toast('音乐文件读取失败，请检查 mp3 路径是否正确');
  audio.addEventListener('loadedmetadata',()=>{
    if(start > 0){
      if(Number.isFinite(audio.duration) && start >= audio.duration){
        toast('这首音乐长度不够，当前碎片没有对应的 10 秒片段');
        stopCollectionMusic();
        return;
      }
      audio.currentTime = start;
    }
  },{once:true});
  if(end > start){
    audio.addEventListener('timeupdate',()=>{
      if(audio.currentTime >= end) stopCollectionMusic();
    });
  }
  audio.play().catch(()=>toast('浏览器拦截了播放，请再点一次播放按钮'));
}
function hasPieceAudio(card){ return !!(card && (card.pieceAudio || card.fullAudio)); }
function hasFullAudio(card){ return !!(card && card.fullAudio); }
function playPieceMusic(cardId,piece){
  const card=getCard(cardId);
  if(!card){ toast('角色卡不存在'); return; }
  if(!hasPiece(cardId,piece)){ toast('获得该碎片后才能播放音乐'); return; }
  if(card.pieceAudio || card.fullAudio){
    const segment=Number(card.audioSegmentSeconds || 10);
    const start=(piece-1)*segment;
    const end=piece*segment;
    playCollectionAudio(card.pieceAudio || card.fullAudio,{start,end,failText:'该碎片还没有配置音乐'});
    return;
  }
  const key=`${cardId}_p${piece}`;
  playCollectionAudio(CARD_AUDIO[key],{failText:'该碎片还没有配置音乐'});
}
function playFullMusic(cardId){
  const card=getCard(cardId);
  if(!card){ toast('角色卡不存在'); return; }
  if(!isComplete(cardId)){ toast('集齐 9 个碎片后才能播放完整音乐'); return; }
  playCollectionAudio(card.fullAudio || card.pieceAudio,{failText:'该角色卡还没有配置完整音乐'});
}

function structuredClone(obj){ return JSON.parse(JSON.stringify(obj)); }
function loadState(){ try{ const raw=localStorage.getItem(STORAGE_KEY); return raw ? { ...structuredClone(DEFAULT_STATE), ...JSON.parse(raw) } : structuredClone(DEFAULT_STATE); }catch(e){ return structuredClone(DEFAULT_STATE); } }
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function ensurePieces(id){ if(!state.pieces[id]) state.pieces[id]={}; return state.pieces[id]; }
function decomposeValueByRarity(rarity){ return (typeof DUPLICATE_PIECE_FRAGMENT_VALUES !== 'undefined' && DUPLICATE_PIECE_FRAGMENT_VALUES[rarity]) || DUPLICATE_PIECE_FRAGMENT_VALUE || 1; }
function ensureDuplicatePieces(id){ if(!state.duplicatePieces) state.duplicatePieces={}; if(!state.duplicatePieces[id]) state.duplicatePieces[id]={}; return state.duplicatePieces[id]; }
function addDuplicatePiece(id,piece){ const bag=ensureDuplicatePieces(id); bag[piece]=(Number(bag[piece])||0)+1; }
function hasPiece(id,p){ return !!ensurePieces(id)[p]; }
function ownedPiecesCount(id){ return Object.keys(ensurePieces(id)).length; }
function isComplete(id){ return ownedPiecesCount(id) >= PIECE_COUNT; }
function getCard(id){ return CARDS.find(c=>c.id===id); }
function hasModel(card){ return !!(card && card.model); }
function modelSources(card){ return [card?.model, ...(card?.modelFallbacks || [])].filter(Boolean); }
function rarityLabel(r){ return RARITIES[r]?.name || r; }
function rarityClass(r){ return 'rarity-' + r.toLowerCase(); }
function toast(msg){ const el=document.getElementById('collectionToast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),2200); }
function saveAndRender(){ saveState(); renderOverview(); if(currentCardId) renderScroll(currentCardId); }
function totalOwnedPieces(){ return CARDS.reduce((s,c)=>s+ownedPiecesCount(c.id),0); }
function collectionFilteredCards(){
  return CARDS.filter(card =>
    (collectionToneFilter === 'all' || card.tone === collectionToneFilter) &&
    (collectionRarityFilter === 'all' || card.rarity === collectionRarityFilter)
  );
}
function collectionWheelCenterCard(){
  const list=collectionFilteredCards();
  if(!list.length) return null;
  const centerIndex=collectionWheelMod(Math.round(collectionWheelFloat), list.length);
  return list[centerIndex];
}
function syncCollectionWheelCenterInfo(){
  const title=document.getElementById('collectionWheelTitle');
  const meta=document.getElementById('collectionWheelMeta');
  const enterBtn=document.getElementById('collectionWheelEnterBtn');
  const card=collectionWheelCenterCard();
  if(!card){
    if(title) title.textContent='暂无匹配器灵';
    if(meta) meta.textContent='换一个五音或品质筛选试试。';
    if(enterBtn){
      enterBtn.textContent='暂无可进入藏卷';
      enterBtn.disabled=true;
      enterBtn.removeAttribute('data-id');
      enterBtn.removeAttribute('data-card-id');
    }
    return;
  }
  if(title) title.textContent=`${card.toneName} · ${card.instrument}`;
  if(meta) meta.textContent=`${rarityLabel(card.rarity)} · 碎片 ${ownedPiecesCount(card.id)}/${PIECE_COUNT}${isComplete(card.id)?' · 完整已解锁':' · 拼图收集中'}`;
  if(enterBtn){
    enterBtn.textContent=`进入 ${card.instrument} 典藏`;
    enterBtn.disabled=false;
    // 和下方列表卡片一样：把要进入的卡 id 直接写到按钮 data-id 上。
    // 点击时不再重新推算“当前中心卡”，避免轮盘拖拽层影响点击判断。
    enterBtn.dataset.id=card.id;
    enterBtn.dataset.cardId=card.id;
  }
}
function collectionWheelMod(value, len){ return ((value % len) + len) % len; }
function collectionWheelDelta(index, center, len){
  let d = index - collectionWheelMod(center, len);
  if(d > len / 2) d -= len;
  if(d < -len / 2) d += len;
  return d;
}
function collectionWheelEase(t){ return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function collectionWheelNearestFloat(index, list){
  const len = list.length;
  if(!len) return 0;
  const current = collectionWheelMod(collectionWheelFloat, len);
  let d = index - current;
  if(d > len / 2) d -= len;
  if(d < -len / 2) d += len;
  return collectionWheelFloat + d;
}
function animateCollectionWheelTo(targetFloat, duration=720){
  const list = collectionFilteredCards();
  if(list.length <= 1){ collectionWheelFloat = 0; renderCollectionWheel(); return Promise.resolve(); }
  if(collectionWheelFrame) cancelAnimationFrame(collectionWheelFrame);
  const start = collectionWheelFloat;
  const diff = targetFloat - start;
  const startTime = performance.now();
  collectionWheelMoving = true;
  return new Promise(resolve=>{
    function frame(now){
      const t = Math.min(1, (now - startTime) / duration);
      collectionWheelFloat = start + diff * collectionWheelEase(t);
      positionCollectionWheelCards();
      syncCollectionWheelCenterInfo();
      if(t < 1){
        collectionWheelFrame = requestAnimationFrame(frame);
      }else{
        collectionWheelFloat = targetFloat;
        collectionWheelMoving = false;
        collectionWheelFrame = null;
        positionCollectionWheelCards();
        syncCollectionWheelCenterInfo();
        resolve();
      }
    }
    collectionWheelFrame = requestAnimationFrame(frame);
  });
}
function moveCollectionWheel(step){
  const list = collectionFilteredCards();
  if(list.length <= 1) return;
  animateCollectionWheelTo(collectionWheelFloat + step, 760);
}
function setCollectionFilter(type, value){
  if(type === 'tone') collectionToneFilter = value;
  if(type === 'rarity') collectionRarityFilter = value;
  collectionWheelFloat = 0;
  renderOverview();
}
function renderCollectionFilters(){
  const toneBox=document.getElementById('collectionToneFilters');
  const rarityBox=document.getElementById('collectionRarityFilters');
  if(toneBox){
    const tones=[['all','全部'], ...Object.entries(TONES).map(([id,t])=>[id,t.mode])];
    toneBox.innerHTML=tones.map(([id,label])=>`<button type="button" class="collection-filter-btn ${collectionToneFilter===id?'active':''}" data-type="tone" data-value="${id}">${label}</button>`).join('');
  }
  if(rarityBox){
    const rarities=[['all','全部'], ...Object.entries(RARITIES).map(([id,r])=>[id,r.name])];
    rarityBox.innerHTML=rarities.map(([id,label])=>`<button type="button" class="collection-filter-btn ${collectionRarityFilter===id?'active':''}" data-type="rarity" data-value="${id}">${label}</button>`).join('');
  }
  document.querySelectorAll('.collection-filter-btn').forEach(btn=>btn.addEventListener('click',()=>setCollectionFilter(btn.dataset.type, btn.dataset.value)));
}
function renderCollectionWheel(){
  const box=document.getElementById('collectionWheelCards');
  if(!box) return;
  const list=collectionFilteredCards();
  if(!list.length){
    box.innerHTML='<div class="collection-wheel-empty">当前筛选没有角色卡</div>';
    syncCollectionWheelCenterInfo();
    return;
  }
  if(collectionWheelFloat >= list.length) collectionWheelFloat = 0;
  if(collectionWheelFloat < 0) collectionWheelFloat = 0;
  const len=list.length;
  box.innerHTML=list.map((card,i)=>{
    const pct=ownedPiecesCount(card.id)/PIECE_COUNT*100;
    const glow=card.rarity==='SSR'?'rarity-glow-ssr':(card.rarity==='SR'?'rarity-glow-sr':'');
    return `<button class="collection-wheel-card ${glow}" type="button" data-index="${i}" data-id="${card.id}" style="--tone-color:${TONES[card.tone].color}">
      <img src="${card.image}" alt="${card.name}">
      <span class="wheel-rarity ${rarityClass(card.rarity)}">${rarityLabel(card.rarity)}</span>
      <span class="wheel-progress"><i style="width:${pct}%"></i></span>
    </button>`;
  }).join('');
  positionCollectionWheelCards();
  syncCollectionWheelCenterInfo();
  box.querySelectorAll('.collection-wheel-card').forEach(el=>{
    el.addEventListener('click',()=>{
      const idx=Number(el.dataset.index);
      const current=collectionWheelMod(Math.round(collectionWheelFloat), len);
      if(idx === current && !collectionWheelMoving){
        location.hash=el.dataset.id;
        openScroll(el.dataset.id);
      }else{
        animateCollectionWheelTo(collectionWheelNearestFloat(idx, list), 820);
      }
    });
  });
}
function positionCollectionWheelCards(){
  const box=document.getElementById('collectionWheelCards');
  if(!box) return;
  const list=collectionFilteredCards();
  const len=list.length;
  if(!len) return;
  box.querySelectorAll('.collection-wheel-card').forEach(el=>{
    const idx=Number(el.dataset.index);
    const d=collectionWheelDelta(idx, collectionWheelFloat, len);
    const abs=Math.abs(d);
    const visible=abs<=2.75 || len<=5;
    const isMobile=window.matchMedia && window.matchMedia('(max-width: 760px)').matches;
    const angleStep=isMobile?42:33;
    const xRadius=isMobile?185:500;
    const yRadius=isMobile?86:130;
    const edgeDrop=isMobile?10:18;
    const minScale=isMobile?.54:.48;
    const scaleStep=isMobile?.17:.18;
    const angle=d*angleStep;
    const rad=angle*Math.PI/180;
    const x=Math.sin(rad)*xRadius;
    const y=(1-Math.cos(rad))*yRadius + Math.pow(abs,1.25)*edgeDrop;
    const scale=Math.max(minScale,1-abs*scaleStep);
    const rot=d*-13;
    const opacity=visible?Math.max(isMobile?.26:.18,1-abs*.26):0;
    el.style.transform=`translate(-50%,-50%) translateX(${x}px) translateY(${y}px) rotate(${rot}deg) scale(${scale})`;
    el.style.opacity=String(opacity);
    el.style.zIndex=String(100-Math.round(abs*12));
    el.style.pointerEvents=visible?'auto':'none';
    el.classList.toggle('is-center', abs<.5);
  });
}
function enterCollectionWheelCurrent(e){
  if(e){
    e.preventDefault();
    e.stopPropagation();
  }
  const enterBtn=e?.currentTarget || document.getElementById('collectionWheelEnterBtn');
  // 完全对齐下方罗列卡片的逻辑：按钮上有什么 data-id，就进入哪张卡。
  const cardId=enterBtn?.dataset.id || enterBtn?.dataset.cardId;
  if(!cardId || !getCard(cardId)) return;
  if(collectionWheelFrame){
    cancelAnimationFrame(collectionWheelFrame);
    collectionWheelFrame=null;
  }
  collectionWheelMoving=false;
  collectionWheelFloat=Math.round(collectionWheelFloat);
  location.hash=cardId;
  openScroll(cardId);
}
function bindCollectionWheelEvents(){
  const stage=document.getElementById('collectionWheelStage');
  const prev=document.getElementById('collectionWheelPrev');
  const next=document.getElementById('collectionWheelNext');
  const enter=document.getElementById('collectionWheelEnterBtn');
  if(prev) prev.onclick=()=>moveCollectionWheel(-1);
  if(next) next.onclick=()=>moveCollectionWheel(1);
  if(enter && enter.dataset.enterBound!=='1'){
    enter.dataset.enterBound='1';
    enter.addEventListener('pointerdown',e=>e.stopPropagation());
    enter.addEventListener('pointerup',e=>e.stopPropagation());
    enter.addEventListener('click',enterCollectionWheelCurrent);
  }
  if(!stage || stage.dataset.bound==='1') return;
  stage.dataset.bound='1';
  let dragging=false, startX=0, startY=0;
  stage.addEventListener('pointerdown',e=>{ dragging=true; startX=e.clientX; startY=e.clientY; stage.setPointerCapture?.(e.pointerId); });
  stage.addEventListener('pointerup',e=>{ if(!dragging) return; dragging=false; const dx=e.clientX-startX; const dy=e.clientY-startY; if(Math.abs(dx)>44 && Math.abs(dx)>Math.abs(dy)) moveCollectionWheel(dx<0?1:-1); });
  stage.addEventListener('wheel',e=>{ const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY; if(Math.abs(delta)<18) return; e.preventDefault(); moveCollectionWheel(delta>0?1:-1); },{passive:false});
}
function renderOverview(){
  const grid=document.getElementById('scrollGrid');
  const list=collectionFilteredCards();
  if(grid){
    if(!list.length){
      grid.innerHTML='<div class="collection-grid-empty">当前筛选没有角色卡。</div>';
    }else{
      grid.innerHTML=list.map(c=>{ const pct=ownedPiecesCount(c.id)/PIECE_COUNT*100; const glow=c.rarity==='SSR'?'rarity-glow-ssr':(c.rarity==='SR'?'rarity-glow-sr':''); return `<article class="scroll-card ${glow}" data-id="${c.id}" style="--tone-color:${TONES[c.tone].color}">
        ${isComplete(c.id)?'<div class="completed-badge">已完成</div>':''}
        <img src="${c.image}" alt="${c.name}">
        <div class="scroll-card-info">
          <h3>${c.instrument}</h3>
          <p>${c.toneName} · ${rarityLabel(c.rarity)}</p>
          <div class="scroll-mini-progress"><span style="width:${pct}%"></span></div>
          <div class="scroll-card-meta"><span>${ownedPiecesCount(c.id)}/${PIECE_COUNT}</span><span>${isComplete(c.id)?'完整显现':'拼图收集中'}</span></div>
        </div>
      </article>`; }).join('');
      grid.querySelectorAll('.scroll-card').forEach(el=>el.addEventListener('click',()=>openScroll(el.dataset.id)));
    }
  }
  document.getElementById('globalProgressText').textContent=`总进度 ${totalOwnedPieces()} / ${CARDS.length*PIECE_COUNT}`;
  const hint=document.getElementById('collectionGridHint');
  if(hint) hint.textContent=`当前显示 ${list.length} 张角色卡；下方保留原来的按行按列罗列方式。`;
  renderCollectionFilters();
  renderCollectionWheel();
  bindCollectionWheelEvents();
}
function openScroll(cardId){ currentCardId=cardId; document.getElementById('overviewView').classList.add('hidden'); document.getElementById('scrollView').classList.remove('hidden'); renderScroll(cardId); if(isComplete(cardId)){ const card=getCard(cardId); if(hasFullAudio(card)) playFullMusic(cardId); } window.scrollTo({top:0,behavior:'smooth'}); }
function closeScroll(){ stopCollectionMusic(); currentCardId=null; document.getElementById('scrollView').classList.add('hidden'); document.getElementById('overviewView').classList.remove('hidden'); renderOverview(); }
function lockIcon(card){ return LOCK_ICONS[card.rarity] || LOCK_ICONS.N; }
function labelText(card, piece){ if(hasPiece(card.id,piece)) return {title:card.instrument, sub:`碎片 ${piece}/9`}; return {title:'锁印未启', sub:`第 ${piece} 块`}; }

const CANVAS = { w: 720, h: 1000 };
const COLS = [0, 240, 480, 720];
const ROWS = [0, 333.333, 666.667, 1000];
const TAB = { width: 50, neck: 18, depth: 30 };
const PIECE_LAYOUT = [
  { key:'p1', pieceIndex:1, row:0, col:0, label:{left:16.8, top:17.2} },
  { key:'p2', pieceIndex:2, row:0, col:1, label:{left:50.0, top:17.2} },
  { key:'p3', pieceIndex:3, row:0, col:2, label:{left:83.2, top:17.2} },
  { key:'p4', pieceIndex:4, row:1, col:0, label:{left:16.8, top:50.0} },
  { key:'p5', pieceIndex:5, row:1, col:1, label:{left:50.0, top:50.0} },
  { key:'p6', pieceIndex:6, row:1, col:2, label:{left:83.2, top:50.0} },
  { key:'p7', pieceIndex:7, row:2, col:0, label:{left:16.8, top:82.8} },
  { key:'p8', pieceIndex:8, row:2, col:1, label:{left:50.0, top:82.8} },
  { key:'p9', pieceIndex:9, row:2, col:2, label:{left:83.2, top:82.8} }
];
const H_TABS = [[1,-1,1],[-1,1,-1]];
const V_TABS = [[1,-1],[-1,1],[1,-1]];
function lineH(x1,y,x2,side,sign){ if(sign===0) return `L ${x2} ${y}`; const dir=sign*(side==='top'?-1:1), w=TAB.width, n=TAB.neck, d=TAB.depth, m=(x1+x2)/2; return [`L ${m-w} ${y}`,`C ${m-w*0.55} ${y}, ${m-n} ${y+dir*d*0.14}, ${m-n} ${y+dir*d*0.56}`,`C ${m-n} ${y+dir*d}, ${m+n} ${y+dir*d}, ${m+n} ${y+dir*d*0.56}`,`C ${m+n} ${y+dir*d*0.14}, ${m+w*0.55} ${y}, ${m+w} ${y}`,`L ${x2} ${y}`].join(' '); }
function lineV(x,y1,y2,side,sign){ if(sign===0) return `L ${x} ${y2}`; const dir=sign*(side==='left'?-1:1), w=TAB.width, n=TAB.neck, d=TAB.depth, m=(y1+y2)/2; return [`L ${x} ${m-w}`,`C ${x} ${m-w*0.55}, ${x+dir*d*0.14} ${m-n}, ${x+dir*d*0.56} ${m-n}`,`C ${x+dir*d} ${m-n}, ${x+dir*d} ${m+n}, ${x+dir*d*0.56} ${m+n}`,`C ${x+dir*d*0.14} ${m+n}, ${x} ${m+w*0.55}, ${x} ${m+w}`,`L ${x} ${y2}`].join(' '); }
function pieceSigns(row,col){ return { top: row===0?0:-H_TABS[row-1][col], right: col===2?0:V_TABS[row][col], bottom: row===2?0:H_TABS[row][col], left: col===0?0:-V_TABS[row][col-1] }; }
function buildPiecePath(row,col){ const x1=COLS[col],x2=COLS[col+1],y1=ROWS[row],y2=ROWS[row+1],s=pieceSigns(row,col); return `M ${x1} ${y1} ${lineH(x1,y1,x2,'top',s.top)} ${lineV(x2,y1,y2,'right',s.right)} ${lineH(x2,y2,x1,'bottom',s.bottom)} ${lineV(x1,y2,y1,'left',s.left)} Z`; }
const PIECE_PATHS = Object.fromEntries(PIECE_LAYOUT.map(item=>[item.key, buildPiecePath(item.row,item.col)]));

function renderScroll(cardId){
  const card=getCard(cardId), count=ownedPiecesCount(cardId), pct=count/PIECE_COUNT*100;
  document.getElementById('scrollTitle').textContent=`${card.instrument} · 九宫拼图`;
  document.getElementById('scrollSubtitle').textContent=`${card.toneName} · ${rarityLabel(card.rarity)} · ${card.role}`;
  document.getElementById('scrollProgressPill').textContent=`${count} / ${PIECE_COUNT}`;
  document.getElementById('scrollImage').src=card.image;
  document.getElementById('sideToneName').textContent=card.name;
  document.getElementById('sideToneDesc').textContent=card.description;
  document.getElementById('sideProgressBar').style.width=`${pct}%`;
  document.getElementById('rarityStat').innerHTML=`<div class="rarity-chip"><span>品质</span><b>${rarityLabel(card.rarity)}</b></div><div class="rarity-chip"><span>五音</span><b>${card.toneName}</b></div><div class="rarity-chip"><span>碎片</span><b>${count}/${PIECE_COUNT}</b></div><div class="rarity-chip"><span>完整卡</span><b>${isComplete(cardId)?'已解锁':'未解锁'}</b></div>`;
  const modelBtn=document.getElementById('viewModelBtn'); if(modelBtn){ const show=hasModel(card)&&isComplete(cardId); modelBtn.classList.toggle('hidden',!show); modelBtn.textContent=`查看 ${card.instrument} 三维模型`; }
  const fullMusicBtn=document.getElementById('playFullMusicBtn'); if(fullMusicBtn){ const show=hasFullAudio(card)&&isComplete(cardId); fullMusicBtn.classList.toggle('hidden',!show); fullMusicBtn.textContent=`播放 ${card.instrument} 完整音乐`; }
  document.getElementById('scrollCardList').innerHTML=PIECE_LAYOUT.map(item=>`<div class="scroll-list-item" data-piece="${item.pieceIndex}"><div><div class="name">碎片 ${item.pieceIndex} / ${PIECE_COUNT}</div><div class="meta">${hasPiece(cardId,item.pieceIndex)?'已点亮对应区域':'尚未获得'}</div></div><span class="status-dot ${hasPiece(cardId,item.pieceIndex)?'owned':''}">${hasPiece(cardId,item.pieceIndex)?'已归藏':'未归藏'}</span></div>`).join('');
  document.querySelectorAll('.scroll-list-item').forEach(el=>el.addEventListener('click',()=>openPieceModal(cardId, Number(el.dataset.piece))));
  renderPuzzle(card);
  maybeShowReward(cardId);
}
function renderPuzzle(card){
  const svg=document.getElementById('pieceSvg');
  svg.setAttribute('viewBox', `0 0 ${CANVAS.w} ${CANVAS.h}`);
  const defs=PIECE_LAYOUT.map(item=>`<clipPath id="clip-${item.key}"><path d="${PIECE_PATHS[item.key]}"></path></clipPath>`).join('');
  const lights=PIECE_LAYOUT.map(item=>hasPiece(card.id,item.pieceIndex)?`<image class="piece-light" href="${card.image}" x="0" y="0" width="${CANVAS.w}" height="${CANVAS.h}" preserveAspectRatio="none" clip-path="url(#clip-${item.key})"></image>`:'').join('');
  const seamRarityClass=card.rarity==='SSR'?'rarity-seam-ssr':(card.rarity==='SR'?'rarity-seam-sr':'');
  const seams=PIECE_LAYOUT.map(item=>`<path class="piece-seam ${seamRarityClass}" d="${PIECE_PATHS[item.key]}"></path>`).join('');
  const hits=PIECE_LAYOUT.map(item=>`<path class="piece-hit" data-piece="${item.pieceIndex}" d="${PIECE_PATHS[item.key]}"></path>`).join('');
  svg.innerHTML=`<defs>${defs}</defs>${lights}${seams}${hits}`;
  svg.querySelectorAll('.piece-hit').forEach(p=>p.addEventListener('click',()=>openPieceModal(card.id, Number(p.dataset.piece))));
  const labels=document.getElementById('pieceLabels');
  labels.innerHTML=PIECE_LAYOUT.map(item=>{ const owned=hasPiece(card.id,item.pieceIndex), txt=labelText(card,item.pieceIndex); const cls=owned?'unlocked':(card.rarity==='SSR'?'locked-ssr':card.rarity==='SR'?'locked-sr':'locked-nr'); const icon=owned?'<i class="piece-owned-dot"></i>':`<img class="piece-lock-img" src="${lockIcon(card)}" alt="锁">`; return `<div class="piece-label ${cls}" style="left:${item.label.left}%;top:${item.label.top}%" data-piece="${item.pieceIndex}">${icon}<strong>${txt.title}</strong><span>${txt.sub}</span></div>`; }).join('');
  labels.querySelectorAll('.piece-label').forEach(l=>l.addEventListener('click',()=>openPieceModal(card.id, Number(l.dataset.piece))));
}
function openPieceModal(cardId,piece){
  currentCardId=cardId; currentPiece=piece; const c=getCard(cardId), owned=hasPiece(cardId,piece);
  const modalImg=document.getElementById('pieceModalImg');
  modalImg.onerror=()=>{ modalImg.onerror=null; modalImg.src=c.image; };
  modalImg.src=pieceImage(c.id,piece);
  modalImg.style.filter=owned?'none':'grayscale(1) brightness(.45) blur(1px)';
  const badge=document.getElementById('pieceModalRarity'); badge.textContent=rarityLabel(c.rarity); badge.className=`modal-rarity ${rarityClass(c.rarity)}`;
  document.getElementById('pieceModalName').textContent=`${c.instrument} · 碎片 ${piece}/${PIECE_COUNT}`;
  document.getElementById('pieceModalDesc').textContent=owned?`${c.description}\n\n该碎片已获得，对应卡面区域已点亮。${hasPieceAudio(c)?`\n点击“播放碎片音乐”会播放该角色音乐的第 ${(piece-1)*Number(c.audioSegmentSeconds||10)}-${piece*Number(c.audioSegmentSeconds||10)} 秒。`:`\n音乐片段路径建议：assets/audio/${c.id}_p${piece}.mp3`}`:`该碎片尚未获得，卡面上会显示锁印。${hasPieceAudio(c)?'\n获得该碎片后可播放对应 10 秒音乐片段。':`\n音乐片段路径建议：assets/audio/${c.id}_p${piece}.mp3`}`;
  document.getElementById('pieceModalInstrument').textContent=c.instrument;
  document.getElementById('pieceModalTone').textContent=c.toneName;
  document.getElementById('pieceModalElement').textContent=rarityLabel(c.rarity);
  document.getElementById('pieceModalOwned').textContent=owned?'已获得该碎片':'尚未获得';
  document.getElementById('modalUnlockBtn').textContent=owned?'已归藏':'模拟获得该碎片';
  const pieceMusicBtn=document.getElementById('modalPlayMusicBtn');
  if(pieceMusicBtn){
    const showMusic=hasPieceAudio(c);
    pieceMusicBtn.classList.toggle('hidden',!showMusic);
    pieceMusicBtn.disabled=!owned;
    pieceMusicBtn.textContent=owned?'播放碎片音乐':'未获得不可播放';
  }
  document.getElementById('pieceModal').classList.remove('hidden');
  if(owned && hasPieceAudio(c)) playPieceMusic(cardId,piece);
}
function closePieceModal(){ document.getElementById('pieceModal').classList.add('hidden'); stopCollectionMusic(); }
function unlockPiece(cardId,piece){ const card=getCard(cardId); if(hasPiece(cardId,piece)){ addDuplicatePiece(cardId,piece); toast(`重复碎片已进入分解列表，每个可分解 ${decomposeValueByRarity(card.rarity)} 音律碎片`); }else{ ensurePieces(cardId)[piece]=true; toast(`已点亮 ${card.instrument} · 碎片 ${piece}`); } saveAndRender(); }
function unlockRandom(listOrCardId){ let cardId = typeof listOrCardId === 'string' ? listOrCardId : CARDS[Math.floor(Math.random()*CARDS.length)].id; const p=Math.floor(Math.random()*PIECE_COUNT)+1; unlockPiece(cardId,p); }
function unlockAll(cardId){ for(let p=1;p<=PIECE_COUNT;p++) ensurePieces(cardId)[p]=true; saveAndRender(); toast('本卡九宫拼图已全部点亮'); }
function maybeShowReward(cardId){ if(!isComplete(cardId) || completedOnce.has(cardId)) return; completedOnce.add(cardId); const card=getCard(cardId); document.getElementById('rewardModalTitle').textContent=`${card.instrument} 完整角色卡已解锁`; document.getElementById('rewardModalReward').textContent=`获得完整角色卡：${card.name}`; document.getElementById('rewardModalDesc').textContent=hasModel(card)?'九枚拼图已经归位，完整卡面显现。该角色卡的三维模型也已解锁，可在右侧按钮查看。':'九枚拼图已经归位，完整卡面显现。'; document.getElementById('rewardModal').classList.remove('hidden'); }

function openModelModal(cardId){
  const card=getCard(cardId);
  if(!hasModel(card)){ toast('该角色卡暂未接入三维模型'); return; }
  if(!isComplete(cardId)){ toast('集齐 9 个碎片后解锁三维模型'); return; }
  const viewer=document.getElementById('cardModelViewer');
  const sources=modelSources(card);
  if(viewer){ viewer.dataset.sources=JSON.stringify(sources); viewer.dataset.sourceIndex='0'; viewer.setAttribute('src',sources[0]); viewer.setAttribute('alt',card.modelAlt || `${card.instrument} 三维模型`); }
  document.getElementById('modelModalTitle').textContent=`${card.instrument} 三维模型`;
  document.getElementById('modelModalDesc').textContent=`${card.name} 已集齐九枚拼图，三维模型已解锁。可拖动旋转、滚轮缩放，手机端可双指缩放查看。`;
  document.getElementById('modelModal').classList.remove('hidden');
}
function closeModelModal(){ const modal=document.getElementById('modelModal'); if(modal) modal.classList.add('hidden'); const viewer=document.getElementById('cardModelViewer'); if(viewer) viewer.removeAttribute('src'); stopCollectionMusic(); }
function handleModelError(){ const viewer=document.getElementById('cardModelViewer'); if(!viewer) return; let sources=[]; try{ sources=JSON.parse(viewer.dataset.sources || '[]'); }catch(e){ sources=[]; } const idx=Number(viewer.dataset.sourceIndex || 0); const next=idx+1; if(sources[next]){ viewer.dataset.sourceIndex=String(next); viewer.setAttribute('src',sources[next]); }else{ toast('模型文件未找到，请把对应 GLB 放到 data.js 里配置的 assets/models 路径'); } }

function checkGlobalCompletionReward(){}

document.getElementById('backOverviewBtn').onclick=closeScroll;
document.getElementById('pieceModalClose').onclick=closePieceModal;
document.getElementById('modalCloseBtn2').onclick=closePieceModal;
document.getElementById('pieceModal').addEventListener('click',e=>{ if(e.target.id==='pieceModal') closePieceModal(); });
document.getElementById('rewardModalClose').onclick=()=>document.getElementById('rewardModal').classList.add('hidden');
document.getElementById('rewardModalOk').onclick=()=>document.getElementById('rewardModal').classList.add('hidden');
document.getElementById('modelModalClose').onclick=closeModelModal;
document.getElementById('modelModalOk').onclick=closeModelModal;
document.getElementById('modelModal').addEventListener('click',e=>{ if(e.target.id==='modelModal') closeModelModal(); });
const cardModelViewer=document.getElementById('cardModelViewer'); if(cardModelViewer) cardModelViewer.addEventListener('error',handleModelError);
document.getElementById('modalUnlockBtn').onclick=()=>{ if(currentCardId&&currentPiece&&!hasPiece(currentCardId,currentPiece)){ unlockPiece(currentCardId,currentPiece); openPieceModal(currentCardId,currentPiece); } };
document.getElementById('modalPlayMusicBtn').onclick=()=>{ if(currentCardId&&currentPiece) playPieceMusic(currentCardId,currentPiece); };
document.getElementById('demoDrawBtn').onclick=()=>unlockRandom(CARDS);
document.getElementById('demoAllBtn').onclick=()=>{ CARDS.forEach(c=>{ for(let p=1;p<=PIECE_COUNT;p++) ensurePieces(c.id)[p]=true; }); saveAndRender(); toast('全部角色卡拼图已点亮'); };
document.getElementById('demoResetBtn').onclick=()=>{ if(confirm('确认重置典藏进度？')){ state=structuredClone(DEFAULT_STATE); saveState(); closeScroll(); renderOverview(); toast('已重置演示进度'); } };
document.getElementById('unlockOneToneBtn').onclick=()=>{ if(currentCardId) unlockRandom(currentCardId); };
document.getElementById('unlockToneAllBtn').onclick=()=>{ if(currentCardId) unlockAll(currentCardId); };
document.getElementById('viewModelBtn').onclick=()=>{ if(currentCardId) openModelModal(currentCardId); };
document.getElementById('playFullMusicBtn').onclick=()=>{ if(currentCardId) playFullMusic(currentCardId); };
renderOverview();
if(location.hash){ const id=location.hash.replace('#',''); if(getCard(id)) openScroll(id); }
