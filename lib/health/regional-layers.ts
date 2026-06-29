/**
 * Regional Diabetes Guidance Layers
 *
 * IDF + WHO serve as the global baseline for all users.
 * This module maps a user's country/region to a supplementary
 * regional guidance layer. Regional layers ADD context — they
 * never override the global safety thresholds.
 *
 * Sources:
 *   Global: International Diabetes Federation (IDF) 2025
 *   Global: WHO HEARTS-D / WHO Global Healthy Diet Guidelines
 *   U.S.:   ADA Standards of Medical Care (annual)
 *   UK:     Diabetes UK Clinical Recommendations
 *   Canada: Diabetes Canada Clinical Practice Guidelines
 *   LATAM:  ALAD (Latin American Diabetes Association)
 *   South Asia: RSSDI (Research Society for the Study of Diabetes in India)
 *   Middle East/North Africa: IDF MENA
 *   Australia/NZ: Diabetes Australia / NZDS
 */

export type RegionCode =
  | 'us'
  | 'uk'
  | 'canada'
  | 'latam'
  | 'south_asia'
  | 'middle_east_north_africa'
  | 'east_asia'
  | 'africa'
  | 'europe'
  | 'australia_nz'
  | 'global'; // fallback

export interface RegionalGuidance {
  code: RegionCode;
  label: string;
  source: string;
  sourceUrl: string;
  /** Short note injected into AI prompts to localize guidance. */
  promptNote: string;
  /** Cultural staples common to this region — AI should embrace these. */
  culturalStaples: string[];
  /** A1C target note (individual targets vary — always defer to care team). */
  a1cNote: string;
  /** Any region-specific sodium, sugar, or carb notes beyond global IDF/WHO defaults. */
  nutritionNote?: string;
  /** Healthcare system context useful for safety messaging. */
  emergencyNote?: string;
}

