const TONES = {
  gong: { tone: '宫', mode: '宫音', element: '土', theme: '厚土礼乐', color: '#c78d45', dark: '#2a1b12', light: '#f2c46e', accent: '#8c4a2e' },
  shang: { tone: '商', mode: '商音', element: '金', theme: '金石清声', color: '#c9d2d8', dark: '#111a20', light: '#f0f4f5', accent: '#8a9d9e' },
  jiao: { tone: '角', mode: '角音', element: '木', theme: '春竹生风', color: '#7fb391', dark: '#10241b', light: '#cde6d6', accent: '#3c755e' },
  zhi: { tone: '徵', mode: '徵音', element: '火', theme: '丝弦流火', color: '#c9493d', dark: '#2a0d0d', light: '#ffb078', accent: '#8f1f1c' },
  yu: { tone: '羽', mode: '羽音', element: '水', theme: '水月空灵', color: '#6e9dd4', dark: '#071221', light: '#c7e3ff', accent: '#1d568a' }
};
const RARITIES = {
  N: { name: '初鸣', prob: 0, color: '#75847c', cost: 0 },
  R: { name: '清音', prob: 0, color: '#58a184', cost: 0 },
  SR: { name: '灵韵', prob: 0, color: '#9aaee8', cost: 0 },
  SSR: { name: '天籁', prob: 100, color: '#e0b74f', cost: 0 }
};
const CARDS = [
  { id:'gong_muyu', tone:'gong', name:'宫调 · 木鱼', instrument:'木鱼', rarity:'SSR', rarityName:'天籁', role:'静心梵响', description:'木鱼常见于佛教音乐与民间器乐，音色空而清，节奏稳定，带有静心意味。', image:'assets/cards/gong_muyu.png', toneName:'宫音', element:'土' },
  { id:'shang_bianqing', tone:'shang', name:'商调 · 编磬', instrument:'编磬', rarity:'SSR', rarityName:'天籁', role:'金石清声', description:'编磬由石或玉制磬片组成，音色清冷、明亮、余韵干净，如玉石相击。', image:'assets/cards/shang_bianqing.png', toneName:'商音', element:'金' },
  { id:'jiao_paixiao', tone:'jiao', name:'角调 · 排箫', instrument:'排箫', rarity:'SSR', rarityName:'天籁', role:'春竹生风', description:'排箫由多管组成，音色空灵柔和，像竹林与山风一起流动。', image:'assets/cards/jiao_paixiao.png', toneName:'角音', element:'木' },
  { id:'zhi_erhu', tone:'zhi', name:'徵调 · 二胡', instrument:'二胡', rarity:'SSR', rarityName:'天籁', role:'夜雨之歌', description:'两弦一弓，拉出万家灯火与人间悲喜，是情绪表达极强的传统弓弦乐器。', image:'assets/cards/zhi_erhu.png', toneName:'徵音', element:'火' },
  { id:'zhi_yangqin', tone:'zhi', name:'徵调 · 扬琴', instrument:'扬琴', rarity:'SSR', rarityName:'天籁', role:'弦上流火', description:'扬琴以竹槌击弦发声，音色清亮、颗粒分明，既能铺陈华彩，也能托起明快流动的旋律。', image:'assets/cards/zhi_yangqin.png', toneName:'徵音', element:'火', model:'assets/models/zhi_yangqin.glb', modelFallbacks:['assets/models/yangqin.glb','assets/models/scene.glb'], modelAlt:'徵调扬琴三维模型', fullAudio:'assets/audio/zhi_yangqin.mp3', pieceAudio:'assets/audio/zhi_yangqin.mp3', audioSegmentSeconds:10 },
  { id:'yu_sheng', tone:'yu', name:'羽调 · 笙', instrument:'笙', rarity:'SSR', rarityName:'天籁', role:'凤翼笙神', description:'笙管如凤翼，气息在水月之间缓缓升起，音色轻灵、明亮而有层次。', image:'assets/cards/yu_sheng.png', toneName:'羽音', element:'水' }
];
const PIECE_COUNT = 9;
const DUPLICATE_PIECE_FRAGMENT_VALUES = { N: 1, R: 2, SR: 5, SSR: 8 };
const DUPLICATE_PIECE_FRAGMENT_VALUE = DUPLICATE_PIECE_FRAGMENT_VALUES.SSR;
const LOCK_ICONS = {
  SSR: 'assets/locks/lock-gold.png',
  SR: 'assets/locks/lock-silver.png',
  R: 'assets/locks/lock-jade.png',
  N: 'assets/locks/lock-jade.png'
};
const CARD_BACK = 'assets/ui/card-back.png';
const CARD_AUDIO = Object.fromEntries(
  CARDS.flatMap(card => Array.from({length: PIECE_COUNT}, (_, i) => [`${card.id}_p${i + 1}`, `assets/audio/${card.id}_p${i + 1}.mp3`]))
);
function pieceImage(cardId, pieceIndex){ return `assets/pieces/${cardId}/${cardId}_p${pieceIndex}.png`; }
