
const STORAGE_KEY = 'wuyin_gacha_pool_v1';
const DEFAULT_STATE = { notes: 3200, tickets: 6, fragments: 0, pity: 0, cards: {}, history: [] };
let state = loadState();
let currentTone = null;
let currentCardId = null;

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

function ensurePieceMusicControl(){
  const row = document.querySelector('#pieceModal .modal-actions-row');
  if(!row) return null;
  let btn = document.getElementById('pieceMusicPlayBtn');
  if(!btn){
    btn = document.createElement('button');
    btn.id = 'pieceMusicPlayBtn';
    btn.className = 'classic-btn ghost card-music-btn';
    btn.type = 'button';
    btn.textContent = '播放音乐';
    btn.onclick = () => {
      if(currentMusicCardId) playCardMusic(currentMusicCardId, true);
    };
    row.insertBefore(btn, row.firstChild);
  }
  let hint = document.getElementById('pieceMusicHint');
  if(!hint){
    hint = document.createElement('div');
    hint.id = 'pieceMusicHint';
    hint.className = 'card-music-hint';
    row.parentNode.insertBefore(hint, row);
  }
  return {btn, hint};
}
function setPieceMusicHint(msg){
  const control = ensurePieceMusicControl();
  if(control) control.hint.textContent = msg || '';
}
function setPieceMusicButtonVisible(visible, text='播放音乐'){
  const control = ensurePieceMusicControl();
  if(!control) return;
  control.btn.textContent = text;
  control.btn.classList.toggle('hidden', !visible);
}
function stopCardMusic(){
  cardAudioPlayer.pause();
  try{ cardAudioPlayer.currentTime = 0; }catch(e){}
}
function playCardMusic(id, manual=false){
  currentMusicCardId = id;
  ensurePieceMusicControl();
  stopCardMusic();
  musicEnabled = localStorage.getItem(MUSIC_KEY) !== 'off';
  if(!musicEnabled){
    setPieceMusicButtonVisible(false);
    setPieceMusicHint('音乐已关闭');
    return;
  }
  if(!isOwned(id)){
    setPieceMusicButtonVisible(false);
    setPieceMusicHint('未获得的卡牌不能播放音乐');
    return;
  }
  const src = CARD_AUDIO[id];
  if(!src){
    setPieceMusicButtonVisible(false);
    setPieceMusicHint('这张卡暂未放入音频文件');
    return;
  }
  setPieceMusicButtonVisible(false);
  setPieceMusicHint(manual ? '正在播放……' : '正在尝试播放……');
  cardAudioPlayer.src = src;
  cardAudioPlayer.load();
  cardAudioPlayer.play().then(()=>{
    setPieceMusicHint('正在播放乐器音色');
  }).catch(()=>{
    setPieceMusicButtonVisible(true, '播放音乐');
    setPieceMusicHint('手机浏览器拦截了自动播放，请点“播放音乐”');
  });
}

const COLLECTION_IMAGES = {
  gong: 'assets/collections/gong_full.png',
  shang: 'assets/collections/shang_full.png',
  jiao: 'assets/collections/jiao_full.png',
  zhi: 'assets/collections/zhi_full.png',
  yu: 'assets/collections/yu_full.png'
};
const COLLECTION_TITLES = {
  gong: '宫音藏卷 · 厚土礼乐图',
  shang: '商音藏卷 · 金石清声图',
  jiao: '角音藏卷 · 春竹生风图',
  zhi: '徵音藏卷 · 丝弦流火图',
  yu: '羽音藏卷 · 水月空灵图'
};
const COLLECTION_DESCS = {
  gong: '厚土、祭礼、陶埙与鼓声构成的长夏藏卷。',
  shang: '金石、礼器、青铜与霜白清光构成的肃穆藏卷。',
  jiao: '竹林、春风、青玉与木竹吹管构成的生发藏卷。',
  zhi: '丝弦、流火、绯红与灯影构成的热烈藏卷。',
  yu: '水月、夜雾、冰蓝与匏竹管乐构成的空灵藏卷。'
};

