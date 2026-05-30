const TONES = {
  gong: { tone: '宫', mode: '宫音', element: '土', theme: '厚土礼乐', color: '#c78d45', dark: '#2a1b12', light: '#f2c46e', accent: '#8c4a2e' },
  shang: { tone: '商', mode: '商音', element: '金', theme: '金石清声', color: '#c9d2d8', dark: '#111a20', light: '#f0f4f5', accent: '#8a9d9e' },
  jiao: { tone: '角', mode: '角音', element: '木', theme: '春竹生风', color: '#7fb391', dark: '#10241b', light: '#cde6d6', accent: '#3c755e' },
  zhi: { tone: '徵', mode: '徵音', element: '火', theme: '丝弦流火', color: '#c9493d', dark: '#2a0d0d', light: '#ffb078', accent: '#8f1f1c' },
  yu: { tone: '羽', mode: '羽音', element: '水', theme: '水月空灵', color: '#6e9dd4', dark: '#071221', light: '#c7e3ff', accent: '#1d568a' }
};
const RARITIES = {
  N: { name: '初鸣', prob: 50, color: '#75847c', cost: 0 },
  R: { name: '清音', prob: 30, color: '#58a184', cost: 0 },
  SR: { name: '灵韵', prob: 15, color: '#9aaee8', cost: 0 },
  SSR: { name: '天籁', prob: 5, color: '#e0b74f', cost: 0 }
};
const CARDS = [
  { id:'gong_muyu', tone:'gong', name:'宫调 · 木鱼', instrument:'木鱼', rarity:'SSR', rarityName:'天籁', role:'静心梵响', description:'木鱼常见于佛教音乐与民间器乐，音色空而清，节奏稳定，带有静心意味。', image:'assets/cards/gong_muyu.png', mobileImage:'assets/cards/gong_muyu.png', toneName:'宫音', element:'土', model:'assets/models/gong_muyu.glb', modelFallbacks:['assets/models/muyu.glb','assets/models/scene.glb'], modelAlt:'宫调木鱼三维模型', fullAudio:'assets/audio/gong_muyu.mp3', pieceAudio:'assets/audio/gong_muyu.mp3', audioSegmentSeconds:10 },
  { id:'gong_xun', tone:'gong', name:'宫调 · 埙', instrument:'埙', rarity:'SR', rarityName:'灵韵', role:'古土沉声', description:'埙以陶土烧制，音色低回、苍茫而厚重，像大地深处缓缓醒来的古声。', image:'assets/cards/gong_xun.png', mobileImage:'assets/cards/gong_xun.png', toneName:'宫音', element:'土', fullAudio:'assets/audio/gong_xun.mp3', pieceAudio:'assets/audio/gong_xun.mp3', audioSegmentSeconds:10 },
  { id:'shang_bianqing', tone:'shang', name:'商调 · 编磬', instrument:'编磬', rarity:'SSR', rarityName:'天籁', role:'金石清声', description:'编磬由石或玉制磬片组成，音色清冷、明亮、余韵干净，如玉石相击。', image:'assets/cards/shang_bianqing.png', mobileImage:'assets/cards/shang_bianqing.png', toneName:'商音', element:'金', fullAudio:'assets/audio/shang_bianqing.mp3', pieceAudio:'assets/audio/shang_bianqing.mp3', audioSegmentSeconds:10 },
  { id:'shang_yunluo', tone:'shang', name:'商调 · 云锣', instrument:'云锣', rarity:'SR', rarityName:'灵韵', role:'云中金响', description:'云锣由多面小锣组合而成，音色明亮轻巧，层层敲响时如云间金声流转。', image:'assets/cards/shang_yunluo.png', mobileImage:'assets/cards/shang_yunluo.png', toneName:'商音', element:'金', fullAudio:'assets/audio/shang_yunluo.mp3', pieceAudio:'assets/audio/shang_yunluo.mp3', audioSegmentSeconds:10 },
  { id:'jiao_guanzi', tone:'jiao', name:'角调 · 管子', instrument:'管子', rarity:'SR', rarityName:'灵韵', role:'北地长风', description:'管子音色高亢而有穿透力，气息充足时带有苍劲、开阔的民间风味。', image:'assets/cards/jiao_guanzi.png', mobileImage:'assets/cards/jiao_guanzi.png', toneName:'角音', element:'木', fullAudio:'assets/audio/jiao_guanzi.m4a', pieceAudio:'assets/audio/jiao_guanzi.m4a', audioSegmentSeconds:10 },
  { id:'jiao_paixiao', tone:'jiao', name:'角调 · 排箫', instrument:'排箫', rarity:'SSR', rarityName:'天籁', role:'春竹生风', description:'排箫由多管组成，音色空灵柔和，像竹林与山风一起流动。', image:'assets/cards/jiao_paixiao.png', mobileImage:'assets/cards/jiao_paixiao.png', toneName:'角音', element:'木', fullAudio:'assets/audio/jiao_paixiao.m4a', pieceAudio:'assets/audio/jiao_paixiao.m4a', audioSegmentSeconds:10 },
  { id:'jiao_qudi', tone:'jiao', name:'角调 · 曲笛', instrument:'曲笛', rarity:'R', rarityName:'清音', role:'江南清韵', description:'曲笛音色圆润婉转，常用于江南丝竹，旋律轻巧流丽，带有水乡气息。', image:'assets/cards/jiao_qudi.png', mobileImage:'assets/cards/jiao_qudi.png', toneName:'角音', element:'木', fullAudio:'assets/audio/jiao_qudi.mp3', pieceAudio:'assets/audio/jiao_qudi.mp3', audioSegmentSeconds:10 },
  { id:'jiao_xiao', tone:'jiao', name:'角调 · 箫', instrument:'箫', rarity:'R', rarityName:'清音', role:'孤竹月影', description:'箫声幽远含蓄，长音如月下清风，适合表现静夜、山水与悠长思绪。', image:'assets/cards/jiao_xiao.png', mobileImage:'assets/cards/jiao_xiao.png', toneName:'角音', element:'木', fullAudio:'assets/audio/jiao_xiao.mp3', pieceAudio:'assets/audio/jiao_xiao.mp3', audioSegmentSeconds:10 },
  { id:'zhi_erhu', tone:'zhi', name:'徵调 · 二胡', instrument:'二胡', rarity:'SSR', rarityName:'天籁', role:'夜雨之歌', description:'两弦一弓，拉出万家灯火与人间悲喜，是情绪表达极强的传统弓弦乐器。', image:'assets/cards/zhi_erhu.png', mobileImage:'assets/cards/zhi_erhu.png', toneName:'徵音', element:'火', fullAudio:'assets/audio/zhi_erhu.mp3', pieceAudio:'assets/audio/zhi_erhu.mp3', audioSegmentSeconds:10 },
  { id:'zhi_gaohu', tone:'zhi', name:'徵调 · 高胡', instrument:'高胡', rarity:'R', rarityName:'清音', role:'岭南流霞', description:'高胡音色清亮柔美，旋律华丽灵动，常带有岭南音乐明快细腻的色彩。', image:'assets/cards/zhi_gaohu.png', mobileImage:'assets/cards/zhi_gaohu.png', toneName:'徵音', element:'火', fullAudio:'assets/audio/zhi_gaohu.mp3', pieceAudio:'assets/audio/zhi_gaohu.mp3', audioSegmentSeconds:10 },
  { id:'zhi_guqin', tone:'zhi', name:'徵调 · 古琴', instrument:'古琴', rarity:'R', rarityName:'清音', role:'松风入弦', description:'古琴音色沉静、古雅而留白，泛音、按音与散音交织出山林般的悠远气息。', image:'assets/cards/zhi_guqin.png', mobileImage:'assets/cards/zhi_guqin.png', toneName:'徵音', element:'火', fullAudio:'assets/audio/zhi_guqin.m4a', pieceAudio:'assets/audio/zhi_guqin.m4a', audioSegmentSeconds:10 },
  { id:'zhi_guzheng', tone:'zhi', name:'徵调 · 古筝', instrument:'古筝', rarity:'N', rarityName:'初鸣', role:'弦河流火', description:'古筝音域宽广，颗粒清晰，既能铺陈流水般的华彩，也能奏出强烈的情绪起伏。', image:'assets/cards/zhi_guzheng.png', mobileImage:'assets/cards/zhi_guzheng.png', toneName:'徵音', element:'火', fullAudio:'assets/audio/zhi_guzheng.mp3', pieceAudio:'assets/audio/zhi_guzheng.mp3', audioSegmentSeconds:10 },
  { id:'zhi_jinghu', tone:'zhi', name:'徵调 · 京胡', instrument:'京胡', rarity:'N', rarityName:'初鸣', role:'梨园烈响', description:'京胡音色高亮尖细，穿透力极强，是戏曲音乐中最具辨识度的弓弦声之一。', image:'assets/cards/zhi_jinghu.png', mobileImage:'assets/cards/zhi_jinghu.png', toneName:'徵音', element:'火', fullAudio:'assets/audio/zhi_jinghu.mp3', pieceAudio:'assets/audio/zhi_jinghu.mp3', audioSegmentSeconds:10 },
  { id:'zhi_matouqin', tone:'zhi', name:'徵调 · 马头琴', instrument:'马头琴', rarity:'N', rarityName:'初鸣', role:'草原长歌', description:'马头琴音色浑厚悠长，常让人联想到辽阔草原、远方风声与低回长歌。', image:'assets/cards/zhi_matouqin.png', mobileImage:'assets/cards/zhi_matouqin.png', toneName:'徵音', element:'火', fullAudio:'assets/audio/zhi_matouqin.mp3', pieceAudio:'assets/audio/zhi_matouqin.mp3', audioSegmentSeconds:10 },
  { id:'zhi_pipa', tone:'zhi', name:'徵调 · 琵琶', instrument:'琵琶', rarity:'N', rarityName:'初鸣', role:'银甲急雨', description:'琵琶弹拨清脆多变，轮指、扫弦与挑弹之间既有珠落玉盘，也有战阵急雨。', image:'assets/cards/zhi_pipa.png', mobileImage:'assets/cards/zhi_pipa.png', toneName:'徵音', element:'火', model:'assets/models/zhi_pipa.glb', modelFallbacks:['assets/models/pipa.glb','assets/models/scene.glb'], modelAlt:'徵调琵琶三维模型', fullAudio:'assets/audio/zhi_pipa.m4a', pieceAudio:'assets/audio/zhi_pipa.m4a', audioSegmentSeconds:10 },
  { id:'zhi_yangqin', tone:'zhi', name:'徵调 · 扬琴', instrument:'扬琴', rarity:'SR', rarityName:'灵韵', role:'弦上流火', description:'扬琴以竹槌击弦发声，音色清亮、颗粒分明，既能铺陈华彩，也能托起明快流动的旋律。', image:'assets/cards/zhi_yangqin.png', mobileImage:'assets/cards/zhi_yangqin.png', toneName:'徵音', element:'火', model:'assets/models/zhi_yangqin.glb', modelFallbacks:['assets/models/yangqin.glb','assets/models/scene.glb'], modelAlt:'徵调扬琴三维模型', fullAudio:'assets/audio/zhi_yangqin.mp3', pieceAudio:'assets/audio/zhi_yangqin.mp3', audioSegmentSeconds:10 },
  { id:'zhi_zhongruan', tone:'zhi', name:'徵调 · 中阮', instrument:'中阮', rarity:'N', rarityName:'初鸣', role:'温弦归梦', description:'中阮音色温润圆厚，节奏与和声表现稳定，常在乐队中托起柔和而坚实的声部。', image:'assets/cards/zhi_zhongruan.png', mobileImage:'assets/cards/zhi_zhongruan.png', toneName:'徵音', element:'火', fullAudio:'assets/audio/zhi_zhongruan.mp3', pieceAudio:'assets/audio/zhi_zhongruan.mp3', audioSegmentSeconds:10 },
  { id:'yu_hulusi', tone:'yu', name:'羽调 · 葫芦丝', instrument:'葫芦丝', rarity:'SR', rarityName:'灵韵', role:'水乡柔梦', description:'葫芦丝音色柔和甜润，带有浓郁民族色彩，如水边微风与温柔歌声。', image:'assets/cards/yu_hulusi.png', mobileImage:'assets/cards/yu_hulusi.png', toneName:'羽音', element:'水', fullAudio:'assets/audio/yu_hulusi.mp3', pieceAudio:'assets/audio/yu_hulusi.mp3', audioSegmentSeconds:10 },
  { id:'yu_sheng', tone:'yu', name:'羽调 · 笙', instrument:'笙', rarity:'SSR', rarityName:'天籁', role:'凤翼笙神', description:'笙管如凤翼，气息在水月之间缓缓升起，音色轻灵、明亮而有层次。', image:'assets/cards/yu_sheng.png', mobileImage:'assets/cards/yu_sheng.png', toneName:'羽音', element:'水', fullAudio:'assets/audio/yu_sheng.mp3', pieceAudio:'assets/audio/yu_sheng.mp3', audioSegmentSeconds:10 },
  { id:'yu_suona', tone:'yu', name:'羽调 · 唢呐', instrument:'唢呐', rarity:'R', rarityName:'清音', role:'长天破晓', description:'唢呐音色高亢嘹亮，极具穿透力，既能热烈欢腾，也能唱出苍凉与激越。', image:'assets/cards/yu_suona.png', mobileImage:'assets/cards/yu_suona.png', toneName:'羽音', element:'水', fullAudio:'assets/audio/yu_suona.mp3', pieceAudio:'assets/audio/yu_suona.mp3', audioSegmentSeconds:10 },
];
const PIECE_COUNT = 9;
const DUPLICATE_PIECE_FRAGMENT_VALUES = { N: 1, R: 2, SR: 5, SSR: 8 };
const DUPLICATE_PIECE_FRAGMENT_VALUE = DUPLICATE_PIECE_FRAGMENT_VALUES.SSR;
const SR_PITY_COUNT = 10;
const SSR_PITY_COUNT = 100;
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
