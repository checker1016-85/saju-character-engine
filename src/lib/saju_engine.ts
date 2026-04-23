/**
 * Saju Character Prompt Engine Logic
 * Mirrored from the original GitHub repository data mapping.
 */

// Element & Polarity Mappings
export const OH_MAP: Record<string, string> = { 甲: '목', 乙: '목', 丙: '화', 丁: '화', 戊: '토', 己: '토', 庚: '금', 辛: '금', 壬: '수', 癸: '수' };
export const YY_MAP: Record<string, string> = { 甲: '양', 乙: '음', 丙: '양', 丁: '음', 戊: '양', 己: '음', 庚: '양', 辛: '음', 壬: '양', 癸: '음' };
export const KR_CH: Record<string, string> = { 甲: '갑', 乙: '을', 丙: '병', 丁: '정', 戊: '무', 己: '기', 庚: '경', 辛: '신', 壬: '임', 癸: '계' };
export const KR_JI: Record<string, string> = { 子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진', 巳: '사', 午: '오', 未: '미', 申: '신', 酉: '유', 戌: '술', 亥: '해' };
export const OC: Record<string, string> = { 목: '#2E7D32', 화: '#C62828', 토: '#cf7e0a', 금: '#546E7A', 수: '#1565C0' };
export const SEASON_MAP: Record<string, string> = { 寅: '봄', 卯: '봄', 辰: '봄(환절기)', 巳: '여름', 午: '여름', 未: '여름(환절기)', 申: '가을', 酉: '가을', 戌: '가을(환절기)', 亥: '겨울', 子: '겨울', 丑: '겨울(환절기)' };
export const SEASON_MOOD: Record<string, string> = { 寅: '생기·녹색·아침빛', 卯: '발랄·연두·봄볕', 辰: '흐림·황녹·환절기안개', 巳: '화사·적색·정오빛', 午: '강렬·주홍·한낮', 未: '무더위·황적·습한공기', 申: '서늘·금색·석양', 酉: '차가움·은백·달빛시작', 戌: '쓸쓸·갈색·저녁놀', 亥: '깊이·남색·한밤', 子: '은밀·흑청·자정', 丑: '인내·무광·새벽안개' };

export const getGanjiHangul = (ganji: string) => {
  const s = KR_CH[ganji[0]] || "";
  const b = KR_JI[ganji[1]] || "";
  return `${s}${b}`;
};

export const getOHColor = (ganji: string) => {
  const oh = OH_MAP[ganji[0]];
  return OC[oh] || '#A1A1A1';
};

const YK: Record<string, string> = { '子丑': '토', '丑子': '토', '寅亥': '목', '亥寅': '목', '卯戌': '화', '戌卯': '화', '辰酉': '금', '酉辰': '금', '巳申': '수', '申巳': '수', '午未': '토', '未午': '토' };
const CG = new Set(['子午', '午子', '丑未', '未丑', '寅申', '申寅', '卯酉', '酉卯', '辰戌', '戌辰', '巳亥', '亥巳']);

export function checkRelation(a: string, b: string) {
  const p = a + b;
  if (YK[p]) return { t: '육합', d: a + b + '합' + YK[p], pk: '조화롭고 안정된 에너지.' };
  if (CG.has(p)) return { t: '충', d: a + b + '충', pk: '내면의 긴장. 충돌하는 이중 에너지.' };
  return { t: '', d: '', pk: '' };
}

export function getDNA(db: any, ilju: string, gender: 'male' | 'female') {
  const d = db.dna[ilju];
  if (!d) return {};
  const com = d.common || {};
  const gen = gender === 'male' ? (d.male || {}) : (d.female || {});
  return { ...com, ...gen };
}

export function getDNACommon(db: any, ilju: string) {
  return (db.dna[ilju] || {}).common || {};
}

export function getDNAGender(db: any, ilju: string, gender: 'male' | 'female') {
  const d = db.dna[ilju];
  if (!d) return {};
  return gender === 'male' ? (d.male || {}) : (d.female || {});
}

export function getGenderTraits(db: any, ch: string, gender: 'male' | 'female') {
  const key = gender === 'male' ? '남' : '녀';
  return db.gender_traits[`${ch}_${key}`] || {};
}

export function getIljuUnique(db: any, ilju: string) {
  return db.ilju_unique[ilju] || {};
}

export interface JobCategory {
  id: string;
  name: string;
  category: string;
  keywords: string[];
}

export function getJobList(db: any, ilju: string, monthHanja: string): JobCategory[] {
  const result: JobCategory[] = [];
  const seen = new Set<string>();

  // Extract the raw branch character from month, e.g., "인(寅)" -> "寅"
  const wolji = monthHanja.match(/[가-힣]\((.+)\)/)?.[1] || monthHanja;

  const iljuJobIds = (db.ilju_to_jobs && db.ilju_to_jobs[ilju]) || [];
  const woljiJobIds = (db.branch_to_jobs && db.branch_to_jobs[wolji]) || [];
  
  const allIds = new Set([...iljuJobIds, ...woljiJobIds]);
  const categories = db.job_categories_100 || [];

  for (const cat of categories) {
    if (allIds.has(cat.id)) {
      if (!seen.has(cat.id)) {
        seen.add(cat.id);
        result.push(cat);
      }
    }
  }

  return result;
}

export function genWebAI(db: any, il: string, g: 'male' | 'female', w: string | null, jobId: string) {
  const ch = il[0], ji = il[1];
  const oh = OH_MAP[ch], yy = YY_MAP[ch];
  const gkr = g === 'male' ? '남성' : '여성';

  const dna = getDNA(db, il, g);
  const dnaG = getDNAGender(db, il, g);
  const dnaC = getDNACommon(db, il);
  const gt = getGenderTraits(db, ch, g);
  const iu = getIljuUnique(db, il);

  let t = `■ 반드시 지켜야 할 규칙\n`;
  t += `1. 메인 명령: 아래 설정을 기반으로 **일본 소년만화 스타일**(나루토, 주술회전 화풍 등 선이 굵고 명암 대비가 강한 스타일)의 캐릭터 일러스트를 그려주세요.\n`;
  t += `2. 배경: 순수 흰색(#FFFFFF)만.\n`;
  t += `3. 텍스트 표기: 왼쪽 상단에 "${il}" 텍스트를 작게 표기.\n`;
  t += `4. 의상 제약: 현대물 기준 의상. 판타지 갑옷·한복·날개·뿔·무기 금지.\n\n`;

  t += `■ 기본 정보\n`;
  t += `- 일주: ${il} (${KR_CH[ch]}${KR_JI[ji]}) | 오행: ${oh}(${yy}) | 12운성: ${iu['십이운성']||''} | 일지십성: ${iu['일지십성']||''}\n`;
  t += `- 성별: ${gkr}\n`;
  if (iu['납음']) t += `- 납음: ${iu['납음']} — ${iu['납음해석']||''}\n`;

  if (w) {
    const sj = w.match(/[가-힣]\((.+)\)/)?.[1] || w; // Extract hanja if exists
    const season = SEASON_MAP[sj] || '';
    const mood = SEASON_MOOD[sj] || '';
    const r = checkRelation(ji, sj);
    t += `- 월지: ${KR_JI[sj]}(${sj}) | 계절: ${season} | 분위기: ${mood}\n`;
    if (r.t) t += `  → 일지·월지 관계: ${r.d} — ${r.pk}\n`;
  }

  t += `\n■ 성격·기질\n`;
  if (iu['고유성격']) t += `【일주 고유 성격】\n${iu['고유성격']}\n\n`;
  
  const personality10 = (gt['성격분기'] || '').trim();
  const personalityDNA = (dnaG['H1_표정온도'] || '').trim();
  const personalitySource = personality10.length >= personalityDNA.length ? personality10 : personalityDNA;
  if (personalitySource) t += `【${gkr} 성격 특징】\n${personalitySource}\n\n`;

  const atmoCommon = (dnaC['H2_분위기'] || '').trim();
  const atmoGender = (dnaG['H2_분위기'] || '').trim();
  const atmosphere = atmoCommon.length >= atmoGender.length ? atmoCommon : atmoGender;
  if (atmosphere) t += `【분위기·존재감】\n${atmosphere}\n\n`;

  const emotion = (dna['H5_감정중력'] || '').trim();
  if (emotion) t += `【감정의 중력】\n${emotion}\n\n`;
  if (gt['관계패턴']) t += `【관계 패턴】\n${gt['관계패턴']}\n\n`;

  t += `■ 캐릭터 외형 상세\n`;
  const bodyDesc = (dnaG['A1_골격'] || dnaC['A1_골격'] || '').trim();
  const silhouette = (dnaG['A2_체형'] || dnaC['A2_체형'] || '').trim();
  if (bodyDesc) t += `【체형·골격】\n${bodyDesc}\n`;
  if (silhouette) t += `【실루엣·자세】\n${silhouette}\n`;

  const face = (dnaG['B1_얼굴형'] || dnaC['B1_얼굴형'] || '').trim();
  if (face) t += `【얼굴형】\n${face}\n`;

  const eyes = (dnaG['B2_눈'] || dnaC['B2_눈'] || '').trim();
  if (eyes) t += `【눈·눈빛】\n${eyes}\n`;

  const hiddenEyes = (dna['B3_이면눈매'] || '').trim();
  if (hiddenEyes) t += `【감정 고조 시 눈빛 변화】\n${hiddenEyes}\n→ 전투/각성이 아닌, 결의·분노·감동 등 감정이 고조될 때의 눈빛 변화로 해석.\n`;

  const brow = (dna['B4_눈썹'] || '').trim();
  if (brow) t += `【눈썹】\n${brow}\n`;

  const nose = (dna['B5_코'] || '').trim();
  const mouth = (dna['B6_입'] || '').trim();
  if (nose) t += `【코】\n${nose}\n`;
  if (mouth) t += `【입】\n${mouth}\n`;

  const faceShadow = (dna['B7_얼굴음영'] || '').trim();
  if (faceShadow) t += `【얼굴 음영】\n${faceShadow}\n`;

  const skin = (dnaG['C1_피부톤'] || dnaC['C1_피부톤'] || '').trim();
  if (skin) t += `【피부톤·질감】\n${skin}\n`;

  const hair = (dnaG['D1_헤어'] || dnaC['D1_헤어'] || '').trim();
  const hairPhysics = (dna['D2_머리물리'] || '').trim();
  if (hair) t += `【헤어 스타일】\n${hair}\n`;
  if (hairPhysics) t += `【머리카락 물리】\n${hairPhysics}\n`;

  if (g === 'male') {
    const beard = (dnaG['D3_수염'] || dnaC['D3_수염'] || '').trim();
    if (beard) t += `【수염·체모】\n${beard}\n`;
  }

  if (jobId !== '제외') {
    const categories = db.job_categories_100 || [];
    const jobCat = categories.find((c: any) => c.id === jobId);
    
    if (jobCat) {
      t += `\n■ 직업·의상\n`;
      t += `【직업군】 ${jobCat.category} - ${jobCat.name}\n`;
      t += `【관련 키워드】 ${jobCat.keywords?.join(', ')}\n`;
      t += `【직업 오행/기질】 오행: ${jobCat.oheng} | 십성: ${jobCat.sipsung} | 기질: ${jobCat.gijil}\n`;
      
      // Fallback to legacy job_visual if a direct match exists
      const fallbackVisualEntry = Object.entries(db.job_visual || {}).find(([key, v]: [string, any]) => jobCat.name.includes(key) || key.includes(jobCat.category.split('·')[0]));
      
      if (fallbackVisualEntry) {
        t += `【직업 비주얼】\n${(fallbackVisualEntry[1] as any).desc}\n`;
      } else {
        t += `【의상 및 스타일링】\n해당 직업(${jobCat.name})의 전문성과 키워드 분위기가 잘 드러나는 현대적인 의상을 캐릭터에 입혀주세요. 캐릭터의 오행 색상을 의상 포인트 컬러로 활용해주세요.\n`;
      }

      const top = (dnaG['E2_상의'] || dnaC['E2_상의'] || '').trim();
      if (top) t += `【오행 색감·소재 참고】\n${top}\n`;
    }
  } else {
    t += `\n■ 의상·스타일\n`;
    const outfit = (dnaG['E1_의복핏'] || dnaC['E1_의복핏'] || '').trim();
    const top = (dnaG['E2_상의'] || dnaC['E2_상의'] || '').trim();
    const bottom = (dnaG['E3_하의'] || dnaC['E3_하의'] || '').trim();
    const shoes = (dnaG['E5_신발'] || dnaC['E5_신발'] || '').trim();
    if (outfit) t += `【의복·핏】\n${outfit}\n`;
    if (top) t += `【상의】\n${top}\n`;
    if (bottom) t += `【하의】\n${bottom}\n`;
    if (shoes) t += `【신발】\n${shoes}\n`;
    if (gt['스타일분기']) t += `【${gkr} 스타일 방향】\n${gt['스타일분기']}\n`;
  }

  const headAcc = (dna['F1_머리악세'] || '').trim();
  const bodyAcc = (dna['F2_몸악세'] || '').trim();
  const pattern = (dna['F5_인장문양'] || '').trim();
  const effectColor = (dna['G2_이펙트컬러'] || '').trim();
  if (headAcc || bodyAcc || pattern || effectColor || true) {
     t += `\n■ 오행 장식·디테일\n`;
     if (headAcc) t += `【머리·얼굴 포인트】\n${headAcc}\n`;
     if (bodyAcc) t += `【몸·의상 포인트】\n${bodyAcc}\n`;
     if (pattern) t += `【문양·모티프】\n${pattern}\n`;
     if (effectColor) t += `【오행 컬러 악센트】\n${effectColor}\n`;
  }

  t += `\n■ 표정·포즈·연출\n`;
  const exprTemp = (dnaC['H1_표정온도'] || '').trim();
  if (exprTemp) t += `【표정 온도】\n${exprTemp}\n`;
  const gesture = (dnaG['H3_제스처'] || dnaC['H3_제스처'] || '').trim();
  if (gesture) t += `【시그니처 제스처】\n${gesture}\n`;

  return t;
}

export function genSD(db: any, il: string, g: 'male' | 'female', w: string | null, jobId: string) {
  const ch = il[0], ji = il[1];
  const oh = OH_MAP[ch], yy = YY_MAP[ch];
  const gkr = g === 'male' ? 'Male' : 'Female';

  const dna = getDNA(db, il, g);
  const dnaG = getDNAGender(db, il, g);
  const dnaC = getDNACommon(db, il);
  const gt = getGenderTraits(db, ch, g);
  const iu = getIljuUnique(db, il);

  let t = `■ STRICT RULES (Must Follow)\n`;
  t += `1. Main Instruction: Please draw a character illustration based on the settings below in **Japanese shonen manga style** (e.g., Naruto, Jujutsu Kaisen - bold lines, strong contrast).\n`;
  t += `2. Background: Pure white (#FFFFFF) ONLY.\n`;
  t += `3. Text: Place "${il}" in small text in the top-left corner.\n`;
  t += `4. Outfit Constraint: Modern contemporary outfits only. NO fantasy armor, traditional garments, wings, horns, or weapons.\n\n`;

  t += `■ Basic Information\n`;
  t += `- Il-ju: ${il} (${KR_CH[ch]}${KR_JI[ji]}) | Elements: ${oh}(${yy}) | 12 Phases: ${iu['십이운성']||''} | Stars: ${iu['일지십성']||''}\n`;
  t += `- Gender: ${gkr}\n`;
  if (iu['납음']) t += `- Nabeum (Melody): ${iu['납음']} — ${iu['납음해석']||''}\n`;

  if (w) {
    const sj = w.match(/[가-힣]\((.+)\)/)?.[1] || w; // Extract hanja if exists
    const season = SEASON_MAP[sj] || '';
    const mood = SEASON_MOOD[sj] || '';
    const r = checkRelation(ji, sj);
    t += `- Month (Wol-ji): ${KR_JI[sj]}(${sj}) | Season: ${season} | Mood: ${mood}\n`;
    if (r.t) t += `  → Relation (Il-ji to Wol-ji): ${r.d} — ${r.pk}\n`;
  }

  t += `\n■ Personality & Temperament\n`;
  if (iu['고유성격']) t += `【Unique Personality】\n${iu['고유성격']}\n\n`;
  
  const personality10 = (gt['성격분기'] || '').trim();
  const personalityDNA = (dnaG['H1_표정온도'] || '').trim();
  const personalitySource = personality10.length >= personalityDNA.length ? personality10 : personalityDNA;
  if (personalitySource) t += `【${gkr} Personality Traits】\n${personalitySource}\n\n`;

  const atmoCommon = (dnaC['H2_분위기'] || '').trim();
  const atmoGender = (dnaG['H2_분위기'] || '').trim();
  const atmosphere = atmoCommon.length >= atmoGender.length ? atmoCommon : atmoGender;
  if (atmosphere) t += `【Atmosphere & Presence】\n${atmosphere}\n\n`;

  const emotion = (dna['H5_감정중력'] || '').trim();
  if (emotion) t += `【Emotional Gravity】\n${emotion}\n\n`;
  if (gt['관계패턴']) t += `【Relationship Pattern】\n${gt['관계패턴']}\n\n`;

  t += `■ Character Appearance Details\n`;
  const bodyDesc = (dnaG['A1_골격'] || dnaC['A1_골격'] || '').trim();
  const silhouette = (dnaG['A2_체형'] || dnaC['A2_체형'] || '').trim();
  if (bodyDesc) t += `【Body Type & Skeleton】\n${bodyDesc}\n`;
  if (silhouette) t += `【Silhouette & Posture】\n${silhouette}\n`;

  const face = (dnaG['B1_얼굴형'] || dnaC['B1_얼굴형'] || '').trim();
  if (face) t += `【Face Shape】\n${face}\n`;

  const eyes = (dnaG['B2_눈'] || dnaC['B2_눈'] || '').trim();
  if (eyes) t += `【Eyes & Gaze】\n${eyes}\n`;

  const hiddenEyes = (dna['B3_이면눈매'] || '').trim();
  if (hiddenEyes) t += `【Gaze During Emotional Peak】\n${hiddenEyes}\n→ Used when emotions (resolve, anger, awe) run high.\n`;

  const brow = (dna['B4_눈썹'] || '').trim();
  if (brow) t += `【Eyebrows】\n${brow}\n`;

  const nose = (dna['B5_코'] || '').trim();
  const mouth = (dna['B6_입'] || '').trim();
  if (nose) t += `【Nose】\n${nose}\n`;
  if (mouth) t += `【Mouth】\n${mouth}\n`;

  const faceShadow = (dna['B7_얼굴음영'] || '').trim();
  if (faceShadow) t += `【Facial Shadows】\n${faceShadow}\n`;

  const skin = (dnaG['C1_피부톤'] || dnaC['C1_피부톤'] || '').trim();
  if (skin) t += `【Skin Tone & Texture】\n${skin}\n`;

  const hair = (dnaG['D1_헤어'] || dnaC['D1_헤어'] || '').trim();
  const hairPhysics = (dna['D2_머리물리'] || '').trim();
  if (hair) t += `【Hair Style】\n${hair}\n`;
  if (hairPhysics) t += `【Hair Physics】\n${hairPhysics}\n`;

  if (g === 'male') {
    const beard = (dnaG['D3_수염'] || dnaC['D3_수염'] || '').trim();
    if (beard) t += `【Beard / Facial Hair】\n${beard}\n`;
  }

  if (jobId !== '제외') {
    const categories = db.job_categories_100 || [];
    const jobCat = categories.find((c: any) => c.id === jobId);
    
    if (jobCat) {
      t += `\n■ Occupation & Outfit\n`;
      t += `【Job Category】 ${jobCat.category} - ${jobCat.name}\n`;
      t += `【Keywords】 ${jobCat.keywords?.join(', ')}\n`;
      t += `【Job Attributes】 Elements: ${jobCat.oheng} | Stars: ${jobCat.sipsung} | Temperament: ${jobCat.gijil}\n`;
      
      const fallbackVisualEntry = Object.entries(db.job_visual || {}).find(([key, v]: [string, any]) => jobCat.name.includes(key) || key.includes(jobCat.category.split('·')[0]));
      
      if (fallbackVisualEntry) {
        t += `【Visual Traits】\n${(fallbackVisualEntry[1] as any).desc}\n`;
      } else {
        t += `【Outfit & Styling Guidelines】\nPlease dress the character in a modern, professional outfit that reflects the expertise and mood of a ${jobCat.name}. Use the character's elemental color as a vibrant accent.\n`;
      }

      const top = (dnaG['E2_상의'] || dnaC['E2_상의'] || '').trim();
      if (top) t += `【Color & Material Reference】\n${top}\n`;
    }
  } else {
    t += `\n■ Outfit & Styling\n`;
    const outfit = (dnaG['E1_의복핏'] || dnaC['E1_의복핏'] || '').trim();
    const top = (dnaG['E2_상의'] || dnaC['E2_상의'] || '').trim();
    const bottom = (dnaG['E3_하의'] || dnaC['E3_하의'] || '').trim();
    const shoes = (dnaG['E5_신발'] || dnaC['E5_신발'] || '').trim();
    if (outfit) t += `【Fit & Style】\n${outfit}\n`;
    if (top) t += `【Top】\n${top}\n`;
    if (bottom) t += `【Bottom】\n${bottom}\n`;
    if (shoes) t += `【Shoes】\n${shoes}\n`;
    if (gt['스타일분기']) t += `【${gkr} Style Direction】\n${gt['스타일분기']}\n`;
  }

  const headAcc = (dna['F1_머리악세'] || '').trim();
  const bodyAcc = (dna['F2_몸악세'] || '').trim();
  const pattern = (dna['F5_인장문양'] || '').trim();
  const effectColor = (dna['G2_이펙트컬러'] || '').trim();
  if (headAcc || bodyAcc || pattern || effectColor) {
     t += `\n■ Elemental Accessories & Details\n`;
     if (headAcc) t += `【Head / Face Point】\n${headAcc}\n`;
     if (bodyAcc) t += `【Body / Outfit Point】\n${bodyAcc}\n`;
     if (pattern) t += `【Motif / Pattern】\n${pattern}\n`;
     if (effectColor) t += `【Color Accent】\n${effectColor}\n`;
  }

  t += `\n■ Expression, Pose, & Direction\n`;
  const exprTemp = (dnaC['H1_표정온도'] || '').trim();
  if (exprTemp) t += `【Expression Temp】\n${exprTemp}\n`;
  const gesture = (dnaG['H3_제스처'] || dnaC['H3_제스처'] || '').trim();
  if (gesture) t += `【Signature Gesture】\n${gesture}\n`;

  return t;
}