const COMPLETION_REWARDS = {
  gong: { scroll: '厚土礼乐图已完整归藏', title: '获得称号：礼乐承土', desc: '宫音归位，厚土礼声自此长鸣。' },
  shang: { scroll: '金石清声图已完整归藏', title: '获得称号：金石清音', desc: '商音归位，钟磬之声洗尽尘嚣。' },
  jiao: { scroll: '春竹生风图已完整归藏', title: '获得称号：竹音初醒', desc: '角音归位，春风入竹，万物始生。' },
  zhi: { scroll: '丝弦流火图已完整归藏', title: '获得称号：弦火照夜', desc: '徵音归位，丝弦流火，照彻长夜。' },
  yu: { scroll: '水月空灵图已完整归藏', title: '获得称号：水月听心', desc: '羽音归位，水月澄明，空灵入梦。' },
  all: { scroll: '五音合鸣，乐藏大成', title: '获得称号：五音大成', desc: '宫、商、角、徵、羽五卷皆归，华夏乐藏终成一体。' }
};

const INSTRUMENT_LORE = {
  gong_xun: { history:'埙是中国非常古老的吹奏乐器，多以陶土烧制而成，常见于远古礼乐与祭祀想象之中。', sound:'音色低沉、浑厚、苍凉，像从土地深处传出的回声。', scene:'适合表现大地、远古、祭礼与沉思的氛围。' },
  gong_dagu: { history:'大鼓是重要的打击乐器，常用于礼仪、军阵、戏曲和民间庆典。', sound:'声音厚重有力，节奏感强，能迅速建立庄严或激昂的气势。', scene:'常用于祭祀、战阵、舞台开场和大型仪式场景。' },
  gong_jiangu: { history:'建鼓是一种立鼓，常与古代礼乐制度相关，具有鲜明的仪式感。', sound:'鼓声稳重而有支撑力，像礼乐空间中的节拍支柱。', scene:'适合表现庙堂、朝会、礼制和盛大典仪。' },
  gong_fou: { history:'缶本是陶制器物，古人可击缶为节，带有古朴的民间与先秦气息。', sound:'声音短促、朴拙、坚实，具有陶土质感。', scene:'适合表现秦地风骨、民间节奏和粗粝古意。' },
  gong_paigu: { history:'排鼓由多面鼓组合而成，能形成丰富的节奏层次。', sound:'音响层层递进，节奏变化比单鼓更丰富。', scene:'常用于舞台、庆典和需要强烈节奏推进的场景。' },
  gong_yu: { history:'敔是古代雅乐中的止乐器，常在乐曲结束时使用。', sound:'它不以旋律取胜，而以“止”“收束”的象征意义突出。', scene:'适合表现礼乐收束、仪式完成和秩序归位。' },
  gong_paiban: { history:'拍板是传统戏曲、曲艺中常见的节奏乐器，用于把握板眼。', sound:'声音清脆直接，能明确提示节奏和段落。', scene:'常见于戏曲、说唱、教坊乐舞等表演环境。' },
  gong_muyu: { history:'木鱼常见于佛教音乐和民间器乐，也可作为节奏提示。', sound:'音色空而清，节奏稳定，带有静心意味。', scene:'适合表现清修、诵念、静心和空灵秩序。' },

  shang_bianzhong: { history:'编钟是中国古代青铜礼乐重器，常成组悬挂演奏。', sound:'音色宏亮、庄严、清越，具有金石之声的厚度。', scene:'适合表现宫廷礼乐、祭祀典礼和国家礼制。' },
  shang_bianqing: { history:'编磬由石或玉制磬片组成，是古代雅乐中的金石类乐器。', sound:'音色清冷、明亮、余韵干净，如玉石相击。', scene:'适合表现清肃、礼仪、山岳和玉石意象。' },
  shang_yunluo: { history:'云锣由多面小锣组成，排列如云，常用于传统器乐合奏。', sound:'声音清脆明亮，层层小锣形成星点般的音响。', scene:'适合表现轻盈、飞天、云上乐舞和节庆气氛。' },
  shang_daluo: { history:'大锣在戏曲、民俗和仪式中常用于制造强烈场面转换。', sound:'音量大、穿透强，一响即可打开场面。', scene:'常见于戏曲武场、庆典和热烈民间场景。' },
  shang_naobo: { history:'铙钹是铜制打击乐器，常用于戏曲、民间社火和宗教仪式。', sound:'声音明亮、热烈，带有金属碰击的锐利感。', scene:'适合表现节庆、社火、舞蹈和热闹人群。' },
  shang_zheng: { history:'钲是古代金属打击乐器，也常与军旅、号令意象相关。', sound:'声音肃整、短促、有命令感。', scene:'适合表现军阵、号令、秩序和金石威严。' },
  shang_xiaoluo: { history:'小锣是戏曲和民间合奏中的常用打击乐器。', sound:'声音轻巧、敏捷，常用于提示动作和节奏变化。', scene:'适合表现戏台转场、机敏人物和轻快节奏。' },
  shang_fangxiang: { history:'方响是古代金属体鸣乐器，由若干金属片排列敲击发声。', sound:'音色清脆规整，有阶梯式的明亮感。', scene:'适合表现金石秩序、工匠精神和清音结构。' },

  jiao_dizi: { history:'笛子是中国最具代表性的横吹竹管乐器之一，梆笛清亮，曲笛圆润。', sound:'声音明亮、流动、富有穿透力，能表现春风和山水。', scene:'常见于民乐合奏、戏曲伴奏和江南山水意境。' },
  jiao_dongxiao: { history:'洞箫是竖吹竹管乐器，常与文人音乐、清雅审美相连。', sound:'音色低回、悠远、含蓄，带有很强的静气。', scene:'适合表现竹林、月夜、独坐和文人雅集。' },
  jiao_chi: { history:'篪是古代横吹竹管乐器，在雅乐传统中具有古雅意味。', sound:'音色古朴、柔和，带有礼乐旧梦般的气质。', scene:'适合表现周礼、古乐、春意和雅正场景。' },
  jiao_paixiao: { history:'排箫由长短不同的竹管或管体排列而成，是历史悠久的吹奏乐器。', sound:'音色层次分明，像山谷中逐层展开的回声。', scene:'适合表现仙童、山谷、轻灵和古代乐舞。' },
  jiao_bawu: { history:'巴乌常见于西南民族音乐，虽形似笛，却带有簧片发声特点。', sound:'音色柔和、温暖、略带鼻音，抒情性强。', scene:'适合表现西南花影、林间小路和温柔叙事。' },
  jiao_guanzi: { history:'管子是双簧管类传统吹奏乐器，历史悠久，常用于北方民间音乐。', sound:'音色高亢而有骨力，带有粗犷和苍劲感。', scene:'适合表现西北风沙、乐官行旅和有力的民间气息。' },
  jiao_chiba: { history:'尺八是竖吹管乐器，与竹管清寂之声相关，在东亚音乐文化中影响深远。', sound:'音色沉静、空灵、带有呼吸感。', scene:'适合表现山林、禅意、远行和清寂空间。' },
  jiao_miaodi: { history:'苗笛是苗族等民族音乐中的吹奏乐器，具有鲜明地域色彩。', sound:'声音轻快明亮，旋律常带有山野灵动感。', scene:'适合表现苗岭、山歌、节庆和自然风声。' },

  zhi_guqin: { history:'古琴是中国文人音乐的重要代表，历史悠久，被视为修身养性的雅器。', sound:'音色含蓄、深远，重在余韵和意境。', scene:'适合表现文人独坐、山水清谈和精神修养。' },
  zhi_pipa: { history:'琵琶是重要的弹拨乐器，唐代以来广泛流行，表现力极强。', sound:'声音颗粒感鲜明，可柔可烈，能表现战阵与抒情。', scene:'适合表现飞天乐舞、侠女、战意和繁华都市。' },
  zhi_konghou: { history:'箜篌是古代竖琴类弹拨乐器，常带有盛唐与飞天意象。', sound:'音色华丽、透明，像流光一样展开。', scene:'适合表现宫廷乐舞、飞天、长安和梦幻场景。' },
  zhi_guzheng: { history:'古筝是中国常见弹拨乐器，弦多而音域宽广。', sound:'音色明亮流畅，既能表现水波，也能表现激烈段落。', scene:'适合表现丝乐、夜宴、江河和舞台独奏。' },
  zhi_se: { history:'瑟是古代弦乐器，常与琴并称，具有礼乐与典雅意味。', sound:'音色庄重、宽厚，带有华丽而古老的气息。', scene:'适合表现古礼、贵族宴乐和庄严叙事。' },
  zhi_ruan: { history:'阮是圆形琴身的弹拨乐器，常与魏晋风度和文人意象相连。', sound:'音色温润、圆融，节奏表现灵活。', scene:'适合表现竹林、月下、酒意和闲适人物。' },
  zhi_erhu: { history:'二胡是中国代表性拉弦乐器，近现代民族音乐中非常常见。', sound:'音色接近人声，哀婉、深情、富有叙事性。', scene:'适合表现人间悲喜、夜色、街巷和情感独白。' },
  zhi_matouqin: { history:'马头琴是蒙古族代表性拉弦乐器，琴首常作马头形。', sound:'音色辽阔、浑厚，像草原上的长风。', scene:'适合表现草原、星夜、马群和远方。' },

  yu_suona: { history:'唢呐是高亢响亮的双簧管类乐器，广泛用于民间礼俗。', sound:'声音极具穿透力，热烈、直接、情绪浓烈。', scene:'适合表现婚丧礼俗、民间庆典和强烈戏剧转折。' },
  yu_sheng: { history:'笙是簧管乐器，可同时发出多个音，是古代重要和声性乐器。', sound:'音色明亮而温润，像气息托起的光。', scene:'适合表现凤翼、仙乐、宫廷和水月空间。' },
  yu_yu: { history:'竽是古代簧管乐器，形制较大，常见于先秦两汉礼乐想象。', sound:'声音厚而远，有群音汇聚的效果。', scene:'适合表现朝堂、古殿和宏大的礼乐场景。' },
  yu_hulusi: { history:'葫芦丝是西南地区常见簧管乐器，以葫芦作共鸣体。', sound:'音色柔美、婉转、亲切，辨识度很高。', scene:'适合表现水边、白衣少女、民歌和温柔夜色。' },
  yu_lusheng: { history:'芦笙是苗、侗等民族常见簧管乐器，与歌舞节庆密切相关。', sound:'声音明亮而有舞蹈感，常与群体节奏相连。', scene:'适合表现苗寨、银饰、舞蹈和节日广场。' },
  yu_fengsheng: { history:'凤笙是带有凤鸟意象的笙类乐器名称，常用于诗意化的传统乐器表达。', sound:'音色轻灵、明亮，像羽光浮动。', scene:'适合表现寒羽、童子、仙鸟和清冷梦境。' },
  yu_paisheng: { history:'排笙是多管簧乐器，音管排列更适合表现丰富和声。', sound:'声音层次较厚，能产生连续而开阔的气息。', scene:'适合表现水桥、层叠水声和合奏空间。' },
  yu_mangtong: { history:'芒筒是少数民族地区的管乐器，常有低沉悠长的音响。', sound:'声音低回、朴拙、带有山谷回声。', scene:'适合表现山水、夜雾、村寨和远处呼应。' }
};

