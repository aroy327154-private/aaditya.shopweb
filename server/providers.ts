import { validateExternalApiUrl } from './security.ts';

export interface ProviderCountryItem {
  code: string;
  iso?: string;
  name: string;
  flag: string;
  price: number;
  stock: number;
  retry?: boolean;
  source: 'api' | 'manual';
}

export interface ProviderTgAccount {
  id: string;
  source: 'api' | 'manual';
  title: string;
  countryCode: string;
  countryIso?: string;
  countryName: string;
  flag: string;
  price: number;
  origin: string;
  resaleOrigin?: string;
  spamStatus: 'Spam Free' | 'Temporary Spam' | 'Geo Spamblock' | 'Spam Blocked' | 'Not Checked';
  spamBlocked: boolean;
  isPremium: boolean;
  premiumEndsAt?: string | null;
  twofa: string;
  dcId?: string;
  emailLinked?: boolean;
  channelsCount?: number;
  chatsCount?: number;
  conversationsCount?: number;
  contactsCount?: number;
  adminCount?: number;
  adminSubsCount?: number;
  starsCount?: number;
  giftsCount?: number;
  nftGiftsCount?: number;
  lastSeenAt?: string | null;
  sessionCreatedAt?: string | null;
  uploadedAt?: string | null;
  dialCode?: string;
  year?: string;
  categoryLabel?: string;
}

export interface ProviderAppItem {
  code: string;
  name: string;
  stock: number;
  minPrice: number | null;
}

// ============================================================
// GLOBAL COUNTRY NAME, ISO-2 & FLAG RESOLUTION
// ============================================================
const ISO_TO_NAME: Record<string, string> = {};
const NAME_TO_ISO: Record<string, string> = {};

const regionDisplayNames =
  typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

for (let i = 65; i <= 90; i++) {
  for (let j = 65; j <= 90; j++) {
    const code = String.fromCharCode(i, j);
    if (!regionDisplayNames) continue;
    try {
      const label = regionDisplayNames.of(code);
      if (
        label &&
        label !== code &&
        !/unknown region/i.test(label) &&
        !/^[A-Z]{2}$/.test(label)
      ) {
        ISO_TO_NAME[code] = label;
        NAME_TO_ISO[label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()] = code;
      }
    } catch {
      // Ignore invalid region code
    }
  }
}

const COUNTRY_NAME_ALIASES: Record<string, string> = {
  usa: 'US',
  'united states': 'US',
  'united states of america': 'US',
  'united states virtual': 'US',
  'us virtual': 'US',
  uk: 'GB',
  england: 'GB',
  britain: 'GB',
  'great britain': 'GB',
  'united kingdom': 'GB',
  russia: 'RU',
  'russian federation': 'RU',
  uae: 'AE',
  'united arab emirates': 'AE',
  'viet nam': 'VN',
  vietnam: 'VN',
  'south korea': 'KR',
  'korea south': 'KR',
  'republic of korea': 'KR',
  'north korea': 'KP',
  turkiye: 'TR',
  turkey: 'TR',
  'czech republic': 'CZ',
  czechia: 'CZ',
  'ivory coast': 'CI',
  'cote d ivoire': 'CI',
  iran: 'IR',
  laos: 'LA',
  syria: 'SY',
  bolivia: 'BO',
  venezuela: 'VE',
  tanzania: 'TZ',
  moldova: 'MD',
  taiwan: 'TW',
  palestine: 'PS',
  'hong kong': 'HK',
  macau: 'MO',
  macao: 'MO',
  'north macedonia': 'MK',
  macedonia: 'MK',
  'dr congo': 'CD',
  'congo dr': 'CD',
  'democratic republic of the congo': 'CD',
  'republic of the congo': 'CG',
  congo: 'CG',
  myanmar: 'MM',
  burma: 'MM',
  eswatini: 'SZ',
  swaziland: 'SZ',
  'cape verde': 'CV',
  'cabo verde': 'CV',
  'bosnia and herzegovina': 'BA',
  bosnia: 'BA',
  brunei: 'BN',
  'east timor': 'TL',
  'timor leste': 'TL',
  reunion: 'RE',
  kosovo: 'XK',
};

for (const [alias, iso] of Object.entries(COUNTRY_NAME_ALIASES)) {
  NAME_TO_ISO[alias] = iso;
}

const ISO3_TO_ISO2: Record<string, string> = {
  AFG: 'AF', ALB: 'AL', DZA: 'DZ', ASM: 'AS', AND: 'AD', AGO: 'AO', AIA: 'AI', ATG: 'AG',
  ARG: 'AR', ARM: 'AM', ABW: 'AW', AUS: 'AU', AUT: 'AT', AZE: 'AZ', BHS: 'BS', BHR: 'BH',
  BGD: 'BD', BRB: 'BB', BLR: 'BY', BEL: 'BE', BLZ: 'BZ', BEN: 'BJ', BMU: 'BM', BTN: 'BT',
  BOL: 'BO', BIH: 'BA', BWA: 'BW', BRA: 'BR', BRN: 'BN', BGR: 'BG', BFA: 'BF', BDI: 'BI',
  CPV: 'CV', KHM: 'KH', CMR: 'CM', CAN: 'CA', CYM: 'KY', CAF: 'CF', TCD: 'TD', CHL: 'CL',
  CHN: 'CN', COL: 'CO', COM: 'KM', COG: 'CG', COD: 'CD', CRI: 'CR', CIV: 'CI', HRV: 'HR',
  CUB: 'CU', CYP: 'CY', CZE: 'CZ', DNK: 'DK', DJI: 'DJ', DMA: 'DM', DOM: 'DO', ECU: 'EC',
  EGY: 'EG', SLV: 'SV', GNQ: 'GQ', ERI: 'ER', EST: 'EE', SWZ: 'SZ', ETH: 'ET', FJI: 'FJ',
  FIN: 'FI', FRA: 'FR', GUF: 'GF', GAB: 'GA', GMB: 'GM', GEO: 'GE', DEU: 'DE', GHA: 'GH',
  GIB: 'GI', GRC: 'GR', GRD: 'GD', GLP: 'GP', GTM: 'GT', GIN: 'GN', GNB: 'GW', GUY: 'GY',
  HTI: 'HT', HND: 'HN', HKG: 'HK', HUN: 'HU', ISL: 'IS', IND: 'IN', IDN: 'ID', IRN: 'IR',
  IRQ: 'IQ', IRL: 'IE', ISR: 'IL', ITA: 'IT', JAM: 'JM', JPN: 'JP', JOR: 'JO', KAZ: 'KZ',
  KEN: 'KE', PRK: 'KP', KOR: 'KR', KWT: 'KW', KGZ: 'KG', LAO: 'LA', LVA: 'LV', LBN: 'LB',
  LSO: 'LS', LBR: 'LR', LBY: 'LY', LIE: 'LI', LTU: 'LT', LUX: 'LU', MAC: 'MO', MKD: 'MK',
  MDG: 'MG', MWI: 'MW', MYS: 'MY', MDV: 'MV', MLI: 'ML', MLT: 'MT', MRT: 'MR', MUS: 'MU',
  MEX: 'MX', MDA: 'MD', MCO: 'MC', MNG: 'MN', MNE: 'ME', MAR: 'MA', MOZ: 'MZ', MMR: 'MM',
  NAM: 'NA', NPL: 'NP', NLD: 'NL', NCL: 'NC', NZL: 'NZ', NIC: 'NI', NER: 'NE', NGA: 'NG',
  NOR: 'NO', OMN: 'OM', PAK: 'PK', PSE: 'PS', PAN: 'PA', PNG: 'PG', PRY: 'PY', PER: 'PE',
  PHL: 'PH', POL: 'PL', PRT: 'PT', PRI: 'PR', QAT: 'QA', REU: 'RE', ROU: 'RO', RUS: 'RU',
  RWA: 'RW', KNA: 'KN', LCA: 'LC', VCT: 'VC', SAU: 'SA', SEN: 'SN', SRB: 'RS', SYC: 'SC',
  SLE: 'SL', SGP: 'SG', SVK: 'SK', SVN: 'SI', SOM: 'SO', ZAF: 'ZA', SSD: 'SS', ESP: 'ES',
  LKA: 'LK', SDN: 'SD', SUR: 'SR', SWE: 'SE', CHE: 'CH', SYR: 'SY', TWN: 'TW', TJK: 'TJ',
  TZA: 'TZ', THA: 'TH', TLS: 'TL', TGO: 'TG', TTO: 'TT', TUN: 'TN', TUR: 'TR', TKM: 'TM',
  UGA: 'UG', UKR: 'UA', ARE: 'AE', GBR: 'GB', USA: 'US', URY: 'UY', UZB: 'UZ', VEN: 'VE',
  VNM: 'VN', YEM: 'YE', ZMB: 'ZM', ZWE: 'ZW',
};

const ISO2_TO_ISO3: Record<string, string> = Object.fromEntries(
  Object.entries(ISO3_TO_ISO2).map(([iso3, iso2]) => [iso2, iso3]),
);