const LAYERS: Record<RegionCode, RegionalGuidance> = {
  us: {
    code: 'us',
    label: 'United States',
    source: 'American Diabetes Association (ADA) Standards of Medical Care',
    sourceUrl: 'https://diabetesjournals.org/care/issue/47/Supplement_1',
    promptNote:
      'User is U.S.-based. Apply ADA guidance as a regional complement to IDF/WHO: fasting target 80–130 mg/dL, post-meal <180 mg/dL, A1C goal typically <7% for many adults. Emergency: call 911.',
    culturalStaples: [
      'corn', 'potatoes', 'beans', 'whole grains', 'barbecue', 'soul food',
      'tacos', 'burgers', 'pizza', 'sandwiches',
    ],
    a1cNote: 'ADA general target: <7% for many non-pregnant adults. Individual goals set by care team.',
    emergencyNote: 'Call 911 for emergencies. Urgent care and ER available.',
  },

  uk: {
    code: 'uk',
    label: 'United Kingdom',
    source: 'Diabetes UK Clinical Recommendations',
    sourceUrl: 'https://www.diabetes.org.uk/professionals/position-statements-reports/food-and-nutrition',
    promptNote:
      'User is UK-based. Diabetes UK recommendations apply alongside IDF/WHO. NICE guidelines set HbA1c targets; common goal 48 mmol/mol (≈6.5%) to 58 mmol/mol (≈7.5%) depending on treatment. NHS 111 for non-emergency; 999 for emergency.',
    culturalStaples: [
      'potatoes', 'bread', 'pasta', 'rice', 'fish and chips', 'curry',
      'full English breakfast', 'porridge', 'beans on toast',
    ],
    a1cNote: 'Diabetes UK / NICE: HbA1c 48–58 mmol/mol depending on individual circumstances.',
    emergencyNote: 'Call 999 for emergencies. NHS 111 for urgent non-emergency advice.',
  },

  canada: {
    code: 'canada',
    label: 'Canada',
    source: 'Diabetes Canada Clinical Practice Guidelines',
    sourceUrl: 'https://guidelines.diabetes.ca',
    promptNote:
      'User is Canada-based. Diabetes Canada CPG applies alongside IDF/WHO. A1C target typically <7.0% for most adults. Emergency: call 911.',
    culturalStaples: [
      'potatoes', 'bread', 'poutine', 'bannock', 'wild rice',
      'salmon', 'maple products', 'beans', 'squash',
    ],
    a1cNote: 'Diabetes Canada: A1C <7.0% for most adults; <6.5% if achievable without hypoglycemia.',
    emergencyNote: 'Call 911 for emergencies.',
  },

  latam: {
    code: 'latam',
    label: 'Latin America / Caribbean',
    source: 'ALAD (Latin American Diabetes Association) — Guías ALAD',
    sourceUrl: 'https://alad-latinoamerica.org/guias',
    promptNote:
      'User is from Latin America or the Caribbean. Apply ALAD guidance alongside IDF/WHO. Cultural staples like tortillas, beans, rice, tamales, plátanos, yuca, pozole, and aguas frescas are central to daily eating and should NEVER be suggested for removal — only adapted with portion, preparation, and pairing context. Emergency services vary by country.',
    culturalStaples: [
      'tortillas', 'beans', 'rice', 'tamales', 'nopales', 'plátanos', 'yuca',
      'pozole', 'aguas frescas', 'horchata', 'mole', 'chiles', 'avocado',
      'rice and peas', 'plantains', 'stews', 'sofrito',
    ],
    a1cNote: 'ALAD recommends individualized targets; generally <7% for most adults.',
    nutritionNote:
      'Corn, beans, and rice are nutritionally important staples. Corn tortillas have more fiber than flour. Beans are high in fiber and protein — a key diabetes-supportive food in this diet pattern.',
    emergencyNote: 'Emergency numbers vary by country. Mexico: 911. Colombia: 123. Brazil: 192 (SAMU). Always check local emergency number.',
  },

  south_asia: {
    code: 'south_asia',
    label: 'South Asia',
    source: 'RSSDI (Research Society for the Study of Diabetes in India) / IDF South-East Asia',
    sourceUrl: 'https://rssdi.in/guidelines',
    promptNote:
      'User is from South Asia (India, Pakistan, Bangladesh, Sri Lanka, Nepal, etc.). South Asian populations have a higher genetic risk for Type 2 diabetes and often develop it at lower BMI than global averages. RSSDI/IDF South-East Asia guidance applies. Staple foods including roti, dal, rice, curry, idli, dosa, biryani, paratha, samosa, and chai are central to culture and should never be eliminated — guide on preparation and pairing.',
    culturalStaples: [
      'roti', 'chapati', 'naan', 'paratha', 'rice', 'dal', 'curry',
      'idli', 'dosa', 'biryani', 'paneer', 'samosa', 'chutney', 'raita',
      'lentils', 'chickpeas', 'chai',
    ],
    a1cNote: 'IDF/RSSDI: A1C <7% for most adults; South Asian individuals may need earlier intervention due to higher metabolic risk at lower BMI.',
    nutritionNote:
      'Dal is one of the most blood-sugar-friendly foods — high in protein and fiber. Roti + dal is nutritionally balanced. Basmati rice has a lower glycemic index than short-grain varieties. Eating protein and dal before rice softens the glucose impact.',
    emergencyNote: 'India: 112 (national emergency). Pakistan: 1122. Bangladesh: 999.',
  },

  middle_east_north_africa: {
    code: 'middle_east_north_africa',
    label: 'Middle East / North Africa',
    source: 'IDF MENA Region',
    sourceUrl: 'https://idf.org/our-network/regions/middle-east-and-north-africa',
    promptNote:
      'User is from the Middle East or North Africa (MENA). IDF MENA guidance applies. The MENA region has among the highest diabetes prevalence globally. Cultural foods including pita, hummus, falafel, tabbouleh, couscous, kebab, ful medames, and dates are nutritionally rich and should be embraced. Ramadan fasting context is clinically relevant for many users — advise consultation with care team for medication adjustments during fasting.',
    culturalStaples: [
      'pita', 'hummus', 'falafel', 'tabbouleh', 'couscous', 'kebab',
      'ful medames', 'dates', 'lentil soup', 'freekeh', 'bulgur',
      'labneh', 'mint tea', 'fattoush',
    ],
    a1cNote: 'IDF MENA: A1C targets individualized; generally <7% for most adults.',
    nutritionNote:
      'Hummus and legumes are excellent — high in fiber and protein. Dates are high in natural sugar; portion awareness during Ramadan is important. Couscous and bulgur are whole-grain options with moderate glycemic index.',
    emergencyNote: 'Emergency numbers vary. UAE/Saudi Arabia: 999. Egypt: 123. Morocco: 15. Confirm local number.',
  },

  east_asia: {
    code: 'east_asia',
    label: 'East Asia',
    source: 'IDF Western Pacific / Chinese Diabetes Society (CDS) / Japan Diabetes Society (JDS)',
    sourceUrl: 'https://idf.org/our-network/regions/western-pacific',
    promptNote:
      'User is from East Asia (China, Japan, Korea, Taiwan, Vietnam, etc.). IDF Western Pacific and local society guidance applies. Rice, noodles, dumplings, congee, tofu, and fermented foods are dietary staples — never suggest removal. Portion guidance and pairing with vegetables and protein is more helpful than elimination.',
    culturalStaples: [
      'rice', 'noodles', 'dumplings', 'congee', 'tofu', 'miso soup',
      'tempeh', 'natto', 'sushi', 'bibimbap', 'kimchi', 'bok choy',
      'edamame', 'green tea', 'pho', 'banh mi',
    ],
    a1cNote: 'IDF/CDS/JDS: A1C <7% general target; Asian populations may develop diabetes at lower BMI — earlier screening recommended.',
    nutritionNote:
      'Japanese and Korean dietary patterns often include many fermented foods, vegetables, and fish — highly supportive of blood sugar management. Congee has a higher glycemic index due to cooking method; pairing with protein and vegetables helps. Natto is exceptionally high in protein and fiber.',
    emergencyNote: 'Japan: 119. China: 120. Korea: 119. Vietnam: 115.',
  },

  africa: {
    code: 'africa',
    label: 'Sub-Saharan Africa',
    source: 'IDF Africa Region / African Diabetes Association',
    sourceUrl: 'https://idf.org/our-network/regions/africa',
    promptNote:
      'User is from Sub-Saharan Africa. IDF Africa region guidance applies. Injera, fufu, ugali, jollof rice, egusi, beans, plantains, and stews are central to food culture across the continent. These are nutritionally meaningful foods — guide on pairing and portions, never elimination. Many African populations are underdiagnosed for diabetes; Chatita should encourage awareness and clinician engagement.',
    culturalStaples: [
      'injera', 'fufu', 'ugali', 'jollof rice', 'egusi', 'beans', 'plantains',
      'groundnut soup', 'yam', 'cassava', 'maize', 'tilapia', 'suya', 'kenkey',
    ],
    a1cNote: 'IDF Africa: A1C targets individualized; general goal <7–7.5% depending on resources and risk.',
    nutritionNote:
      'Beans and legumes in African diets are excellent for blood sugar — high in fiber and protein. Fermented foods (injera, ogi) have lower glycemic index than unfermented equivalents. Jollof rice portion paired with protein and vegetables is manageable.',
    emergencyNote: 'Emergency numbers vary. Nigeria: 112. Kenya: 999. South Africa: 10177 (ambulance). Ghana: 999.',
  },

  europe: {
    code: 'europe',
    label: 'Europe',
    source: 'EASD (European Association for the Study of Diabetes)',
    sourceUrl: 'https://www.easd.org/guidelines',
    promptNote:
      'User is from Europe. EASD/ESC guidelines apply alongside IDF/WHO. Mediterranean dietary patterns (olive oil, vegetables, fish, legumes, whole grains) are strongly evidence-supported for diabetes management. Pasta, bread, potatoes, and dairy are staple foods — portion and preparation guidance over elimination.',
    culturalStaples: [
      'pasta', 'bread', 'potatoes', 'olive oil', 'cheese', 'yogurt',
      'fish', 'legumes', 'vegetables', 'wine (with food)',
      'rye bread', 'pierogi', 'borscht', 'paella',
    ],
    a1cNote: 'EASD: HbA1c <7% (53 mmol/mol) for most adults; individualized targets per EASD/ADA joint statement.',
    nutritionNote:
      'Mediterranean diet pattern is one of the best-studied eating patterns for diabetes management. Olive oil, fish, legumes, and vegetables form a strong base. Sourdough bread has a lower glycemic index than refined white bread.',
    emergencyNote: 'Most EU countries: 112. UK: 999. Russia: 103.',
  },

  australia_nz: {
    code: 'australia_nz',
    label: 'Australia / New Zealand',
    source: 'Diabetes Australia / Diabetes New Zealand',
    sourceUrl: 'https://www.diabetesaustralia.com.au',
    promptNote:
      'User is from Australia or New Zealand. Diabetes Australia and Diabetes NZ guidance applies alongside IDF/WHO. Indigenous Australian and Māori populations have significantly higher diabetes rates and unique cultural food contexts — approach with cultural humility.',
    culturalStaples: [
      'damper', 'bush tucker', 'seafood', 'lamb', 'meat pies',
      'kumara', 'hangi', 'barbecued meats', 'Vegemite toast',
    ],
    a1cNote: 'Diabetes Australia: HbA1c <7% (53 mmol/mol) for most non-pregnant adults.',
    emergencyNote: 'Australia: 000. New Zealand: 111.',
  },

  global: {
    code: 'global',
    label: 'Global (IDF/WHO baseline)',
    source: 'International Diabetes Federation (IDF) + WHO',
    sourceUrl: 'https://idf.org/guidelines',
    promptNote:
      'Apply IDF and WHO global diabetes education principles. Glucose targets: fasting 80–130 mg/dL, post-meal <180 mg/dL. Adapt all food guidance to the user\'s cultural context.',
    culturalStaples: [],
    a1cNote: 'IDF: individualized targets; general reference <7% for many adults.',
  },
};

