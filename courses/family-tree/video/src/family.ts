export type Hair =
  | 'grandpa' | 'grandma' | 'short' | 'side' | 'long' | 'bob'
  | 'ponytail' | 'pigtails' | 'braid' | 'boy';

export type Look = {
  hair: Hair;
  hairColor: string;
  shirt: string;
  inner?: string; // cardigan / jacket opening
  pants: string;
  H: number; // standing height in px, feet to top of head
  kid?: boolean;
  glasses?: boolean;
  dress?: boolean;
  overalls?: string;
  buttons?: boolean;
  /** 伯伯's moustache — tells the three brothers apart in identical jerseys */
  mustache?: boolean;
  /** 叔叔's backwards baseball cap */
  cap?: string;
};

export type Person = {
  name: string;
  py: string; // pinyin printed above the name
  sub: string;
  look: Look;
};

const kid = (l: Omit<Look, 'kid'>): Look => ({...l, kid: true});

// Costume colours follow the reference picture《我的家庭图谱》.
export const PEOPLE: Record<string, Person> = {
  yeye: {name: '爷爷', py: 'yé ye', sub: '爸爸的爸爸',
    look: {hair: 'grandpa', hairColor: '#DAD6CF', shirt: '#5B7FB0', inner: '#ECE7DD', pants: '#5E5A55', H: 300, glasses: true}},
  nainai: {name: '奶奶', py: 'nǎi nai', sub: '爸爸的妈妈',
    look: {hair: 'grandma', hairColor: '#CFCAC4', shirt: '#E28B80', inner: '#F6EFE6', pants: '#6A5A55', H: 292}},
  bobo: {name: '伯伯', py: 'bó bo', sub: '爸爸的哥哥',
    look: {hair: 'side', hairColor: '#3B2A22', shirt: '#8B5A3C', inner: '#E9DFD2', pants: '#4D4440', H: 316, mustache: true}},
  baba: {name: '爸爸', py: 'bà ba', sub: '我的爸爸',
    look: {hair: 'short', hairColor: '#2E2420', shirt: '#5E8A5A', pants: '#4A4A50', H: 300}},
  shushu: {name: '叔叔', py: 'shū shu', sub: '爸爸的弟弟',
    look: {hair: 'boy', hairColor: '#3A2B22', shirt: '#6189B8', inner: '#7FA3CC', pants: '#4A4A50', H: 298, cap: '#3C6FB0'}},
  gugu: {name: '姑姑', py: 'gū gu', sub: '爸爸的姐妹',
    look: {hair: 'bob', hairColor: '#4A3426', shirt: '#B59AC8', inner: '#F4EFF6', pants: '#5B5266', H: 284}},
  // 豆豆 = "我". Red, so he never looks like he's wearing the orange 堂 jersey.
  me: {name: '我', py: 'wǒ', sub: '豆豆',
    look: kid({hair: 'boy', hairColor: '#2B211C', shirt: '#D64541', pants: '#4E5D7A', H: 205})},
  tangge: {name: '堂哥', py: 'táng gē', sub: '比我大',
    look: kid({hair: 'boy', hairColor: '#2B211C', shirt: '#EE8A2E', pants: '#4E5D7A', H: 240})},
  biaomei: {name: '表妹', py: 'biǎo mèi', sub: '比我小',
    look: kid({hair: 'pigtails', hairColor: '#4A3020', shirt: '#3FA3A6', pants: '#3FA3A6', H: 170, dress: true})},
  tangjie: {name: '堂姐', py: 'táng jiě', sub: '比我大',
    look: kid({hair: 'long', hairColor: '#3E2A1E', shirt: '#D36E70', pants: '#D36E70', H: 238, dress: true})},
  waigong: {name: '外公', py: 'wài gōng', sub: '妈妈的爸爸',
    look: {hair: 'grandpa', hairColor: '#D8D4CE', shirt: '#6F8F5E', pants: '#55524C', H: 296, buttons: true}},
  waipo: {name: '外婆', py: 'wài pó', sub: '妈妈的妈妈',
    look: {hair: 'grandma', hairColor: '#C9C6C2', shirt: '#9DBFE0', inner: '#F4F1EA', pants: '#5D6573', H: 288}},
  mama: {name: '妈妈', py: 'mā ma', sub: '我的妈妈',
    look: {hair: 'long', hairColor: '#6B4430', shirt: '#EDE0CC', pants: '#7A6A5E', H: 288}},
  jiujiu: {name: '舅舅', py: 'jiù jiu', sub: '妈妈的兄弟',
    look: {hair: 'short', hairColor: '#2F2622', shirt: '#B4ADA3', pants: '#4A4A50', H: 302}},
  yima: {name: '姨妈', py: 'yí mā', sub: '妈妈的姐妹',
    look: {hair: 'braid', hairColor: '#3A2A22', shirt: '#DE7E66', inner: '#F0A890', pants: '#5B4C48', H: 284}},
  biaojie: {name: '表姐', py: 'biǎo jiě', sub: '比我大',
    look: kid({hair: 'ponytail', hairColor: '#4A3020', shirt: '#3FA3A6', pants: '#6E6A8A', H: 236})},
  jiudi: {name: '表弟', py: 'biǎo dì', sub: '比我小',
    look: kid({hair: 'boy', hairColor: '#33251C', shirt: '#78A86A', pants: '#6B6255', H: 176})},
  biaodi: {name: '表弟', py: 'biǎo dì', sub: '比我小',
    look: kid({hair: 'boy', hairColor: '#3A2A20', shirt: '#F5F1EA', pants: '#3FA3A6', H: 178, overalls: '#3FA3A6'})},
};

export const prefixTone = (name: string) =>
  name.startsWith('堂') ? 'tang' : name.startsWith('表') ? 'biao' : 'ink';