// Complete Tiger SMS / SMS-Activate numeric country IDs -> ISO-2
const TIGER_COUNTRY_ISO: Record<string, string> = {
  '0': 'RU',
  '1': 'UA',
  '2': 'KZ',
  '3': 'CN',
  '4': 'PH',
  '5': 'MM',
  '6': 'ID',
  '7': 'MY',
  '8': 'KE',
  '9': 'TZ',
  '10': 'VN',
  '11': 'KG',
  '12': 'US',
  '13': 'IL',
  '14': 'HK',
  '15': 'PL',
  '16': 'GB',
  '17': 'MG',
  '18': 'CD',
  '19': 'NG',
  '20': 'MO',
  '21': 'EG',
  '22': 'IN',
  '23': 'IE',
  '24': 'KH',
  '25': 'LA',
  '26': 'HT',
  '27': 'CI',
  '28': 'GM',
  '29': 'RS',
  '30': 'YE',
  '31': 'ZA',
  '32': 'RO',
  '33': 'CO',
  '34': 'EE',
  '35': 'AZ',
  '36': 'CA',
  '37': 'MA',
  '38': 'GH',
  '39': 'AR',
  '40': 'UZ',
  '41': 'CM',
  '42': 'TD',
  '43': 'DE',
  '44': 'LT',
  '45': 'HR',
  '46': 'SE',
  '47': 'IQ',
  '48': 'NL',
  '49': 'LV',
  '50': 'AT',
  '51': 'BY',
  '52': 'TH',
  '53': 'SA',
  '54': 'MX',
  '55': 'TW',
  '56': 'ES',
  '57': 'IR',
  '58': 'DZ',
  '59': 'SI',
  '60': 'BD',
  '61': 'SN',
  '62': 'TR',
  '63': 'CZ',
  '64': 'LK',
  '65': 'PE',
  '66': 'PK',
  '67': 'NZ',
  '68': 'GN',
  '69': 'ML',
  '70': 'VE',
  '71': 'ET',
  '72': 'MN',
  '73': 'BR',
  '74': 'AF',
  '75': 'UG',
  '76': 'AO',
  '77': 'CY',
  '78': 'FR',
  '79': 'PG',
  '80': 'MZ',
  '81': 'NP',
  '82': 'BE',
  '83': 'BG',
  '84': 'HU',
  '85': 'MD',
  '86': 'IT',
  '87': 'PY',
  '88': 'HN',
  '89': 'TN',
  '90': 'NI',
  '91': 'TL',
  '92': 'BO',
  '93': 'CR',
  '94': 'GT',
  '95': 'AE',
  '96': 'ZW',
  '97': 'PR',
  '98': 'SD',
  '99': 'TG',
  '100': 'KW',
  '101': 'SV',
  '102': 'LY',
  '103': 'JM',
  '104': 'TT',
  '105': 'EC',
  '106': 'SZ',
  '107': 'OM',
  '108': 'BA',
  '109': 'DO',
  '110': 'SY',
  '111': 'QA',
  '112': 'PA',
  '113': 'CU',
  '114': 'MR',
  '115': 'SL',
  '116': 'JO',
  '117': 'PT',
  '118': 'BB',
  '119': 'BI',
  '120': 'BJ',
  '121': 'BN',
  '122': 'BS',
  '123': 'BW',
  '124': 'BZ',
  '125': 'CF',
  '126': 'DM',
  '127': 'GD',
  '128': 'GE',
  '129': 'GR',
  '130': 'GW',
  '131': 'GY',
  '132': 'KM',
  '133': 'KN',
  '134': 'LR',
  '135': 'LS',
  '136': 'MW',
  '137': 'NA',
  '138': 'NE',
  '139': 'RW',
  '140': 'SK',
  '141': 'SR',
  '142': 'TJ',
  '143': 'MC',
  '144': 'BH',
  '145': 'RE',
  '146': 'ZM',
  '147': 'AM',
  '148': 'SO',
  '149': 'CG',
  '150': 'CL',
  '151': 'BF',
  '152': 'LB',
  '153': 'GA',
  '154': 'AL',
  '155': 'UY',
  '156': 'MU',
  '157': 'BT',
  '158': 'MV',
  '159': 'GP',
  '160': 'TM',
  '161': 'GF',
  '162': 'FI',
  '163': 'LC',
  '164': 'LU',
  '165': 'VC',
  '166': 'GQ',
  '167': 'DJ',
  '168': 'AG',
  '169': 'KY',
  '170': 'ME',
  '171': 'DK',
  '172': 'CH',
  '173': 'NO',
  '174': 'AU',
  '175': 'ER',
  '176': 'SS',
  '177': 'ST',
  '178': 'AW',
  '179': 'MS',
  '180': 'AI',
  '181': 'JP',
  '182': 'MK',
  '183': 'SC',
  '184': 'NC',
  '185': 'CV',
  '186': 'BM',
  '187': 'US',
  '188': 'PS',
  '189': 'FJ',
  '190': 'KR',
  '191': 'KP',
  '196': 'SG',
  '199': 'MT',
  '201': 'GI',
  '203': 'XK',
  '204': 'NU',
};

const DIAL_PREFIX_TO_ISO: Array<[string, string]> = [
  ['880', 'BD'],
  ['855', 'KH'],
  ['856', 'LA'],
  ['998', 'UZ'],
  ['996', 'KG'],
  ['992', 'TJ'],
  ['994', 'AZ'],
  ['995', 'GE'],
  ['993', 'TM'],
  ['977', 'NP'],
  ['971', 'AE'],
  ['966', 'SA'],
  ['964', 'IQ'],
  ['962', 'JO'],
  ['961', 'LB'],
  ['974', 'QA'],
  ['968', 'OM'],
  ['965', 'KW'],
  ['973', 'BH'],
  ['972', 'IL'],
  ['852', 'HK'],
  ['853', 'MO'],
  ['886', 'TW'],
  ['380', 'UA'],
  ['375', 'BY'],
  ['373', 'MD'],
  ['374', 'AM'],
  ['371', 'LV'],
  ['370', 'LT'],
  ['372', 'EE'],
  ['351', 'PT'],
  ['353', 'IE'],
  ['358', 'FI'],
  ['254', 'KE'],
  ['255', 'TZ'],
  ['256', 'UG'],
  ['251', 'ET'],
  ['234', 'NG'],
  ['233', 'GH'],
  ['237', 'CM'],
  ['212', 'MA'],
  ['213', 'DZ'],
  ['216', 'TN'],
  ['221', 'SN'],
  ['225', 'CI'],
  ['260', 'ZM'],
  ['263', 'ZW'],
  ['91', 'IN'],
  ['92', 'PK'],
  ['93', 'AF'],
  ['94', 'LK'],
  ['95', 'MM'],
  ['90', 'TR'],
  ['86', 'CN'],
  ['84', 'VN'],
  ['82', 'KR'],
  ['81', 'JP'],
  ['66', 'TH'],
  ['65', 'SG'],
  ['64', 'NZ'],
  ['63', 'PH'],
  ['62', 'ID'],
  ['61', 'AU'],
  ['60', 'MY'],
  ['58', 'VE'],
  ['57', 'CO'],
  ['56', 'CL'],
  ['55', 'BR'],
  ['54', 'AR'],
  ['52', 'MX'],
  ['51', 'PE'],
  ['49', 'DE'],
  ['48', 'PL'],
  ['47', 'NO'],
  ['46', 'SE'],
  ['45', 'DK'],
  ['44', 'GB'],
  ['43', 'AT'],
  ['41', 'CH'],
  ['40', 'RO'],
  ['39', 'IT'],
  ['34', 'ES'],
  ['33', 'FR'],
  ['32', 'BE'],
  ['31', 'NL'],
  ['30', 'GR'],
  ['27', 'ZA'],
  ['20', 'EG'],
  ['1', 'US'],
  ['7', 'RU'],
];

export function isoToEmojiFlag(iso?: string): string {
  const clean = String(iso || '')
    .trim()
    .toUpperCase();
  if (!/^[A-Z]{2}$/.test(clean)) return '🌐';
  const base = 0x1f1e6;
  return String.fromCodePoint(
    base + clean.charCodeAt(0) - 65,
    base + clean.charCodeAt(1) - 65,
  );
}