const COUNTRY_TO_REGION: Record<string, RegionCode> = {
  // U.S.
  'united states': 'us', 'usa': 'us', 'us': 'us',
  // UK
  'united kingdom': 'uk', 'uk': 'uk', 'england': 'uk', 'scotland': 'uk',
  'wales': 'uk', 'northern ireland': 'uk', 'great britain': 'uk',
  // Canada
  'canada': 'canada',
  // LATAM
  'mexico': 'latam', 'guatemala': 'latam', 'honduras': 'latam',
  'el salvador': 'latam', 'nicaragua': 'latam', 'costa rica': 'latam',
  'panama': 'latam', 'colombia': 'latam', 'venezuela': 'latam',
  'ecuador': 'latam', 'peru': 'latam', 'bolivia': 'latam',
  'chile': 'latam', 'argentina': 'latam', 'uruguay': 'latam',
  'paraguay': 'latam', 'brazil': 'latam', 'cuba': 'latam',
  'dominican republic': 'latam', 'haiti': 'latam', 'jamaica': 'latam',
  'puerto rico': 'latam', 'trinidad': 'latam', 'barbados': 'latam',
  // South Asia
  'india': 'south_asia', 'pakistan': 'south_asia', 'bangladesh': 'south_asia',
  'sri lanka': 'south_asia', 'nepal': 'south_asia', 'bhutan': 'south_asia',
  'maldives': 'south_asia',
  // MENA
  'saudi arabia': 'middle_east_north_africa', 'uae': 'middle_east_north_africa',
  'united arab emirates': 'middle_east_north_africa', 'qatar': 'middle_east_north_africa',
  'kuwait': 'middle_east_north_africa', 'bahrain': 'middle_east_north_africa',
  'oman': 'middle_east_north_africa', 'jordan': 'middle_east_north_africa',
  'lebanon': 'middle_east_north_africa', 'syria': 'middle_east_north_africa',
  'iraq': 'middle_east_north_africa', 'iran': 'middle_east_north_africa',
  'egypt': 'middle_east_north_africa', 'libya': 'middle_east_north_africa',
  'tunisia': 'middle_east_north_africa', 'algeria': 'middle_east_north_africa',
  'morocco': 'middle_east_north_africa',
  // East Asia
  'china': 'east_asia', 'japan': 'east_asia', 'south korea': 'east_asia',
  'korea': 'east_asia', 'taiwan': 'east_asia', 'vietnam': 'east_asia',
  'thailand': 'east_asia', 'cambodia': 'east_asia', 'laos': 'east_asia',
  'myanmar': 'east_asia', 'malaysia': 'east_asia', 'singapore': 'east_asia',
  'indonesia': 'east_asia', 'philippines': 'east_asia',
  // Africa
  'nigeria': 'africa', 'ghana': 'africa', 'kenya': 'africa',
  'ethiopia': 'africa', 'tanzania': 'africa', 'uganda': 'africa',
  'south africa': 'africa', 'senegal': 'africa', 'mali': 'africa',
  'cameroon': 'africa', 'ivory coast': 'africa', "côte d'ivoire": 'africa',
  'mozambique': 'africa', 'zambia': 'africa', 'zimbabwe': 'africa',
  'rwanda': 'africa', 'somalia': 'africa', 'angola': 'africa',
  // Europe
  'germany': 'europe', 'france': 'europe', 'spain': 'europe',
  'italy': 'europe', 'portugal': 'europe', 'netherlands': 'europe',
  'belgium': 'europe', 'switzerland': 'europe', 'austria': 'europe',
  'sweden': 'europe', 'norway': 'europe', 'denmark': 'europe',
  'finland': 'europe', 'poland': 'europe', 'czech republic': 'europe',
  'hungary': 'europe', 'romania': 'europe', 'bulgaria': 'europe',
  'greece': 'europe', 'turkey': 'europe', 'russia': 'europe',
  'ukraine': 'europe', 'ireland': 'europe',
  // Australia/NZ
  'australia': 'australia_nz', 'new zealand': 'australia_nz',
};