const completedOnce = new Set();



const CANVAS = { w: 1122, h: 1402 };
const COLS = [0, 374, 748, 1122];
const ROWS = [0, 467.333, 934.667, 1402];
const TAB = { width: 76, neck: 28, depth: 42 };

// 3×3 九宫拼图：中间为标题区，周围八块对应 8 张卡。
// 数据中的 pieceIndex 保持不变：
// 1 左上, 2 上中, 3 右上, 4 左中, 5 右中, 6 左下, 7 下中, 8 右下。
const PIECE_LAYOUT = [
  { key: 'p1', pieceIndex: 1, row: 0, col: 0, label: { left: 16.8, top: 17.2 } },
  { key: 'p2', pieceIndex: 2, row: 0, col: 1, label: { left: 50.0, top: 17.2 } },
  { key: 'p3', pieceIndex: 3, row: 0, col: 2, label: { left: 83.2, top: 17.2 } },
  { key: 'p4', pieceIndex: 4, row: 1, col: 0, label: { left: 16.8, top: 50.0 } },
  { key: 'center', pieceIndex: 0, row: 1, col: 1, label: null, center: true },
  { key: 'p5', pieceIndex: 5, row: 1, col: 2, label: { left: 83.2, top: 50.0 } },
  { key: 'p6', pieceIndex: 6, row: 2, col: 0, label: { left: 16.8, top: 82.8 } },
  { key: 'p7', pieceIndex: 7, row: 2, col: 1, label: { left: 50.0, top: 82.8 } },
  { key: 'p8', pieceIndex: 8, row: 2, col: 2, label: { left: 83.2, top: 82.8 } }
];