function normalizeCountryKey(val: string): string {
  return val
    .toLowerCase()
    .replace(/[()[\],.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveCountryMeta(input: {
  code?: string;
  name?: string;
  phone?: string;
}): { code: string; iso: string; name: string; flag: string } {
  const rawCode = String(input.code || '').trim();
  const rawName = String(input.name || '').trim();
  const rawPhone = String(input.phone || '').replace(/[^\d]/g, '');

  let iso = '';

  // 1. Numeric Tiger SMS ID
  if (rawCode && TIGER_COUNTRY_ISO[rawCode]) {
    iso = TIGER_COUNTRY_ISO[rawCode];
  }

  // 2. Direct ISO-2 or ISO-3 code
  if (!iso && rawCode) {
    const upper = rawCode.toUpperCase();
    if (upper === 'UK') iso = 'GB';
    else if (ISO_TO_NAME[upper]) iso = upper;
    else if (ISO3_TO_ISO2[upper]) iso = ISO3_TO_ISO2[upper];
  }

  // 3. Name lookup (or code that is actually a country name)
  if (!iso && rawName) {
    const norm = normalizeCountryKey(rawName);
    iso = NAME_TO_ISO[norm] || '';
    if (!iso) {
      for (const [alias, candidateIso] of Object.entries(NAME_TO_ISO)) {
        if (norm === alias || (alias.length >= 4 && norm.includes(alias))) {
          iso = candidateIso;
          break;
        }
      }
    }
  }

  if (!iso && rawCode) {
    const normCode = normalizeCountryKey(rawCode);
    iso = NAME_TO_ISO[normCode] || '';
  }

  // 4. Phone dial prefix detection
  if (!iso && rawPhone) {
    for (const [prefix, candidateIso] of DIAL_PREFIX_TO_ISO) {
      if (rawPhone.startsWith(prefix)) {
        iso = candidateIso;
        break;
      }
    }
  }

  // Special case for Tiger SMS 12 (United States Virtual)
  let resolvedName = '';
  if (rawCode === '12' && (!rawName || /virtual|usa/i.test(rawName))) {
    resolvedName = 'United States (Virtual)';
  } else if (rawName && !/^[A-Z]{2,3}$/.test(rawName) && !/^Country\s*#?\d+$/i.test(rawName)) {
    resolvedName = rawName;
  } else if (iso && ISO_TO_NAME[iso]) {
    resolvedName = ISO_TO_NAME[iso];
  } else if (rawCode && rawCode !== 'INTL') {
    resolvedName = rawCode;
  } else {
    resolvedName = 'International';
  }

  const finalCode = iso || rawCode || 'INTL';
  return {
    code: finalCode,
    iso,
    name: resolvedName,
    flag: isoToEmojiFlag(iso),
  };
}

const POPULAR_COUNTRY_ISOS = [
  'IN', 'US', 'GB', 'ID', 'RU', 'UA', 'BR', 'PH', 'VN', 'TR', 'NG', 'PK', 'BD', 'EG',
  'ZA', 'KE', 'MX', 'CO', 'AR', 'TH', 'MY', 'DE', 'FR', 'ES', 'IT', 'PL', 'CA', 'AU',
  'AE', 'SA', 'KZ', 'UZ', 'SG', 'JP', 'KR', 'NL', 'SE', 'CH', 'RO', 'CZ', 'PT', 'GR',
];

export function getAllWorldCountries(): Array<{ code: string; iso: string; name: string; flag: string }> {
  const list = Object.entries(ISO_TO_NAME).map(([iso, name]) => ({
    code: iso,
    iso,
    name,
    flag: isoToEmojiFlag(iso),
  }));
  return list.sort((a, b) => {
    const ai = POPULAR_COUNTRY_ISOS.indexOf(a.iso);
    const bi = POPULAR_COUNTRY_ISOS.indexOf(b.iso);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.name.localeCompare(b.name);
  });
}

// ============================================================
// KNOWN APP OTP NAMES
// ============================================================
const KNOWN_APP_NAMES: Record<string, string> = {
  tg: 'Telegram',
  wa: 'WhatsApp',
  ig: 'Instagram',
  fb: 'Facebook',
  go: 'Google / Gmail / YouTube',
  lf: 'TikTok / Douyin',
  tw: 'Twitter / X',
  ds: 'Discord',
  am: 'Amazon',
  nf: 'Netflix',
  sn: 'Snapchat',
  fu: 'Snapchat',
  ub: 'Uber',
  oi: 'Tinder',
  vi: 'Viber',
  wx: 'WeChat',
  wb: 'WeChat',
  vk: 'VKontakte',
  ok: 'OK.ru',
  ya: 'Yandex',
  mc: 'Microsoft / Outlook',
  mm: 'Microsoft',
  tn: 'LinkedIn',
  ts: 'PayPal',
  mb: 'Yahoo',
  pm: 'AOL',
  hw: 'Alipay / Alibaba',
  re: 'Coinbase',
  bo: 'Wise',
  dh: 'eBay',
  ew: 'Nike',
  mt: 'Steam',
  bw: 'Signal',
  dp: 'ProtonMail',
  ai: 'OpenAI / ChatGPT',
  dr: 'OpenAI / ChatGPT',
  ka: 'Shopee',
  kt: 'KakaoTalk',
  nv: 'Naver',
  ni: 'Gojek',
  xk: 'DiDi',
  bl: 'BIGO LIVE',
  yl: 'Yalla',
  pf: 'POF.com',
  ma: 'Mail.ru',
  li: 'Baidu',
  gp: 'Ticketmaster',
  ot: 'Any Other App',
};

const POPULAR_APP_ORDER = [
  'tg',
  'wa',
  'ig',
  'go',
  'fb',
  'lf',
  'tw',
  'ds',
  'sn',
  'am',
  'nf',
  'ub',
  'ts',
  'mc',
  'mm',
  'oi',
  'vi',
  'vk',
  'bw',
  'ai',
  'dr',
  'ot',
];

function normalizeBaseUrl(raw: string): string {
  const check = validateExternalApiUrl(raw);
  if (!check.ok) throw new Error(check.error);
  return check.url.toString().replace(/\/+$/, '');
}

// ============================================================
// SERVER 1: LOLZTEAM MARKET API
// ============================================================
export async function testLolzteam(baseUrl: string, token: string): Promise<{ ok: boolean; detail: string }> {
  const cleanUrl = normalizeBaseUrl(baseUrl);
  const res = await fetch(`${cleanUrl}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(12000),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(String(data.error_description || data.error || `HTTP ${res.status}`));
  }
  const userObj = (data.user || data) as Record<string, unknown>;
  const bal = userObj.balance ?? userObj.market_balance ?? 'Connected';
  return { ok: true, detail: `Connected · Balance: ${bal}` };
}

function extractItemCountryMeta(item: Record<string, unknown>) {
  const rawCode = String(
    item.telegram_country || item.country || item.country_code || '',
  ).trim();
  const rawName = String(
    item.telegram_country_name || item.country_name || '',
  ).trim();
  const phone = String(item.telegram_phone || item.login || '').trim();
  return resolveCountryMeta({ code: rawCode, name: rawName, phone });
}

export interface TgAccountFilters {
  category?: 'all' | 'pushing' | 'premium' | 'autoreg' | null;
  spam?: 'any' | 'free' | 'blocked' | 'temp';
  origin?:
    | 'any'
    | 'pushing'
    | 'autoreg'
    | 'resale'
    | 'stealer'
    | 'brute'
    | 'personal'
    | 'self_registration'
    | 'mixed'
    | 'fresh';
  premium?: 'any' | 'premium' | 'non_premium';
  email?: 'any' | 'required';
  sort?: 'low' | 'high';
}

function getEffectiveOriginFilter(filters?: TgAccountFilters): TgAccountFilters['origin'] {
  if (filters?.origin && filters.origin !== 'any') return filters.origin;
  if (filters?.category === 'pushing') return 'pushing';
  if (filters?.category === 'autoreg') return 'autoreg';
  return 'any';
}

function buildLolzteamQueryParams(
  filters?: TgAccountFilters,
  extra?: Record<string, string>,
  countryCode?: string,
  useSpam = true,
): string {
  const params = new URLSearchParams();
  params.set('currency', 'usd');
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v) params.set(k, v);
    }
  }

  // Strict category & origin mapping:
  // Pushing Account -> origin[]=phishing ONLY
  // Autoreg Account -> origin[]=autoreg ONLY
  // All Accounts / Premium Account -> all origins unless user explicitly filters Origin
  const effectiveOrigin = getEffectiveOriginFilter(filters);
  if (effectiveOrigin === 'pushing') {
    params.append('origin[]', 'phishing');
  } else if (effectiveOrigin && effectiveOrigin !== 'any') {
    params.append('origin[]', effectiveOrigin);
  }

  if (useSpam) {
    if (filters?.spam === 'free') {
      params.set('spam', 'no');
    } else if (filters?.spam === 'blocked' || filters?.spam === 'temp') {
      params.set('spam', 'yes');
    }
  }

  if (filters?.category === 'premium' || filters?.premium === 'premium') {
    params.set('premium', 'yes');
  } else if (filters?.premium === 'non_premium') {
    params.set('premium', 'no');
  }

  if (filters?.email === 'required') {
    params.set('email', 'yes');
  }

  if (countryCode) {
    params.append('country[]', countryCode);
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

interface LolzteamSpamInfo {
  code: 0 | 1 | 2 | null;
  kind: 'free' | 'temp' | 'geo' | 'blocked' | null;
}

function classifyLolzteamSpamValue(val: unknown, depth = 0): LolzteamSpamInfo {
  if (val === undefined || val === null || val === '' || depth > 3) {
    return { code: null, kind: null };
  }
  if (typeof val === 'boolean') {
    return val ? { code: 1, kind: 'blocked' } : { code: 0, kind: 'free' };
  }
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return { code: null, kind: null };
    if (val === 0) return { code: 0, kind: 'free' };
    if (val === 2) return { code: 2, kind: 'temp' };
    if (val > 0 && val < 100) return { code: 1, kind: 'blocked' };
    return { code: null, kind: null };
  }
  if (Array.isArray(val)) {
    let best: LolzteamSpamInfo = { code: null, kind: null };
    for (const entry of val) {
      const parsed = classifyLolzteamSpamValue(entry, depth + 1);
      if (parsed.code === 1) return parsed;
      if (parsed.code === 2) best = parsed;
      else if (parsed.code === 0 && best.code === null) best = parsed;
    }
    return best;
  }
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    const priorityKeys = ['blocked', 'is_blocked', 'spam_block', 'spam', 'type', 'status', 'state', 'label', 'value'];
    let best: LolzteamSpamInfo = { code: null, kind: null };
    for (const k of priorityKeys) {
      if (k in obj) {
        const parsed = classifyLolzteamSpamValue(obj[k], depth + 1);
        if (parsed.code === 1) return parsed;
        if (parsed.code === 2) best = parsed;
        else if (parsed.code === 0 && best.code === null) best = parsed;
      }
    }
    for (const [k, v] of Object.entries(obj)) {
      if (!priorityKeys.includes(k)) {
        const parsed = classifyLolzteamSpamValue(v, depth + 1);
        if (parsed.code === 1) return parsed;
        if (parsed.code === 2) best = parsed;
        else if (parsed.code === 0 && best.code === null) best = parsed;
      }
    }
    return best;
  }

  const rawStr = String(val).trim();
  if (!rawStr) return { code: null, kind: null };
  const s = rawStr.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

  if (
    ['no', 'false', '0', 'n', 'off', 'disabled', 'none', 'null', 'n/a', 'free', 'spam free', 'no spam', 'not blocked', 'unblocked', 'clean', 'ok'].includes(s) ||
    /\b(spam\s*free|no\s*spam|not\s*blocked|unblocked|clean)\b/.test(s)
  ) {
    return { code: 0, kind: 'free' };
  }

  if (s === 'geo' || /\bgeo\b/.test(s) || s.includes('geo spam')) {
    return { code: 2, kind: 'geo' };
  }

  if (s === '2' || s === 'temp' || s.includes('temporary') || /\btemp\b/.test(s) || s.includes('soft')) {
    return { code: 2, kind: 'temp' };
  }

  if (
    ['1', 'yes', 'true', 'y', 'on', 'enabled', 'active', 'blocked', 'spam blocked', 'spam block', 'spam', 'permanent', 'perm', 'forever', 'hard'].includes(s) ||
    /\b(perm|permanent|forever|hard|blocked|spam\s*block)\b/.test(s)
  ) {
    return { code: 1, kind: 'blocked' };
  }

  if (/^\d+(\.\d+)?$/.test(s)) {
    const num = Number(s);
    if (num === 0) return { code: 0, kind: 'free' };
    if (num === 2) return { code: 2, kind: 'temp' };
    if (num > 0 && num < 100) return { code: 1, kind: 'blocked' };
  }

  return { code: null, kind: null };
}

function parseLolzteamUnixSec(val: unknown): number | null {
  if (val === undefined || val === null || val === false || val === '' || val === 0) return null;
  if (typeof val === 'number') {
    if (!Number.isFinite(val) || val <= 0) return null;
    return val > 1e11 ? Math.floor(val / 1000) : Math.floor(val);
  }
  const s = String(val).trim();
  if (/^\d{9,13}$/.test(s)) {
    const n = Number(s);
    return n > 1e11 ? Math.floor(n / 1000) : Math.floor(n);
  }
  const parsed = Date.parse(s);
  return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : null;
}

function analyzeLolzteamSpam(item: Record<string, unknown>): LolzteamSpamInfo {
  const primaryKeys = [
    'telegram_spam_block',
    'telegram_spam_blocked',
    'telegram_spam_type',
    'telegram_spam_status',
    'telegram_spam',
    'spam_block',
    'spam_type',
    'spam_status',
    'spam',
  ];

  let best: LolzteamSpamInfo = { code: null, kind: null };
  const consider = (info: LolzteamSpamInfo) => {
    if (info.code === null) return;
    if (info.code === 1) {
      best = info;
    } else if (info.code === 2) {
      if (best.code !== 1) best = info;
    } else if (info.code === 0 && best.code === null) {
      best = info;
    }
  };

  for (const k of primaryKeys) {
    if (item[k] !== undefined && item[k] !== null && item[k] !== '') {
      consider(classifyLolzteamSpamValue(item[k]));
      if (best.code === 1) return best;
    }
  }

  const nowSec = Math.floor(Date.now() / 1000);
  for (const [k, v] of Object.entries(item)) {
    if (v === undefined || v === null || v === '') continue;
    const kl = k.toLowerCase();
    if (!kl.includes('spam') || kl.includes('allow') || kl.includes('price') || kl.includes('count')) continue;
    if (kl.includes('expire') || kl.includes('until') || kl.includes('end') || kl.includes('date') || kl.includes('time')) {
      const expSec = parseLolzteamUnixSec(v);
      if (expSec !== null && expSec > nowSec + 60) {
        consider({ code: 2, kind: 'temp' });
      }
      continue;
    }
    if (!primaryKeys.includes(k)) {
      consider(classifyLolzteamSpamValue(v));
      if (best.code === 1) return best;
    }
  }

  return best;
}

function getLolzteamSpamCode(item: Record<string, unknown>): number | null {
  return analyzeLolzteamSpam(item).code;
}

function formatLolzteamDate(val: unknown): string | null {
  if (val === undefined || val === null || val === false || val === 0 || val === '') return null;
  if (typeof val === 'number' || (typeof val === 'string' && /^\d{9,13}$/.test(val.trim()))) {
    let sec = Number(val);
    if (!Number.isFinite(sec) || sec <= 0) return null;
    if (sec > 1e11) sec /= 1000;
    try {
      return new Date(sec * 1000).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  }
  const str = String(val).trim();
  const parsed = Date.parse(str);
  if (Number.isFinite(parsed)) {
    try {
      return new Date(parsed).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      // fall through
    }
  }
  return /^[\x20-\x7E]+$/.test(str) ? str.slice(0, 32) : null;
}

function extractLolzteamPremiumEnd(item: Record<string, unknown>): string | null {
  const keys = new Set([
    'telegram_premium_expiration',
    'telegram_premium_expiration_date',
    'telegram_premium_end',
    'telegram_premium_end_date',
    'telegram_premium_until',
    'telegram_premium_expires',
    'telegram_premium_expires_at',
    'premium_ends',
    'premium_end',
    'premium_expires',
    'premium_expiry',
    'premium_until',
    'premium_valid_till',
    'premium_expires_at',
    'premium_expiration',
    'premium_expiration_date',
    'premium_end_date',
  ]);
  const scan = (obj: Record<string, unknown>, depth = 0): string | null => {
    if (!obj || typeof obj !== 'object' || depth > 3) return null;
    for (const [k, v] of Object.entries(obj)) {
      if (keys.has(k.toLowerCase()) && v !== undefined && v !== null && v !== false && v !== 0 && v !== '') {
        if (typeof v === 'object' && !Array.isArray(v)) {
          const nested = scan(v as Record<string, unknown>, depth + 1);
          if (nested) return nested;
        } else {
          const formatted = formatLolzteamDate(v);
          if (formatted) return formatted;
        }
      }
    }
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v === 'object' && !Array.isArray(v) && (k.toLowerCase().includes('premium') || depth === 0)) {
        const nested = scan(v as Record<string, unknown>, depth + 1);
        if (nested) return nested;
      }
    }
    return null;
  };
  return scan(item);
}

function getLolzteamPremiumState(item: Record<string, unknown>): boolean | null {
  const expiresSec = parseLolzteamUnixSec(
    item.telegram_premium_expires ??
      item.telegram_premium_expiration ??
      item.telegram_premium_expiration_date ??
      item.telegram_premium_until ??
      item.premium_expires,
  );
  if (expiresSec !== null && expiresSec > Math.floor(Date.now() / 1000)) return true;

  const raw =
    item.telegram_premium ??
    item.telegram_is_premium ??
    item.premium ??
    item.telegram_premium_status;
  if (raw !== undefined && raw !== null && raw !== '') {
    if (typeof raw === 'boolean') return raw;
    if (typeof raw === 'number') return raw > 0;
    const s = String(raw).trim().toLowerCase();
    if (['yes', 'true', '1', 'active', 'premium', 'y'].includes(s)) return true;
    if (['no', 'false', '0', 'none', 'n'].includes(s)) return false;
  }
  if (extractLolzteamPremiumEnd(item)) return true;
  return null;
}

function getLolzteamPremiumFlag(item: Record<string, unknown>): boolean {
  return getLolzteamPremiumState(item) === true;
}

function isLolzteamAutoregItem(item: Record<string, unknown>): boolean {
  const origin = String(item.item_origin || item.origin || '').toLowerCase();
  const resale = String(item.resale_item_origin || item.resale_origin || '').toLowerCase();
  const title = String(item.title_en || item.title || '').toLowerCase();
  return origin.includes('autoreg') || resale.includes('autoreg') || title.includes('autoreg');
}

function getLolzteamEmailLinked(item: Record<string, unknown>): boolean | undefined {
  const raw = item.telegram_email ?? item.email_type ?? item.email;
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'number') return raw > 0;
  const s = String(raw).trim().toLowerCase();
  if (['0', 'no', 'false', 'none', 'null', 'n/a'].includes(s)) return false;
  return true;
}

function isLolzteamPushingItem(item: Record<string, unknown>): boolean {
  const origin = String(item.item_origin || item.origin || '').toLowerCase();
  const resale = String(item.resale_item_origin || item.resale_origin || '').toLowerCase();
  return (
    origin.includes('phishing') ||
    origin.includes('pushing') ||
    (!origin && (resale.includes('phishing') || resale.includes('pushing')))
  );
}

function itemMatchesLolzteamFilters(
  item: Record<string, unknown>,
  filters?: TgAccountFilters,
  strictSpamMatch = false,
): boolean {
  if (!filters) return true;

  const effectiveOrigin = getEffectiveOriginFilter(filters);
  if (effectiveOrigin === 'pushing') {
    const hasOriginField = Boolean(
      String(item.item_origin || item.origin || item.resale_item_origin || item.resale_origin || '').trim(),
    );
    if ((hasOriginField || strictSpamMatch) && !isLolzteamPushingItem(item)) return false;
  } else if (effectiveOrigin === 'autoreg') {
    const hasOriginField = Boolean(
      String(item.item_origin || item.origin || item.resale_item_origin || item.resale_origin || '').trim(),
    );
    if ((hasOriginField || strictSpamMatch) && !isLolzteamAutoregItem(item)) return false;
  } else if (effectiveOrigin && effectiveOrigin !== 'any') {
    const itemOrigin = String(item.item_origin || item.origin || '').toLowerCase();
    const resaleOrigin = String(item.resale_item_origin || item.resale_origin || '').toLowerCase();
    const blob = `${itemOrigin} ${resaleOrigin}`.trim();
    if (blob && !blob.includes(effectiveOrigin)) return false;
  }

  const wantPremiumOnly = filters.category === 'premium' || filters.premium === 'premium';
  if (wantPremiumOnly) {
    if (getLolzteamPremiumState(item) === false) return false;
  } else if (filters.premium === 'non_premium') {
    if (getLolzteamPremiumState(item) === true) return false;
  }

  if (filters.spam && filters.spam !== 'any') {
    const spamCode = getLolzteamSpamCode(item);
    if (filters.spam === 'free') {
      if (spamCode !== null && spamCode > 0) return false;
      if (strictSpamMatch && spamCode !== 0) return false;
    } else if (filters.spam === 'blocked') {
      if (spamCode === 0) return false;
      if (strictSpamMatch && (spamCode === null || spamCode <= 0)) return false;
    } else if (filters.spam === 'temp') {
      if (spamCode !== 2) return false;
    }
  }

  if (filters.email === 'required') {
    const emailLinked = getLolzteamEmailLinked(item);
    if (emailLinked === false) return false;
  }

  return true;
}

function formatOriginLabel(rawOrigin: unknown, resaleOrigin?: unknown): string {
  const mapOne = (val: string) => {
    const clean = val.trim();
    const v = clean.toLowerCase();
    if (v === 'phishing' || v === 'pushing') return 'Pushing';
    if (v === 'autoreg') return 'Autoreg';
    if (v === 'resale') return 'Resale';
    if (v === 'mixed') return 'Mixed';
    if (v === 'fresh') return 'Fresh';
    if (v === 'self_registration') return 'Self Registered';
    if (v === 'personal') return 'Personal';
    if (v === 'brute') return 'Brute';
    if (v === 'stealer') return 'Stealer';
    if (!clean || /[^\x20-\x7E]/.test(clean)) return 'Standard';
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };
  const main = mapOne(String(rawOrigin || ''));
  const sub = String(resaleOrigin || '').trim();
  if (String(rawOrigin || '').toLowerCase() === 'resale' && sub && sub.toLowerCase() !== 'resale') {
    const subLabel = mapOne(sub);
    return subLabel !== 'Standard' ? `Resale (${subLabel})` : 'Resale';
  }
  return main;
}

function computeInrPrice(item: Record<string, unknown>, marginPct: number, usdtRate: number): number {
  const rawPrice = Number(item.price || 0);
  const curr = String(item.price_currency || item.currency || '').toLowerCase();
  const priceUsd = curr === 'usd' ? rawPrice : curr === 'eur' ? rawPrice * 1.08 : rawPrice / 90;
  const inrBase = Math.max(10, priceUsd * (usdtRate || 92));
  return Math.ceil(inrBase * (1 + (marginPct || 0) / 100));
}

function mapLolzteamItemToAccount(
  item: Record<string, unknown>,
  marginPct: number,
  usdtRate: number,
  spamTrusted?: 'free' | 'blocked',
  premiumTrusted?: boolean,
  originTrusted?: string,
  fallbackCountryMeta?: { code: string; iso: string; name: string; flag: string },
): ProviderTgAccount {
  const extractedMeta = extractItemCountryMeta(item);
  const meta =
    !extractedMeta.iso && extractedMeta.code === 'INTL' && fallbackCountryMeta
      ? fallbackCountryMeta
      : extractedMeta;
  const spamInfo = analyzeLolzteamSpam(item);
  const premiumEndsAt = extractLolzteamPremiumEnd(item);
  const premState = getLolzteamPremiumState(item);
  const isPremium = premState === true || Boolean(premiumEndsAt) || (premState === null && Boolean(premiumTrusted));

  let spamStatus: ProviderTgAccount['spamStatus'] = 'Not Checked';
  let spamBlocked = false;
  if (spamInfo.code === 1) {
    spamStatus = 'Spam Blocked';
    spamBlocked = true;
  } else if (spamInfo.code === 2) {
    spamStatus = spamInfo.kind === 'geo' ? 'Geo Spamblock' : 'Temporary Spam';
    spamBlocked = true;
  } else if (spamInfo.code === 0) {
    spamStatus = 'Spam Free';
    spamBlocked = false;
  } else if (spamTrusted === 'free') {
    spamStatus = 'Spam Free';
    spamBlocked = false;
  } else if (spamTrusted === 'blocked') {
    spamStatus = 'Spam Blocked';
    spamBlocked = true;
  }

  const toNum = (v: unknown) => {
    if (v === undefined || v === null || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const rawOrigin = item.item_origin || item.origin;
  const resaleRaw = String(item.resale_item_origin || item.resale_origin || '').trim();
  const formattedOrigin = rawOrigin
    ? formatOriginLabel(rawOrigin, resaleRaw)
    : originTrusted
      ? formatOriginLabel(originTrusted)
      : formatOriginLabel('', resaleRaw);
  const passwordVal = item.telegram_password ?? item.telegram_has_password ?? item.two_fa;
  const hasTwoFa =
    passwordVal === true ||
    Number(passwordVal || 0) > 0 ||
    String(passwordVal || '').toLowerCase() === 'yes';

  return {
    id: String(item.item_id ?? item.account_id ?? item.id),
    source: 'api',
    title: 'Telegram Account',
    countryCode: meta.code,
    countryIso: meta.iso || undefined,
    countryName: meta.name,
    flag: meta.flag,
    price: computeInrPrice(item, marginPct, usdtRate),
    origin: formattedOrigin,
    resaleOrigin: resaleRaw ? formatOriginLabel(resaleRaw) : undefined,
    spamStatus,
    spamBlocked,
    isPremium,
    premiumEndsAt,
    twofa: hasTwoFa ? 'Enabled' : 'None',
    dcId: item.telegram_dc_id ? `DC ${String(item.telegram_dc_id).replace(/^DC\s*/i, '')}` : undefined,
    emailLinked: getLolzteamEmailLinked(item),
    channelsCount: toNum(item.telegram_channels_count),
    chatsCount: toNum(item.telegram_chats_count),
    conversationsCount: toNum(item.telegram_conversations_count),
    contactsCount: toNum(item.telegram_contacts_count),
    adminCount: toNum(item.telegram_admin_count),
    adminSubsCount: toNum(item.telegram_admin_subs_count),
    starsCount: toNum(item.telegram_stars_count),
    giftsCount: toNum(item.telegram_gifts_count),
    nftGiftsCount: toNum(item.telegram_gifts_nft_count),
    lastSeenAt: formatLolzteamDate(item.telegram_last_seen || item.last_seen),
    sessionCreatedAt: formatLolzteamDate(item.telegram_session_created_at),
    uploadedAt: formatLolzteamDate(item.published_date || item.uploaded),
  };
}

const sleepMs = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callLolzteamJson(
  cleanUrl: string,
  token: string,
  apiPath: string,
  opts?: {
    method?: 'GET' | 'POST';
    payload?: Record<string, unknown>;
    timeoutMs?: number;
    maxRetries?: number;
  },
): Promise<{ status: number; ok: boolean; data: Record<string, unknown>; errorText: string }> {
  const method = opts?.method || 'GET';
  const timeoutMs = opts?.timeoutMs ?? 25000;
  const maxRetries = opts?.maxRetries ?? 6;
  const normalizedPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  const reqUrlObj = new URL(`${cleanUrl}${normalizedPath}`);
  if (!reqUrlObj.searchParams.has('locale')) {
    reqUrlObj.searchParams.set('locale', 'en-US');
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'User-Agent': 'AadityaTgStoreBot/2.0 (LZT-Market)',
  };
  let bodyStr: string | undefined;
  if (method === 'POST') {
    headers['Content-Type'] = 'application/json';
    bodyStr = JSON.stringify(opts?.payload ?? {});
  }

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const res = await fetch(reqUrlObj.toString(), {
      method,
      headers,
      body: bodyStr,
      signal: AbortSignal.timeout(timeoutMs),
    });
    const rawText = await res.text().catch(() => '');
    let data: Record<string, unknown> = {};
    if (rawText.trim()) {
      try {
        const parsed = JSON.parse(rawText) as unknown;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          data = parsed as Record<string, unknown>;
        } else if (Array.isArray(parsed)) {
          data = { data: parsed };
        }
      } catch {
        data = {};
      }
    }

    const errorsList = Array.isArray(data.errors) ? data.errors.map((e) => String(e)) : [];
    const singleErr = typeof data.error === 'string' ? data.error : '';
    const errDesc = typeof data.error_description === 'string' ? data.error_description : '';
    const msgErr = typeof data.message === 'string' ? data.message : '';
    const combinedErr = [...errorsList, singleErr, errDesc, msgErr].filter(Boolean).join(', ');
    const lowerErr = combinedErr.toLowerCase();

    if (lowerErr.includes('retry_request') && attempt < maxRetries) {
      await sleepMs(1800);
      continue;
    }
    if (res.status === 429 && attempt < maxRetries) {
      await sleepMs(1800 + attempt * 500);
      continue;
    }
    if (res.status >= 500 && res.status <= 504 && attempt < 2) {
      await sleepMs(1500);
      continue;
    }

    const hasApiError =
      !res.ok ||
      errorsList.length > 0 ||
      Boolean(data.error);

    return {
      status: res.status,
      ok: !hasApiError,
      data,
      errorText: combinedErr || (res.ok ? '' : `HTTP ${res.status}`),
    };
  }

  return {
    status: 504,
    ok: false,
    data: {},
    errorText: 'Server is busy. Please try again in a minute.',
  };
}

interface LolzteamBatchResult {
  items: Array<Record<string, unknown>>;
  totalItems: number | null;
  page: number;
  perPage: number;
  hasNextPage: boolean;
  nextPmin?: number;
  nextPmax?: number;
}

export interface LolzteamAccountsPageResult {
  accounts: ProviderTgAccount[];
  totalItems: number | null;
  page: number;
  perPage: number;
  hasNextPage: boolean;
  nextPage: number | null;
  nextPmin?: number;
  nextPmax?: number;
}

const lztBatchInflight = new Map<string, Promise<LolzteamBatchResult>>();
const lztBatchCache = new Map<string, { ts: number; data: LolzteamBatchResult }>();
const LZT_BATCH_CACHE_TTL_MS = 15000;

const lztCountriesCache = new Map<string, { ts: number; countries: ProviderCountryItem[] }>();
const LZT_COUNTRIES_CACHE_TTL_MS = 60000;

function extractTotalItems(data: Record<string, unknown>): number | null {
  for (const key of ['totalItems', 'total_items', 'total', 'totalCount']) {
    const v = data[key];
    if (v !== undefined && v !== null && v !== '') {
      const n = Number(v);
      if (Number.isFinite(n) && n >= 0) return Math.floor(n);
    }
  }
  return null;
}

async function fetchLolzteamSingleBatch(
  cleanUrl: string,
  token: string,
  filters: TgAccountFilters | undefined,
  countryCode: string | undefined,
  useSpam: boolean,
  opts?: {
    page?: number;
    pmin?: number;
    pmax?: number;
    orderByOverride?: string;
  },
): Promise<LolzteamBatchResult> {
  const page = Math.max(1, Math.floor(Number(opts?.page) || 1));
  const orderBy =
    opts?.orderByOverride || (filters?.sort === 'high' ? 'price_to_down' : 'price_to_up');
  const extra: Record<string, string> = { order_by: orderBy };
  if (opts?.pmin && opts.pmin > 0) {
    extra.pmin = String(opts.pmin);
  } else if (opts?.pmax && opts.pmax > 0) {
    extra.pmax = String(opts.pmax);
  } else {
    extra.page = String(page);
  }

  const qs = buildLolzteamQueryParams(filters, extra, countryCode, useSpam);
  const cacheKey = `${cleanUrl}|${token.slice(-8)}|${qs}`;
  const cached = lztBatchCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < LZT_BATCH_CACHE_TTL_MS) {
    return cached.data;
  }

  const existing = lztBatchInflight.get(cacheKey);
  if (existing) return existing;

  const task = (async () => {
    const res = await callLolzteamJson(cleanUrl, token, `/telegram${qs}`, {
      method: 'GET',
      timeoutMs: 45000,
      maxRetries: 5,
    });
    const data = res.data as Record<string, unknown>;
    const rawItems = Array.isArray(data.items)
      ? (data.items as Array<Record<string, unknown>>)
      : Array.isArray(data.data)
        ? (data.data as Array<Record<string, unknown>>)
        : [];
    if (!res.ok && rawItems.length === 0) {
      throw new Error(res.errorText || `HTTP ${res.status}`);
    }

    const totalItems = extractTotalItems(data);
    const perPageRaw = Number(data.perPage ?? data.per_page ?? 0);
    const perPage = Number.isFinite(perPageRaw) && perPageRaw > 0 ? Math.floor(perPageRaw) : rawItems.length || 40;
    const explicitNext =
      typeof data.hasNextPage === 'boolean'
        ? data.hasNextPage
        : typeof data.has_next_page === 'boolean'
          ? data.has_next_page
          : null;
    const hasNextPage =
      explicitNext !== null
        ? explicitNext
        : totalItems !== null
          ? page * perPage < totalItems
          : rawItems.length >= 20;

    const prices = rawItems
      .map((it) => Number(it.price || 0))
      .filter((p) => Number.isFinite(p) && p > 0);
    const nextPmin = prices.length ? Math.max(...prices) : undefined;
    const nextPmax = prices.length ? Math.min(...prices) : undefined;

    const result: LolzteamBatchResult = {
      items: rawItems,
      totalItems,
      page,
      perPage,
      hasNextPage: rawItems.length > 0 && hasNextPage,
      nextPmin,
      nextPmax,
    };
    lztBatchCache.set(cacheKey, { ts: Date.now(), data: result });
    if (lztBatchCache.size > 200) {
      const oldestKey = lztBatchCache.keys().next().value;
      if (oldestKey) lztBatchCache.delete(oldestKey);
    }
    return result;
  })();

  lztBatchInflight.set(cacheKey, task);
  try {
    return await task;
  } finally {
    lztBatchInflight.delete(cacheKey);
  }
}

export async function fetchLolzteamAccountsPage(
  baseUrl: string,
  token: string,
  marginPct: number,
  usdtRate: number,
  opts?: {
    countryCode?: string;
    countryIsoHint?: string;
    filters?: TgAccountFilters;
    page?: number;
    pmin?: number;
    pmax?: number;
  },
): Promise<LolzteamAccountsPageResult> {
  const cleanUrl = normalizeBaseUrl(baseUrl);
  const filters = opts?.filters;
  const page = Math.max(1, Math.floor(Number(opts?.page) || 1));
  const rawCountry = String(opts?.countryCode || '').trim();
  const hasCountryFilter = Boolean(
    (rawCountry && rawCountry.toUpperCase() !== 'ALL') || (opts?.countryIsoHint && opts.countryIsoHint.trim()),
  );
  const targetMeta = hasCountryFilter
    ? resolveCountryMeta({ code: opts?.countryIsoHint || rawCountry, name: rawCountry })
    : undefined;
  const targetIso2 = targetMeta?.iso ? targetMeta.iso.toUpperCase() : '';
  const targetIso3 = targetIso2 ? ISO2_TO_ISO3[targetIso2] : undefined;
  const targetKey = targetMeta ? (targetMeta.iso || targetMeta.code || rawCountry).toUpperCase() : '';

  const spamActive = filters?.spam === 'free' || filters?.spam === 'blocked' || filters?.spam === 'temp';

  const loadWithCountryVariants = async (useSpam: boolean): Promise<LolzteamBatchResult> => {
    const batchOpts = { page, pmin: opts?.pmin, pmax: opts?.pmax };
    if (!hasCountryFilter) {
      return fetchLolzteamSingleBatch(cleanUrl, token, filters, undefined, useSpam, batchOpts);
    }
    const primaryCode = targetIso2 || targetIso3 || rawCountry;
    let res = await fetchLolzteamSingleBatch(cleanUrl, token, filters, primaryCode, useSpam, batchOpts);
    if (res.items.length === 0 && page === 1 && targetIso2) {
      const lowerIso2 = targetIso2.toLowerCase();
      if (lowerIso2 !== primaryCode) {
        const lowerRes = await fetchLolzteamSingleBatch(cleanUrl, token, filters, lowerIso2, useSpam, batchOpts);
        if (lowerRes.items.length > 0) res = lowerRes;
      }
    }
    if (res.items.length === 0 && page === 1 && targetIso3 && targetIso3 !== primaryCode) {
      const iso3Res = await fetchLolzteamSingleBatch(cleanUrl, token, filters, targetIso3, useSpam, batchOpts);
      if (iso3Res.items.length > 0) res = iso3Res;
    }
    return res;
  };

  let batch: LolzteamBatchResult | null = null;
  let primaryErr: unknown = null;
  let usedFallback = false;

  try {
    batch = await loadWithCountryVariants(true);
  } catch (err) {
    primaryErr = err;
  }

  const matchedPrimary = batch
    ? batch.items.filter((it) => itemMatchesLolzteamFilters(it, filters, false))
    : [];

  if (spamActive && (primaryErr || (page === 1 && matchedPrimary.length === 0))) {
    try {
      const unfiltered = await loadWithCountryVariants(false);
      if (unfiltered.items.length > 0) {
        batch = unfiltered;
        usedFallback = true;
        primaryErr = null;
      }
    } catch (fallbackErr) {
      if (primaryErr) throw fallbackErr;
    }
  }

  if (primaryErr || !batch) {
    throw primaryErr instanceof Error ? primaryErr : new Error('Unable to load accounts from API');
  }

  const spamTrusted: 'free' | 'blocked' | undefined =
    !usedFallback && (filters?.spam === 'free' || filters?.spam === 'blocked')
      ? filters.spam
      : undefined;
  const premiumTrusted = filters?.category === 'premium' || filters?.premium === 'premium';
  const effectiveOrigin = getEffectiveOriginFilter(filters);
  const originTrusted =
    effectiveOrigin && effectiveOrigin !== 'any' ? effectiveOrigin : undefined;

  const accounts: ProviderTgAccount[] = [];
  const seenIds = new Set<string>();

  for (const item of batch.items) {
    const id = String(item.item_id ?? item.account_id ?? item.id ?? '');
    if (!id || seenIds.has(id)) continue;
    if (!itemMatchesLolzteamFilters(item, filters, usedFallback)) continue;

    if (hasCountryFilter && targetKey) {
      const itemMeta = extractItemCountryMeta(item);
      const itemKey = (itemMeta.iso || itemMeta.code).toUpperCase();
      // Only reject if the item explicitly declares a different country
      if (itemKey && itemKey !== 'INTL' && itemKey !== targetKey) continue;
    }

    seenIds.add(id);
    accounts.push(
      mapLolzteamItemToAccount(
        item,
        marginPct,
        usdtRate,
        spamTrusted,
        premiumTrusted,
        originTrusted,
        targetMeta,
      ),
    );
  }

  return {
    accounts,
    totalItems: usedFallback ? null : batch.totalItems,
    page: batch.page,
    perPage: batch.perPage,
    hasNextPage: batch.hasNextPage,
    nextPage: batch.hasNextPage ? batch.page + 1 : null,
    nextPmin: batch.nextPmin,
    nextPmax: batch.nextPmax,
  };
}

export async function fetchLolzteamCountries(
  baseUrl: string,
  token: string,
  marginPct: number,
  usdtRate: number,
  filters?: TgAccountFilters,
): Promise<ProviderCountryItem[]> {
  const cleanUrl = normalizeBaseUrl(baseUrl);
  const filterSig = JSON.stringify({
    url: cleanUrl,
    tk: token.slice(-8),
    category: filters?.category || null,
    spam: filters?.spam || 'any',
    origin: getEffectiveOriginFilter(filters) || 'any',
    premium: filters?.premium || 'any',
    email: filters?.email || 'any',
    marginPct,
    usdtRate,
  });

  const cached = lztCountriesCache.get(filterSig);
  if (cached && Date.now() - cached.ts < LZT_COUNTRIES_CACHE_TTL_MS) {
    return [...cached.countries].sort((a, b) =>
      filters?.sort === 'high' ? b.price - a.price : a.price - b.price,
    );
  }

  const allRaw: Array<Record<string, unknown>> = [];
  const seenIds = new Set<string>();
  let usedFallback = false;

  const collectFromBatch = (b: LolzteamBatchResult) => {
    for (const it of b.items) {
      const id = String(it.item_id ?? it.account_id ?? it.id ?? '');
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);
      allRaw.push(it);
    }
  };

  // Sweep multiple pages across price & recency tiers so all active countries are discovered
  const sweepPlans: Array<{ page: number; orderByOverride?: string }> = [
    { page: 1, orderByOverride: 'price_to_up' },
    { page: 2, orderByOverride: 'price_to_up' },
    { page: 3, orderByOverride: 'price_to_up' },
    { page: 4, orderByOverride: 'price_to_up' },
    { page: 5, orderByOverride: 'price_to_up' },
    { page: 1, orderByOverride: 'pdate_to_down' },
    { page: 2, orderByOverride: 'pdate_to_down' },
    { page: 1, orderByOverride: 'price_to_down' },
  ];

  let firstBatchHasNext = true;
  let primaryErr: unknown = null;

  for (let i = 0; i < sweepPlans.length; i += 1) {
    const plan = sweepPlans[i];
    if (i > 0 && !firstBatchHasNext) break;
    if (i > 0) await sleepMs(450);
    try {
      const batch = await fetchLolzteamSingleBatch(cleanUrl, token, filters, undefined, true, {
        page: plan.page,
        orderByOverride: plan.orderByOverride,
      });
      if (i === 0) firstBatchHasNext = batch.hasNextPage;
      collectFromBatch(batch);
    } catch (err) {
      if (i === 0) primaryErr = err;
      break;
    }
  }

  const spamActive = filters?.spam === 'free' || filters?.spam === 'blocked' || filters?.spam === 'temp';
  const matchedPrimary = allRaw.filter((it) => itemMatchesLolzteamFilters(it, filters, false));
  if (spamActive && (primaryErr || matchedPrimary.length === 0)) {
    try {
      const fallbackBatch = await fetchLolzteamSingleBatch(cleanUrl, token, filters, undefined, false, {
        page: 1,
        orderByOverride: 'price_to_up',
      });
      if (fallbackBatch.items.length > 0) {
        allRaw.length = 0;
        seenIds.clear();
        collectFromBatch(fallbackBatch);
        usedFallback = true;
        primaryErr = null;
      }
    } catch (fallbackErr) {
      if (primaryErr) throw fallbackErr;
    }
  }

  if (primaryErr && allRaw.length === 0) throw primaryErr;

  const grouped = new Map<
    string,
    { code: string; iso: string; name: string; flag: string; minPriceInr: number; count: number }
  >();

  for (const item of allRaw) {
    if (!itemMatchesLolzteamFilters(item, filters, usedFallback)) continue;
    const meta = extractItemCountryMeta(item);
    const groupKey = meta.iso || meta.code;
    const finalPrice = computeInrPrice(item, marginPct, usdtRate);
    const prev = grouped.get(groupKey);
    if (!prev) {
      grouped.set(groupKey, {
        code: meta.code,
        iso: meta.iso,
        name: meta.name,
        flag: meta.flag,
        minPriceInr: finalPrice,
        count: 1,
      });
    } else {
      prev.count += 1;
      if (finalPrice > 0 && finalPrice < prev.minPriceInr) prev.minPriceInr = finalPrice;
    }
  }

  const out: ProviderCountryItem[] = [];
  for (const info of grouped.values()) {
    out.push({
      code: info.code,
      iso: info.iso || undefined,
      name: info.name,
      flag: info.flag,
      price: info.minPriceInr,
      stock: info.count,
      source: 'api',
    });
  }

  lztCountriesCache.set(filterSig, { ts: Date.now(), countries: out });
  if (lztCountriesCache.size > 60) {
    const oldestKey = lztCountriesCache.keys().next().value;
    if (oldestKey) lztCountriesCache.delete(oldestKey);
  }

  return out.sort((a, b) => (filters?.sort === 'high' ? b.price - a.price : a.price - b.price));
}

export async function fetchLolzteamCountryAccounts(
  baseUrl: string,
  token: string,
  countryCode: string,
  marginPct: number,
  usdtRate: number,
  filters?: TgAccountFilters,
  countryIsoHint?: string,
): Promise<ProviderTgAccount[]> {
  const pageRes = await fetchLolzteamAccountsPage(baseUrl, token, marginPct, usdtRate, {
    countryCode,
    countryIsoHint,
    filters,
    page: 1,
  });
  return pageRes.accounts;
}

export async function buyLolzteamTelegram(
  baseUrl: string,
  token: string,
  countryCode: string,
  filters?: TgAccountFilters,
  preferredItemId?: string,
): Promise<{ itemId: string; phone: string; credentials: string }> {
  const cleanUrl = normalizeBaseUrl(baseUrl);
  let itemId = preferredItemId ? String(preferredItemId).trim() : '';
  let match: Record<string, unknown> | undefined;

  if (!itemId) {
    const targetMeta = resolveCountryMeta({ code: countryCode });
    const targetIso2 = targetMeta.iso ? targetMeta.iso.toUpperCase() : undefined;
    const batch = await fetchLolzteamSingleBatch(cleanUrl, token, filters, targetIso2, true, { page: 1 });
    const eligibleItems = batch.items.filter((i) => itemMatchesLolzteamFilters(i, filters, false));
    if (!eligibleItems.length) {
      throw new Error('No Telegram accounts available right now for the selected filters');
    }
    const targetKey = (targetMeta.iso || targetMeta.code).toUpperCase();
    match = eligibleItems.find((i) => {
      const m = extractItemCountryMeta(i);
      return (m.iso || m.code).toUpperCase() === targetKey;
    }) || eligibleItems[0];
    if (!match) {
      throw new Error('Selected country is out of stock for these filters. Please refresh and try again.');
    }
    itemId = String(match.item_id);
  } else {
    const infoRes = await callLolzteamJson(cleanUrl, token, `/${encodeURIComponent(itemId)}?currency=usd`, {
      method: 'GET',
      timeoutMs: 20000,
      maxRetries: 2,
    }).catch(() => null);
    if (infoRes?.ok && infoRes.data.item && typeof infoRes.data.item === 'object') {
      match = infoRes.data.item as Record<string, unknown>;
    }
  }

  const buyPayload: Record<string, unknown> = {};
  if (match && match.price !== undefined && match.price !== null && Number.isFinite(Number(match.price))) {
    buyPayload.price = Number(match.price);
  }

  const buyCall = await callLolzteamJson(cleanUrl, token, `/${encodeURIComponent(itemId)}/fast-buy`, {
    method: 'POST',
    payload: buyPayload,
    timeoutMs: 60000,
    maxRetries: 6,
  });

  if (!buyCall.ok) {
    const errLower = buyCall.errorText.toLowerCase();
    if (/not enough|insufficient|balance/.test(errLower)) {
      throw new Error('Service temporarily unavailable. Please try again later or contact support.');
    }
    throw new Error('Selected account is no longer available. Please refresh and choose another account.');
  }

  const item = (buyCall.data.item || match || {}) as Record<string, unknown>;
  const finalItemId = String(item.item_id || itemId);
  const loginData = (item.loginData && typeof item.loginData === 'object' ? item.loginData : undefined) as
    | Record<string, unknown>
    | undefined;
  const phone = String(item.telegram_phone || loginData?.login || item.login || `TG-${finalItemId}`);
  const originLabel = formatOriginLabel(item.item_origin || item.origin, item.resale_item_origin || item.resale_origin);
  const premEnd = extractLolzteamPremiumEnd(item);
  const premLabel =
    getLolzteamPremiumFlag(item) || premEnd ? `Premium${premEnd ? ` (Ends ${premEnd})` : ''}` : 'Non-Premium';
  const creds = loginData
    ? `Login: ${loginData.login || phone} · 2FA: ${loginData.password || 'None'} · ${originLabel} · ${premLabel}`
    : `Account Ready · ${originLabel} · ${premLabel}`;
  return { itemId: finalItemId, phone, credentials: creds };
}

const TG_DC_IPS: Record<number, string> = {
  1: '149.154.175.53',
  2: '149.154.167.51',
  3: '149.154.175.100',
  4: '149.154.167.91',
  5: '91.108.56.130',
};

function buildTelethonStringSession(dcIdRaw: unknown, authKeyRaw: unknown): string {
  const dc = Number(dcIdRaw);
  const ip = TG_DC_IPS[dc];
  if (!ip) return '';
  const cleanHex = String(authKeyRaw || '').replace(/[^0-9a-fA-F]/g, '');
  if (cleanHex.length !== 512) return '';
  const ipParts = ip.split('.').map((n) => Number(n));
  if (ipParts.length !== 4 || ipParts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return '';

  const buf = Buffer.alloc(1 + 4 + 2 + 256);
  buf.writeUInt8(dc, 0);
  buf.writeUInt8(ipParts[0], 1);
  buf.writeUInt8(ipParts[1], 2);
  buf.writeUInt8(ipParts[2], 3);
  buf.writeUInt8(ipParts[3], 4);
  buf.writeUInt16BE(443, 5);
  Buffer.from(cleanHex, 'hex').copy(buf, 7);

  const b64Url = buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  return `1${b64Url}`;
}

export async function fetchLolzteamLoginCode(
  baseUrl: string,
  token: string,
  itemId: string,
): Promise<{ code: string }> {
  const cleanUrl = normalizeBaseUrl(baseUrl);
  const call = await callLolzteamJson(cleanUrl, token, `/${encodeURIComponent(itemId)}/telegram-login-code`, {
    method: 'GET',
    timeoutMs: 45000,
    maxRetries: 6,
  });

  if (call.status === 404) {
    throw new Error('Login code not received yet. Request the code in Telegram, then tap Get Login Code again.');
  }
  if (call.status === 403) {
    throw new Error('The session for this account is no longer valid. Please log in with the phone number directly.');
  }
  if (!call.ok) {
    throw new Error('Login code not received yet. Request the code in Telegram, then try again.');
  }

  const data = call.data as {
    codes?: Array<{ code?: string | number; date?: number } | string>;
    code?: string | number;
  };
  let rawCode: unknown = data.code;
  if (Array.isArray(data.codes) && data.codes.length > 0) {
    const dated = data.codes.filter(
      (c): c is { code?: string | number; date?: number } => typeof c === 'object' && c !== null && Boolean(c.date),
    );
    const chosen = dated.length
      ? dated.reduce((best, cur) => (Number(cur.date || 0) > Number(best.date || 0) ? cur : best))
      : data.codes[0];
    rawCode = typeof chosen === 'object' && chosen !== null ? chosen.code : chosen;
  } else if (rawCode && typeof rawCode === 'object') {
    rawCode = (rawCode as { code?: string | number }).code;
  }
  const code = String(rawCode || '').trim();
  if (!code) {
    throw new Error('Login code not received yet. Request the code in Telegram, then tap Get Login Code again.');
  }
  return { code };
}

export async function fetchLolzteamSessionString(
  baseUrl: string,
  token: string,
  itemId: string,
): Promise<{ stringSession: string; dcId: string }> {
  const cleanUrl = normalizeBaseUrl(baseUrl);
  const call = await callLolzteamJson(cleanUrl, token, `/${encodeURIComponent(itemId)}`, {
    method: 'GET',
    timeoutMs: 30000,
    maxRetries: 5,
  });

  if (call.status === 404) {
    throw new Error('Session string is not available for this account. Use Get Login Code to sign in via OTP.');
  }
  if (call.status === 403) {
    throw new Error('The session for this account is no longer valid. Use Get Login Code or contact support.');
  }
  if (!call.ok) {
    throw new Error('Session string is not available right now. Use Get Login Code to sign in via OTP.');
  }

  const data = call.data;
  const item = (data.item && typeof data.item === 'object' ? data.item : data) as Record<string, unknown>;
  const loginData = (item.loginData && typeof item.loginData === 'object' ? item.loginData : {}) as Record<
    string,
    unknown
  >;
  const dcId = item.telegram_dc_id || loginData.dc_id || '';
  const authKey = item.telegram_auth_key || loginData.auth_key || '';
  let sess = String(item.string_session || loginData.string_session || '').trim();
  if (!sess && dcId && authKey) {
    sess = buildTelethonStringSession(dcId, authKey);
  }
  if (!sess) {
    throw new Error('Session string is not available for this account. Use Get Login Code to sign in via OTP.');
  }
  return { stringSession: sess, dcId: dcId ? `DC ${String(dcId).replace(/^DC\s*/i, '')}` : '-' };
}

export async function resetLolzteamAuthorizations(
  baseUrl: string,
  token: string,
  itemId: string,
): Promise<{ ok: true }> {
  const cleanUrl = normalizeBaseUrl(baseUrl);
  const call = await callLolzteamJson(
    cleanUrl,
    token,
    `/${encodeURIComponent(itemId)}/telegram-reset-authorizations`,
    {
      method: 'POST',
      payload: {},
      timeoutMs: 45000,
      maxRetries: 6,
    },
  );

  if (!call.ok) {
    const errLower = call.errorText.toLowerCase();
    if (call.status === 403 || /invalid|expired|logged out|session_dead|auth_key_unregistered/.test(errLower)) {
      throw new Error(
        'This session has expired or is no longer active. Please terminate devices directly inside Telegram Settings.',
      );
    }
    if (/fresh_reset_authorisation|24|too recent|recently|hash/.test(errLower)) {
      throw new Error(
        'Telegram requires a short cooldown before resetting other authorizations from a new session. Try again later or reset inside Telegram Settings.',
      );
    }
    throw new Error(
      'Could not terminate other sessions right now. Please try again in a few seconds or reset inside Telegram Settings.',
    );
  }

  return { ok: true };
}

// ============================================================
// SERVER 2 & 3: OTP SMS API
// ============================================================
export async function testTigerSms(baseUrl: string, apiKey: string): Promise<{ ok: boolean; detail: string }> {
  const cleanUrl = normalizeBaseUrl(baseUrl);
  const url = `${cleanUrl}/stubs/handler_api.php?api_key=${encodeURIComponent(apiKey)}&action=getBalance`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  const text = (await res.text()).trim();
  if (!text.startsWith('ACCESS_BALANCE:')) {
    throw new Error(text || `HTTP ${res.status}`);
  }
  const bal = text.split(':')[1] || '0';
  return { ok: true, detail: `Connected · Balance: ${bal}` };
}

export async function fetchTigerServices(
  baseUrl: string,
  apiKey: string,
  marginPct: number,
  usdtRate: number,
): Promise<ProviderAppItem[]> {
  const cleanUrl = normalizeBaseUrl(baseUrl);
  const [servicesRes, pricesRes] = await Promise.all([
    fetch(`${cleanUrl}/stubs/handler_api.php?api_key=${encodeURIComponent(apiKey)}&action=getServicesList`, {
      signal: AbortSignal.timeout(12000),
    }).catch(() => null),
    fetch(`${cleanUrl}/stubs/handler_api.php?api_key=${encodeURIComponent(apiKey)}&action=getPrices`, {
      signal: AbortSignal.timeout(12000),
    }).catch(() => null),
  ]);

  const serviceMap = new Map<string, { name: string; stock: number; minPrice: number | null }>();

  // 1. Parse getServicesList (supports { services: [...] }, [...], or { code: name })
  if (servicesRes && servicesRes.ok) {
    try {
      const raw = (await servicesRes.json()) as unknown;
      if (Array.isArray(raw)) {
        for (const row of raw) {
          if (!row || typeof row !== 'object') continue;
          const r = row as Record<string, unknown>;
          const code = String(r.code || r.service || '').trim().toLowerCase();
          const name = String(r.name || r.title || '').trim();
          if (code) {
            serviceMap.set(code, {
              name: name || KNOWN_APP_NAMES[code] || code.toUpperCase(),
              stock: 0,
              minPrice: null,
            });
          }
        }
      } else if (raw && typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        if (Array.isArray(obj.services)) {
          for (const row of obj.services) {
            if (!row || typeof row !== 'object') continue;
            const r = row as Record<string, unknown>;
            const code = String(r.code || r.service || '').trim().toLowerCase();
            const name = String(r.name || r.title || '').trim();
            if (code) {
              serviceMap.set(code, {
                name: name || KNOWN_APP_NAMES[code] || code.toUpperCase(),
                stock: 0,
                minPrice: null,
              });
            }
          }
        } else {
          for (const [k, v] of Object.entries(obj)) {
            if (k === 'status') continue;
            const code = k.trim().toLowerCase();
            if (typeof v === 'string' && code) {
              serviceMap.set(code, {
                name: v.trim() || KNOWN_APP_NAMES[code] || code.toUpperCase(),
                stock: 0,
                minPrice: null,
              });
            }
          }
        }
      }
    } catch {
      // Fallback to getPrices below
    }
  }

  // 2. Parse getPrices across all countries to populate stock & starting price
  if (pricesRes && pricesRes.ok) {
    try {
      const pricesJson = (await pricesRes.json()) as Record<
        string,
        Record<string, { cost?: number | string; count?: number | string }>
      >;
      if (pricesJson && typeof pricesJson === 'object' && !Array.isArray(pricesJson)) {
        for (const svcMap of Object.values(pricesJson)) {
          if (!svcMap || typeof svcMap !== 'object') continue;
          for (const [rawCode, entry] of Object.entries(svcMap)) {
            const code = rawCode.trim().toLowerCase();
            const count = Number(entry?.count || 0);
            const rawCost = Number(entry?.cost || 0);
            if (!code || count <= 0) continue;

            const inrBase = rawCost < 5 ? rawCost * (usdtRate || 92) : rawCost * 1.05;
            const finalPrice = Math.max(5, Math.ceil(inrBase * (1 + (marginPct || 0) / 100)));

            const existing = serviceMap.get(code);
            if (!existing) {
              serviceMap.set(code, {
                name: KNOWN_APP_NAMES[code] || code.toUpperCase(),
                stock: count,
                minPrice: finalPrice,
              });
            } else {
              existing.stock += count;
              if (existing.minPrice === null || finalPrice < existing.minPrice) {
                existing.minPrice = finalPrice;
              }
            }
          }
        }
      }
    } catch {
      // Optional price enrichment
    }
  }

  if (serviceMap.size === 0) {
    throw new Error('Could not load app catalog from live server');
  }

  const out: ProviderAppItem[] = Array.from(serviceMap.entries()).map(([code, info]) => ({
    code,
    name: info.name,
    stock: info.stock,
    minPrice: info.minPrice,
  }));

  return out.sort((a, b) => {
    const aHasStock = a.stock > 0 ? 1 : 0;
    const bHasStock = b.stock > 0 ? 1 : 0;
    if (aHasStock !== bHasStock) return bHasStock - aHasStock;

    const aPop = POPULAR_APP_ORDER.indexOf(a.code);
    const bPop = POPULAR_APP_ORDER.indexOf(b.code);
    if (aPop !== -1 && bPop !== -1) return aPop - bPop;
    if (aPop !== -1) return -1;
    if (bPop !== -1) return 1;

    return a.name.localeCompare(b.name);
  });
}

export async function resolveTigerWaService(
  baseUrl: string,
  apiKey: string,
  configured = 'wa',
): Promise<string> {
  const cleanUrl = normalizeBaseUrl(baseUrl);
  try {
    const res = await fetch(
      `${cleanUrl}/stubs/handler_api.php?api_key=${encodeURIComponent(apiKey)}&action=getServicesList`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) return configured;
    const raw = (await res.json()) as unknown;
    const rows: Array<{ code: string; name: string }> = [];
    const list = Array.isArray(raw)
      ? raw
      : raw && typeof raw === 'object' && Array.isArray((raw as { services?: unknown[] }).services)
        ? (raw as { services: unknown[] }).services
        : [];
    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const r = item as Record<string, unknown>;
      const code = String(r.code || r.service || '').trim();
      const name = String(r.name || r.title || '').toLowerCase();
      if (code) rows.push({ code, name });
    }
    if (!rows.length) return configured;
    if (rows.some((r) => r.code.toLowerCase() === configured.toLowerCase())) return configured;
    const byName = rows.find((r) => r.name.includes('whats'));
    if (byName) return byName.code;
    const byCommon = rows.find((r) => ['wa', 'whatsapp', 'wa_', 'wb'].includes(r.code.toLowerCase()));
    if (byCommon) return byCommon.code;
  } catch {
    // fallback to configured
  }
  return configured;
}

export async function fetchTigerCountries(
  baseUrl: string,
  apiKey: string,
  serviceCode: string,
  marginPct: number,
  usdtRate: number,
): Promise<ProviderCountryItem[]> {
  const cleanUrl = normalizeBaseUrl(baseUrl);
  const resolvedService =
    serviceCode.toLowerCase() === 'wa' ? await resolveTigerWaService(cleanUrl, apiKey, 'wa') : serviceCode;

  const countriesResPromise = fetch(
    `${cleanUrl}/stubs/handler_api.php?api_key=${encodeURIComponent(apiKey)}&action=getCountries`,
    { signal: AbortSignal.timeout(12000) },
  ).catch(() => null);

  const tryPriceEndpoint = async (action: 'getPrices' | 'getPricesV3', withService: boolean) => {
    const qs = new URLSearchParams({ api_key: apiKey, action });
    if (withService) qs.set('service', resolvedService);
    const res = await fetch(`${cleanUrl}/stubs/handler_api.php?${qs.toString()}`, {
      signal: AbortSignal.timeout(12000),
    });
    const text = await res.text();
    const parsed = JSON.parse(text) as Record<
      string,
      Record<string, { cost?: number | string; price?: number | string; count?: number | string }>
    >;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(text || 'Invalid country price response');
    }
    return parsed;
  };

  let pricesJson: Record<
    string,
    Record<string, { cost?: number | string; price?: number | string; count?: number | string }>
  > = {};
  let lastErr: unknown = null;
  const attempts: Array<['getPrices' | 'getPricesV3', boolean]> = [
    ['getPrices', true],
    ['getPricesV3', true],
    ['getPrices', false],
    ['getPricesV3', false],
  ];
  for (const [action, withSvc] of attempts) {
    try {
      const candidate = await tryPriceEndpoint(action, withSvc);
      const hasAny = Object.values(candidate).some((svcMap) => {
        if (!svcMap || typeof svcMap !== 'object') return false;
        const e =
          svcMap[resolvedService] ||
          svcMap[serviceCode] ||
          (resolvedService.toLowerCase() === 'wa' ? svcMap.wa || svcMap.whatsapp || svcMap.wb : undefined);
        return Boolean(e && Number(e.count || 0) > 0);
      });
      if (hasAny) {
        pricesJson = candidate;
        break;
      }
    } catch (err) {
      lastErr = err;
    }
  }

  if (Object.keys(pricesJson).length === 0 && lastErr) {
    throw lastErr instanceof Error ? lastErr : new Error('Invalid country price response');
  }

  const countriesRes = await countriesResPromise;
  const countryNames: Record<string, string> = {};
  const countryRetry: Record<string, boolean> = {};
  if (countriesRes && countriesRes.ok) {
    try {
      const cJson = (await countriesRes.json()) as Array<{
        id: number | string;
        eng?: string;
        rus?: string;
        retry?: number | boolean;
      }>;
      if (Array.isArray(cJson)) {
        for (const c of cJson) {
          const cid = String(c.id);
          countryNames[cid] = c.eng || c.rus || '';
          countryRetry[cid] = Boolean(c.retry);
        }
      }
    } catch {
      // Optional mapping
    }
  }

  const out: ProviderCountryItem[] = [];
  for (const [countryId, svcMap] of Object.entries(pricesJson)) {
    if (!svcMap || typeof svcMap !== 'object') continue;
    const entry =
      svcMap[resolvedService] ||
      svcMap[serviceCode] ||
      (resolvedService.toLowerCase() === 'wa' ? svcMap.wa || svcMap.whatsapp || svcMap.wb : undefined);
    if (!entry || Number(entry.count || 0) <= 0) continue;
    const rawCost = Number(entry.cost ?? entry.price ?? 0) || 0;
    const inrBase = rawCost < 5 ? rawCost * (usdtRate || 92) : rawCost * 1.05;
    const finalPrice = Math.max(5, Math.ceil(inrBase * (1 + (marginPct || 0) / 100)));
    const meta = resolveCountryMeta({
      code: countryId,
      name: countryNames[countryId],
    });
    out.push({
      code: countryId,
      iso: meta.iso || undefined,
      name: meta.name,
      flag: meta.flag,
      price: finalPrice,
      stock: Number(entry.count || 0),
      retry: countryRetry[countryId] ?? false,
      source: 'api',
    });
  }

  return out.sort((a, b) => a.price - b.price);
}

export async function buyTigerNumber(
  baseUrl: string,
  apiKey: string,
  serviceCode: string,
  countryId: string,
): Promise<{ activationId: string; phone: string }> {
  const cleanUrl = normalizeBaseUrl(baseUrl);
  const resolvedService =
    serviceCode.toLowerCase() === 'wa' ? await resolveTigerWaService(cleanUrl, apiKey, 'wa') : serviceCode;
  const url = `${cleanUrl}/stubs/handler_api.php?api_key=${encodeURIComponent(apiKey)}&action=getNumber&service=${encodeURIComponent(resolvedService)}&country=${encodeURIComponent(countryId)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  const text = (await res.text()).trim();
  if (!text.startsWith('ACCESS_NUMBER:')) {
    throw new Error(text || 'Number unavailable for this selection');
  }
  const [, activationId, phone] = text.split(':');
  return {
    activationId,
    phone: phone.startsWith('+') ? phone : `+${phone}`,
  };
}

export async function checkTigerOtp(
  baseUrl: string,
  apiKey: string,
  activationId: string,
): Promise<{ status: 'WAIT_CODE' | 'WAIT_RETRY' | 'DONE' | 'CANCELLED'; code?: string }> {
  const cleanUrl = normalizeBaseUrl(baseUrl);
  const url = `${cleanUrl}/stubs/handler_api.php?api_key=${encodeURIComponent(apiKey)}&action=getStatus&id=${encodeURIComponent(activationId)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  const text = (await res.text()).trim();
  if (text.startsWith('STATUS_OK:')) {
    const code = text.slice('STATUS_OK:'.length).trim();
    // Finalize activation cleanly just like the bot
    void fetch(
      `${cleanUrl}/stubs/handler_api.php?api_key=${encodeURIComponent(apiKey)}&action=setStatus&status=6&id=${encodeURIComponent(activationId)}`,
      { signal: AbortSignal.timeout(8000) },
    ).catch(() => {});
    return { status: 'DONE', code };
  }
  if (text.startsWith('STATUS_WAIT_RETRY:')) {
    return { status: 'WAIT_RETRY', code: text.slice('STATUS_WAIT_RETRY:'.length).trim() };
  }
  if (text === 'STATUS_CANCEL' || text.startsWith('ACCESS_CANCEL')) {
    return { status: 'CANCELLED' };
  }
  return { status: 'WAIT_CODE' };
}

export async function retryTigerOtp(baseUrl: string, apiKey: string, activationId: string): Promise<void> {
  const cleanUrl = normalizeBaseUrl(baseUrl);
  const url = `${cleanUrl}/stubs/handler_api.php?api_key=${encodeURIComponent(apiKey)}&action=setStatus&status=3&id=${encodeURIComponent(activationId)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  const text = (await res.text()).trim();
  if (text && text !== 'ACCESS_RETRY_GET' && text !== 'ACCESS_ACTIVATION' && !text.startsWith('ACCESS_')) {
    throw new Error('Retry SMS could not be requested right now.');
  }
}

export async function cancelTigerOtp(
  baseUrl: string,
  apiKey: string,
  activationId: string,
): Promise<{ outcome: 'CANCELLED' | 'DONE'; code?: string }> {
  const cleanUrl = normalizeBaseUrl(baseUrl);
  const url = `${cleanUrl}/stubs/handler_api.php?api_key=${encodeURIComponent(apiKey)}&action=setStatus&status=8&id=${encodeURIComponent(activationId)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  const text = (await res.text()).trim();
  if (text.startsWith('STATUS_OK:')) {
    const code = text.slice('STATUS_OK:'.length).trim();
    return { outcome: 'DONE', code };
  }
  if (text === 'ACCESS_CANCEL' || text === 'STATUS_CANCEL') {
    return { outcome: 'CANCELLED' };
  }
  if (/EARLY_CANCEL/i.test(text)) {
    throw new Error('Cancellation is not allowed yet. Please wait a minute and try again.');
  }
  throw new Error('Cancellation could not be confirmed yet. Please wait a moment and try again.');
}

// ============================================================
// SMM PANEL v2 API
// ============================================================
export async function testSmmPanel(baseUrl: string, apiKey: string): Promise<{ ok: boolean; detail: string }> {
  const cleanUrl = normalizeBaseUrl(baseUrl);
  const body = new URLSearchParams({ key: apiKey, action: 'balance' });
  const res = await fetch(cleanUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(12000),
  });
  const data = (await res.json().catch(() => ({}))) as { balance?: string; currency?: string; error?: string };
  if (!res.ok || data.error) {
    throw new Error(data.error || `SMM HTTP ${res.status}`);
  }
  return { ok: true, detail: `Connected · Balance: ${data.balance ?? '0'} ${data.currency ?? ''}`.trim() };
}

export interface RemoteSmmService {
  service: number;
  name: string;
  rate: number;
  min: number;
  max: number;
  category: string;
}

export async function fetchSmmPanelServices(baseUrl: string, apiKey: string): Promise<RemoteSmmService[]> {
  const cleanUrl = normalizeBaseUrl(baseUrl);
  const body = new URLSearchParams({ key: apiKey, action: 'services' });
  const res = await fetch(cleanUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  });
  const data = (await res.json().catch(() => null)) as Array<Record<string, unknown>> | { error?: string } | null;
  if (!res.ok || !Array.isArray(data)) {
    const errMsg = data && !Array.isArray(data) ? data.error : undefined;
    throw new Error(errMsg || `HTTP ${res.status}`);
  }
  return data.map((s) => ({
    service: Number(s.service),
    name: String(s.name || `Service ${s.service}`),
    rate: Number(s.rate || 0),
    min: Number(s.min || 10),
    max: Number(s.max || 10000),
    category: String(s.category || ''),
  }));
}

export async function placeSmmPanelOrder(
  baseUrl: string,
  apiKey: string,
  serviceId: number,
  link: string,
  quantity: number,
): Promise<{ orderId: string }> {
  const cleanUrl = normalizeBaseUrl(baseUrl);
  const body = new URLSearchParams({
    key: apiKey,
    action: 'add',
    service: String(serviceId),
    link,
    quantity: String(quantity),
  });
  const res = await fetch(cleanUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  });
  const data = (await res.json().catch(() => ({}))) as { order?: number | string; error?: string };
  if (!res.ok || data.error || !data.order) {
    throw new Error(data.error || `Order error (HTTP ${res.status})`);
  }
  return { orderId: String(data.order) };
}