/**
 * Look up regional guidance layer by country name or free-text region string.
 * Falls back to global IDF/WHO if no match found.
 */
export function getRegionalGuidance(countryOrRegion: string | null | undefined): RegionalGuidance {
  if (!countryOrRegion) return LAYERS.global;
  const key = countryOrRegion.toLowerCase().trim();
  const code = COUNTRY_TO_REGION[key];
  return code ? LAYERS[code] : LAYERS.global;
}

/**
 * Build a compact prompt snippet for injection into AI prompts.
 * Returns empty string if no meaningful regional layer found.
 */
export function buildRegionalPromptSnippet(
  countryOrRegion: string | null | undefined,
  opts?: { cuisineContext?: boolean }
): string {
  const guidance = getRegionalGuidance(countryOrRegion);
  if (guidance.code === 'global') return '';

  // cuisineContext: the value came from the user's cultural/heritage CUISINE,
  // not a stated location. Keep the cultural food guidance but never assert
  // where they live or give country-specific emergency numbers.
  if (opts?.cuisineContext) {
    const lines = [
      `Cultural cuisine context — ${guidance.label} cuisine (${guidance.source}). This reflects the user's FOOD heritage; their country of residence is unknown — do NOT say they are "based in" or "from" a country, and do NOT give country-specific emergency numbers.`,
      `  ${guidance.promptNote}`,
    ];
    if (guidance.nutritionNote) lines.push(`  Nutrition context: ${guidance.nutritionNote}`);
    return lines.join('\n');
  }

  const lines = [
    `Regional guidance layer — ${guidance.label} (${guidance.source}):`,
    `  ${guidance.promptNote}`,
  ];
  if (guidance.nutritionNote) lines.push(`  Nutrition context: ${guidance.nutritionNote}`);
  if (guidance.emergencyNote) lines.push(`  Emergency: ${guidance.emergencyNote}`);
  return lines.join('\n');
}

export { LAYERS };