const H_TABS = [
  [ 1, -1,  1],   // top row -> middle row
  [-1,  1, -1]    // middle row -> bottom row
];
const V_TABS = [
  [ 1, -1],       // top row, between col0-1 and col1-2
  [-1,  1],       // middle row
  [ 1, -1]        // bottom row
];

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : JSON.parse(JSON.stringify(DEFAULT_STATE));
  }catch(e){
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function ownedCount(id){ return state.cards[id] || 0; }
function isOwned(id){ return ownedCount(id) > 0; }
function rarityLabel(r){ return RARITIES[r]?.name || r; }
function rarityClass(r){ return 'rarity-' + r.toLowerCase(); }
function toneCards(tone){ return CARDS.filter(c => c.tone === tone).sort((a,b)=>a.pieceIndex-b.pieceIndex); }
function getCardByTonePiece(tone, pieceIndex){ return CARDS.find(c => c.tone === tone && c.pieceIndex === pieceIndex); }
function getCard(id){ return CARDS.find(c => c.id === id); }
function toast(msg){ const el=document.getElementById('collectionToast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),2200); }
function saveAndRender(){ saveState(); renderOverview(); if(currentTone) renderScroll(currentTone); checkGlobalCompletionReward(); }

function renderOverview(){
  const grid = document.getElementById('scrollGrid');
  let totalOwned = 0;
  grid.innerHTML = Object.entries(TONES).map(([toneId,t])=>{
    const list = toneCards(toneId);
    const owned = list.filter(c=>isOwned(c.id)).length;
    totalOwned += owned;
    const pct = owned / list.length * 100;
    const completed = owned === list.length;
    return `<article class="scroll-card" data-tone="${toneId}" style="--tone-color:${t.color}">
      ${completed ? '<div class="completed-badge">已完成</div>' : ''}
      <img src="${COLLECTION_IMAGES[toneId]}" alt="${COLLECTION_TITLES[toneId]}">
      <div class="scroll-card-info">
        <h3>${t.mode}藏卷</h3>
        <p>${COLLECTION_TITLES[toneId].split('·')[1].trim()}</p>
        <div class="scroll-mini-progress"><span style="width:${pct}%"></span></div>
        <div class="scroll-card-meta"><span>${owned}/${list.length}</span><span>${completed?'完整显现':'尚有封印'}</span></div>
      </div>
    </article>`;
  }).join('');
  document.getElementById('globalProgressText').textContent = `总进度 ${totalOwned} / ${CARDS.length}`;
  grid.querySelectorAll('.scroll-card').forEach(el=>el.addEventListener('click',()=>openScroll(el.dataset.tone)));
}

function openScroll(toneId){
  currentTone = toneId;
  document.getElementById('overviewView').classList.add('hidden');
  document.getElementById('scrollView').classList.remove('hidden');
  renderScroll(toneId);
  window.scrollTo({top:0,behavior:'smooth'});
}
function closeScroll(){
  currentTone = null;
  document.getElementById('scrollView').classList.add('hidden');
  document.getElementById('overviewView').classList.remove('hidden');
  renderOverview();
}

function lockIcon(card){
  if(card.rarity === 'SSR') return 'lock-gold.png';
  if(card.rarity === 'SR') return 'lock-silver.png';
  return 'lock-jade.png';
}
function labelText(card){
  if(isOwned(card.id)) return {title:`${card.instrument}`, sub:'已归藏'};
  if(card.rarity === 'SSR') return {title:'天籁未现', sub:'锁印未启'};
  if(card.rarity === 'SR') return {title:'灵韵未启', sub:`器灵 ${String(card.pieceIndex).padStart(2,'0')}`};
  return {title:'尚未归藏', sub:`器灵 ${String(card.pieceIndex).padStart(2,'0')}`};
}

function lineH(x1,y,x2,side,sign){
  if(sign === 0) return `L ${x2} ${y}`;
  const dir = sign * (side === 'top' ? -1 : 1);
  const w = TAB.width, n = TAB.neck, d = TAB.depth;
  const m = (x1 + x2) / 2;
  return [
    `L ${m - w} ${y}`,
    `C ${m - w*0.55} ${y}, ${m - n} ${y + dir*d*0.14}, ${m - n} ${y + dir*d*0.56}`,
    `C ${m - n} ${y + dir*d}, ${m + n} ${y + dir*d}, ${m + n} ${y + dir*d*0.56}`,
    `C ${m + n} ${y + dir*d*0.14}, ${m + w*0.55} ${y}, ${m + w} ${y}`,
    `L ${x2} ${y}`
  ].join(' ');
}
function lineV(x,y1,y2,side,sign){
  if(sign === 0) return `L ${x} ${y2}`;
  const dir = sign * (side === 'left' ? -1 : 1);
  const w = TAB.width, n = TAB.neck, d = TAB.depth;
  const m = (y1 + y2) / 2;
  return [
    `L ${x} ${m - w}`,
    `C ${x} ${m - w*0.55}, ${x + dir*d*0.14} ${m - n}, ${x + dir*d*0.56} ${m - n}`,
    `C ${x + dir*d} ${m - n}, ${x + dir*d} ${m + n}, ${x + dir*d*0.56} ${m + n}`,
    `C ${x + dir*d*0.14} ${m + n}, ${x} ${m + w*0.55}, ${x} ${m + w}`,
    `L ${x} ${y2}`
  ].join(' ');
}

function pieceSigns(row, col){
  const top = row === 0 ? 0 : -H_TABS[row - 1][col];
  const right = col === 2 ? 0 : V_TABS[row][col];
  const bottom = row === 2 ? 0 : H_TABS[row][col];
  const left = col === 0 ? 0 : -V_TABS[row][col - 1];
  return { top, right, bottom, left };
}

function buildPiecePath(row, col){
  const x1 = COLS[col], x2 = COLS[col + 1];
  const y1 = ROWS[row], y2 = ROWS[row + 1];
  const s = pieceSigns(row, col);
  return [
    `M ${x1} ${y1}`,
    lineH(x1, y1, x2, 'top', s.top),
    lineV(x2, y1, y2, 'right', s.right),
    lineH(x2, y2, x1, 'bottom', s.bottom),
    lineV(x1, y2, y1, 'left', s.left),
    'Z'
  ].join(' ');
}

const PIECE_PATHS = PIECE_LAYOUT.reduce((acc, item) => {
  acc[item.key] = buildPiecePath(item.row, item.col);
  return acc;
}, {});

function renderScroll(toneId){
  const t = TONES[toneId];
  const list = toneCards(toneId);
  const owned = list.filter(c=>isOwned(c.id));
  const pct = owned.length / list.length * 100;
  document.documentElement.style.setProperty('--tone-color', t.color);
  document.getElementById('scrollTitle').textContent = `${t.mode}藏卷`;
  document.getElementById('scrollSubtitle').textContent = COLLECTION_TITLES[toneId].split('·')[1].trim();
  document.getElementById('scrollProgressPill').textContent = `${owned.length} / ${list.length}`;
  document.getElementById('scrollImage').src = COLLECTION_IMAGES[toneId];
  document.getElementById('sideToneName').textContent = COLLECTION_TITLES[toneId];
  document.getElementById('sideToneDesc').textContent = COLLECTION_DESCS[toneId];
  document.getElementById('sideProgressBar').style.width = `${pct}%`;

  const svg = document.getElementById('pieceSvg');
  const href = COLLECTION_IMAGES[toneId];
  const defs = PIECE_LAYOUT.map(item => `<clipPath id="clip-${item.key}" clipPathUnits="userSpaceOnUse"><path d="${PIECE_PATHS[item.key]}"></path></clipPath>`).join('');
  const brightLayers = PIECE_LAYOUT.map(item => {
    if(item.center){
      return `<image class="piece-title" href="${href}" x="0" y="0" width="${CANVAS.w}" height="${CANVAS.h}" preserveAspectRatio="none" clip-path="url(#clip-${item.key})"></image>`;
    }
    const card = getCardByTonePiece(toneId, item.pieceIndex);
    if(card && isOwned(card.id)){
      return `<image class="piece-light" href="${href}" x="0" y="0" width="${CANVAS.w}" height="${CANVAS.h}" preserveAspectRatio="none" clip-path="url(#clip-${item.key})"></image>`;
    }
    return '';
  }).join('');
  const seams = PIECE_LAYOUT.map(item => `<path class="piece-seam" d="${PIECE_PATHS[item.key]}"></path>`).join('');
  const hits = PIECE_LAYOUT.filter(item => !item.center).map(item => {
    const card = getCardByTonePiece(toneId, item.pieceIndex);
    return `<path class="piece-hit" data-id="${card.id}" d="${PIECE_PATHS[item.key]}"></path>`;
  }).join('');

  svg.innerHTML = `<defs>${defs}</defs>${brightLayers}${seams}${hits}`;
  svg.querySelectorAll('.piece-hit').forEach(p => p.addEventListener('click', ()=>openPieceModal(p.dataset.id)));

  const labels = document.getElementById('pieceLabels');
  labels.innerHTML = PIECE_LAYOUT.filter(item => !item.center).map(item => {
    const card = getCardByTonePiece(toneId, item.pieceIndex);
    const txt = labelText(card);
    const cls = isOwned(card.id) ? 'unlocked' : (card.rarity==='SSR'?'locked-ssr':card.rarity==='SR'?'locked-sr':'locked-nr');
    const icon = isOwned(card.id)
      ? '<i class="piece-owned-dot"></i>'
      : `<img class="piece-lock-img" src="assets/locks/${lockIcon(card)}" alt="锁">`;
    return `<div class="piece-label ${cls}" style="left:${item.label.left}%;top:${item.label.top}%" data-id="${card.id}">${icon}<strong>${txt.title}</strong><span>${txt.sub}</span></div>`;
  }).join('');
  labels.querySelectorAll('.piece-label').forEach(l=>l.addEventListener('click',()=>openPieceModal(l.dataset.id)));

  const rarities = ['SSR','SR','R','N'];
  document.getElementById('rarityStat').innerHTML = rarities.map(r=>{
    const total = list.filter(c=>c.rarity===r).length;
    const got = list.filter(c=>c.rarity===r && isOwned(c.id)).length;
    return `<div class="rarity-chip"><span>${rarityLabel(r)}</span><b>${got} / ${total}</b></div>`;
  }).join('');

  document.getElementById('scrollCardList').innerHTML = list.map(card=>`<div class="scroll-list-item" data-id="${card.id}">
    <div><div class="name">${card.pieceIndex}. ${card.instrument}</div><div class="meta">${rarityLabel(card.rarity)} · ${card.role}</div></div>
    <span class="status-dot ${isOwned(card.id)?'owned':''}">${isOwned(card.id)?'已归藏':'未归藏'}</span>
  </div>`).join('');
  document.querySelectorAll('.scroll-list-item').forEach(el=>el.addEventListener('click',()=>openPieceModal(el.dataset.id)));
  checkCompletionRewards(toneId);
}

function buildLockedDesc(c){
  if(c.rarity === 'SSR') return '天籁器灵尚未现身。完整卡面、乐器小传与音色介绍将在抽到后解锁。';
  if(c.rarity === 'SR') return '灵韵封印尚未开启。抽到该器灵后，可查看更完整的乐器来源、音色特点与文化场景。';
  return '该器灵尚未归藏。抽到后可查看完整乐器科普与器灵设定。';
}
function buildUnlockedDesc(c){
  const lore = INSTRUMENT_LORE[c.id];
  if(!lore) return c.description;
  return `${c.description}

【乐器小传】
${lore.history}

【音色特点】
${lore.sound}

【文化场景】
${lore.scene}`;
}
function openPieceModal(id){
  currentCardId = id;
  const c = getCard(id);
  const owned = isOwned(id);
  document.getElementById('pieceModalImg').src = c.image;
  document.getElementById('pieceModalImg').style.filter = owned ? 'none' : 'grayscale(1) brightness(.45) blur(1px)';
  document.getElementById('pieceModalRarity').textContent = rarityLabel(c.rarity);
  document.getElementById('pieceModalRarity').className = `modal-rarity ${rarityClass(c.rarity)}`;
  document.getElementById('pieceModalName').textContent = owned ? c.name : (c.rarity==='SSR' ? '天籁器灵未现' : `${c.toneName}器灵 ${String(c.pieceIndex).padStart(2,'0')}`);
  document.getElementById('pieceModalDesc').textContent = owned ? buildUnlockedDesc(c) : buildLockedDesc(c);
  document.getElementById('pieceModalInstrument').textContent = owned ? c.instrument : '尚未公开';
  document.getElementById('pieceModalTone').textContent = c.toneName;
  document.getElementById('pieceModalElement').textContent = c.element;
  document.getElementById('pieceModalOwned').textContent = owned ? `已拥有 ${ownedCount(id)} 张` : '尚未拥有';
  document.getElementById('modalUnlockBtn').textContent = owned ? '已归藏' : '模拟抽到此卡';
  document.getElementById('pieceModal').classList.remove('hidden');
  const pieceModalEl = document.getElementById('pieceModal');
  const pieceModalCard = pieceModalEl ? pieceModalEl.querySelector('.piece-modal-card') : null;
  if(pieceModalEl) pieceModalEl.scrollTop = 0;
  if(pieceModalCard) pieceModalCard.scrollTop = 0;
  playCardMusic(id);
}
function closePieceModal(){ document.getElementById('pieceModal').classList.add('hidden'); stopCardMusic(); currentCardId=null; }
function unlockCard(id){
  state.cards[id] = (state.cards[id] || 0) + 1;
  state.history.unshift({id,time:Date.now(),new:state.cards[id]===1});
  toast(`已归藏：${getCard(id).name}`);
  saveAndRender();
}
function unlockRandom(list){
  const pool = list.filter(c=>!isOwned(c.id));
  if(!pool.length){ toast('已全部归藏'); return; }
  unlockCard(pool[Math.floor(Math.random()*pool.length)].id);
}
function unlockAll(list){
  list.forEach(c=>{ if(!isOwned(c.id)) state.cards[c.id]=1; });
  toast('藏卷已完整显现');
  saveAndRender();
}


function rewardKey(toneId){ return `reward_scroll_${toneId}`; }
function allRewardKey(){ return 'reward_all_wuyin'; }
function hasReward(key){ return !!state[key]; }
function setReward(key){ state[key] = true; saveState(); }
function isToneComplete(toneId){
  const list = toneCards(toneId);
  return list.length > 0 && list.every(c => isOwned(c.id));
}
function isAllComplete(){
  return Object.keys(TONES).every(toneId => isToneComplete(toneId));
}
function checkCompletionRewards(toneId){
  if(!toneId) return;
  if(isToneComplete(toneId) && !hasReward(rewardKey(toneId))){
    setReward(rewardKey(toneId));
    const r = COMPLETION_REWARDS[toneId];
    showRewardModal(r.scroll, r.title, r.desc, false);
    return;
  }
  if(isAllComplete() && !hasReward(allRewardKey())){
    setReward(allRewardKey());
    const r = COMPLETION_REWARDS.all;
    showRewardModal(r.scroll, r.title, r.desc, true);
  }
}
function checkGlobalCompletionReward(){
  if(isAllComplete() && !hasReward(allRewardKey())){
    setReward(allRewardKey());
    const r = COMPLETION_REWARDS.all;
    showRewardModal(r.scroll, r.title, r.desc, true);
  }
}
function showRewardModal(title, reward, desc, isAll){
  const modal = document.getElementById('rewardModal');
  if(!modal) return;
  document.getElementById('rewardModalTitle').textContent = title;
  document.getElementById('rewardModalReward').textContent = reward;
  document.getElementById('rewardModalDesc').textContent = desc;
  document.getElementById('rewardModalSeal').textContent = isAll ? '成' : '藏';
  modal.classList.remove('hidden');
}
function closeRewardModal(){
  const modal = document.getElementById('rewardModal');
  if(modal) modal.classList.add('hidden');
}

// events
document.getElementById('backOverviewBtn').onclick = closeScroll;
document.getElementById('pieceModalClose').onclick = closePieceModal;
document.getElementById('modalCloseBtn2').onclick = closePieceModal;
document.getElementById('pieceModal').addEventListener('click',e=>{ if(e.target.id==='pieceModal') closePieceModal(); });
document.getElementById('rewardModalClose').onclick = closeRewardModal;
document.getElementById('rewardModalOk').onclick = closeRewardModal;
document.getElementById('rewardModal').addEventListener('click',e=>{ if(e.target.id==='rewardModal') closeRewardModal(); });
document.getElementById('modalUnlockBtn').onclick = ()=>{ if(currentCardId && !isOwned(currentCardId)){ unlockCard(currentCardId); openPieceModal(currentCardId); } };
document.getElementById('demoDrawBtn').onclick = ()=>unlockRandom(CARDS);
document.getElementById('demoAllBtn').onclick = ()=>unlockAll(CARDS);
document.getElementById('demoResetBtn').onclick = ()=>{ if(confirm('确认重置全部抽卡与典藏数据？')){ state = JSON.parse(JSON.stringify(DEFAULT_STATE)); saveAndRender(); toast('已重置典藏进度'); } };
document.getElementById('unlockOneToneBtn').onclick = ()=>{ if(currentTone) unlockRandom(toneCards(currentTone)); };
document.getElementById('unlockToneAllBtn').onclick = ()=>{ if(currentTone) unlockAll(toneCards(currentTone)); };
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closePieceModal(); });

renderOverview();
