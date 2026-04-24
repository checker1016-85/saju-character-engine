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

export function getDNA(db: any, ilju: string) {
  return db.dna?.[ilju] || {};
}

export function getDNACommon(db: any, ilju: string) {
  return getDNA(db, ilju).common || {};
}

export function getDNAGender(db: any, ilju: string, gender: 'male' | 'female') {
  return getDNA(db, ilju)[gender] || {};
}

export function getGenderTraits(db: any, ch: string, gender: 'male' | 'female') {
  const traits = db.gender_traits || {};
  const key = `${ch}_${gender === 'male' ? '남' : '녀'}`;
  return traits[key] || {};
}

export function getIljuUnique(db: any, ilju: string) {
  const uniques = db.ilju_unique || {};
  return uniques[ilju] || {};
}

export function getWoljuTraits(db: any, wolju: string) {
  const months = db.month_correction || {};
  const ji = wolju[1];
  return months[ji] || {};
}

export function getAgeCorrection(db: any, age: string) {
  const sheet = db['시트52_나이대_보정'] || [];
  if (!Array.isArray(sheet)) return {};
  return sheet.find((r: any) => r['나이대'] === age || r['연령대'] === age) || {};
}

export interface JobCategory {
  id: string;
  name: string;
  category: string;
  keywords: string[];
}

export function getJobList(db: any, ilju: string, wolju: string): JobCategory[] {
  const result: JobCategory[] = [];
  const seen = new Set<string>();

  const iljuSheet = db['시트22_일주_직업매칭'] || db.ilju_to_jobs || [];
  const woljuSheet = db['시트31_월주_직업매칭'] || db.branch_to_jobs || [];
  const categories = db['시트40_직업군_100매칭'] || db.job_categories_100 || [];

  let iljuJobIds: string[] = [];
  if (Array.isArray(iljuSheet)) {
    const row = iljuSheet.find((r: any) => r['일주'] === ilju);
    iljuJobIds = row ? (row['직업코드'] || row['jobs'] || '').split(',').map((s: string) => s.trim()) : [];
  } else {
    iljuJobIds = iljuSheet[ilju] || [];
  }

  let woljuJobIds: string[] = [];
  if (Array.isArray(woljuSheet)) {
    const row = woljuSheet.find((r: any) => r['월주'] === wolju || r['월지'] === (wolju ? wolju[1] : ''));
    woljuJobIds = row ? (row['직업코드'] || row['jobs'] || '').split(',').map((s: string) => s.trim()) : [];
  } else {
    woljuJobIds = woljuSheet[wolju] || [];
  }
  
  const allIds = new Set([...iljuJobIds, ...woljuJobIds]);

  for (const cat of categories) {
    const cid = cat.id || cat['ID'] || cat['코드'];
    if (allIds.has(cid)) {
      if (!seen.has(cid)) {
        seen.add(cid);
        result.push({
          id: cid,
          name: cat.name || cat['직업명'],
          category: cat.category || cat['카테고리'],
          keywords: Array.isArray(cat.keywords) ? cat.keywords : (cat.keywords || cat['키워드'] || '').split(',').map((s: string) => s.trim())
        });
      }
    }
  }

  return result;
}

export function genWebAI(db: any, il: string, g: 'male' | 'female', age: string, w: string | null, jobId: string) {
  const ch = il[0], ji = il[1];
  const oh = OH_MAP[ch], yy = YY_MAP[ch];
  const gkr = g === 'male' ? '남성' : '여성';

  const dnaG = getDNAGender(db, il, g);
  const dnaC = getDNACommon(db, il);
  const gt = getGenderTraits(db, ch, g);
  const iu = getIljuUnique(db, il);

  // Helper to safely get DNA value
  const getD = (key: string) => (dnaG[key] || dnaC[key] || '').trim();

  let t = `■ 반드시 지켜야 할 규칙
1. 메인 명령: 아래 설정을 기반으로 **주술회전 화풍의 손그림 스타일**(선이 굵고 명암 대비가 강한 스타일)의 캐릭터 일러스트를 전신으로 그려주세요.
2. 전신 묘사: 반드시 머리부터 발끝까지 모두 나오는 전신(Full Body) 구도로 그려주세요.
3. 배경: 순수 흰색(#FFFFFF)만.
4. 텍스트 표기: 왼쪽 상단에 "${il}" 텍스트를 작게 표기.
5. 의상 제약: 현대물 기준 의상. 판타지 갑옷·한복·날개·뿔·무기 금지.
6. 오행 컨셉: 오행의 컨셉은 중국이나 일본 스타일을 절대 피해야 하며, 반드시 한국적이거나 차라리 오리지널 한국 현대물 기준이어야 합니다.

■ 기본 정보
- 일주: ${il} (${KR_CH[ch]}${KR_JI[ji]}) | 오행: ${oh}(${yy}) | 12운성: ${iu['십이운성']||''} | 일지십성: ${iu['일지십성']||''}
- 성별: ${gkr} | 연령대: ${age}
- 납음: ${iu['납음']||''} — ${iu['납음해석']||''}\n`;

  if (w) {
    const wt = getWoljuTraits(db, w);
    const r = checkRelation(ji, w[1]);
    t += `- 월지: ${w[1]} | 계절: ${wt['계절'] || SEASON_MAP[w[1]] || ''} | 분위기: ${wt['설명'] || SEASON_MOOD[w[1]] || ''}\n`;
    if (r.t) t += `- 일지·월지 관계: ${r.d}(${r.pk})\n`;
  }

  const ageCorr = getAgeCorrection(db, age);
  if (ageCorr['보정프롬프트'] || ageCorr['설명']) {
    t += `【연령대 특징】 ${ageCorr['보정프롬프트'] || ageCorr['설명']}\n`;
  }

  t += `\n■ 성격·기질
【일주 고유 성격】
${iu['고유성격'] || ''}

【${gkr} 성격 특징】
${(gt['성격분기'] || getD('H1_표정온도')).trim()}

【분위기·존재감】
${getD('H2_분위기')}

【감정의 중력】
${getD('H5_감정중력')}

【관계 패턴】
${gt['관계패턴'] || ''}

■ 캐릭터 외형 상세
【체형·골격】
${getD('A1_골격')}

【실루엣·자세】
${getD('A2_체형')}

【얼굴형】
${getD('B1_얼굴형')}

【눈·눈빛】
${getD('B2_눈')}

【감정 고조 시 눈빛 변화】
${getD('B3_이면눈매')}
→ 전투/각성이 아닌, 결의·분노·감동 등 감정이 고조될 때의 눈빛 변화로 해석.

【눈썹】
${getD('B4_눈썹')}

【코】
${getD('B5_코')}

【입】
${getD('B6_입')}

【얼굴 음영】
${getD('B7_얼굴음영')}

【피부톤·질감】
${getD('C1_피부톤')}

【헤어 스타일】
${getD('D1_헤어')}

【머리카락 물리】
${getD('D2_머리물리')}

【수염·체모】
${g === 'male' ? getD('D3_수염') : '없음'}

■ 의상·스타일
【의복·핏】
${getD('E1_의복핏')}

【상의】
${getD('E2_상의')}

【하의】
${getD('E3_하의')}

【신발】
${getD('E5_신발')}
`;

  if (jobId !== '제외') {
    const categories = db.job_categories_100 || [];
    const jobCat = categories.find((c: any) => c.id === jobId);
    if (jobCat) {
      t += `
【직업 특성】
직업군: ${jobCat.category} - ${jobCat.name}
키워드: ${jobCat.keywords?.join(', ')}
오행: ${jobCat.oheng} | 십성: ${jobCat.sipsung} | 기질: ${jobCat.gijil}
${jobCat.teukgyeok ? `특이사항: ${jobCat.teukgyeok}` : ''}
`;
    }
  }

  t += `
【${gkr} 스타일 방향】
${gt['스타일분기'] || ''}

■ 오행 장식·디테일
【머리·얼굴 포인트】
${getD('F1_머리악세')}

【몸·의상 포인트】
${getD('F2_몸악세')}

【문양·모티프】
${getD('F5_인장문양')}

【오행 컬러 악센트】
${getD('G2_이펙트컬러')}

■ 표정·포즈·연출
【표정 온도】
${dnaC['H1_표정온도'] || ''}

【시그니처 제스처】
${getD('H3_제스처')}
`;

  return t;
}

export function genSD(db: any, il: string, g: 'male' | 'female', age: string, w: string | null, jobId: string) {
  const ch = il[0], ji = il[1];
  const oh = OH_MAP[ch], yy = YY_MAP[ch];
  const gkr = g === 'male' ? 'Male' : 'Female';

  const dnaG = getDNAGender(db, il, g);
  const dnaC = getDNACommon(db, il);
  const gt = getGenderTraits(db, ch, g);
  const iu = getIljuUnique(db, il);

  // Helper to safely get DNA value
  const getD = (key: string) => (dnaG[key] || dnaC[key] || '').trim();

  let t = `■ STRICT RULES (Must Follow)
1. Main Instruction: Please draw a full-body character illustration based on the settings below in **Jujutsu Kaisen hand-drawn style** (bold lines, strong contrast).
2. Full Body: MUST draw the character in full body (from head to toe).
3. Background: Pure white (#FFFFFF) ONLY.
4. Text: Place "${il}" in small text in the top-left corner.
5. Outfit Constraint: Modern contemporary outfits only. NO fantasy armor, traditional garments, wings, horns, or weapons.
6. Concept Constraint: Avoid Chinese or Japanese styles for elemental concepts. Must strictly follow Korean traditional or original Korean contemporary styles.

■ Basic Information
- Il-ju: ${il} (${KR_CH[ch]}${KR_JI[ji]}) | Elements: ${oh}(${yy}) | 12 Phases: ${iu['십이운성']||''} | Stars: ${iu['일지십성']||''}
- Gender: ${gkr} | Age Group: ${age}
- Nabeum (Melody): ${iu['납음']||''} — ${iu['납음해석']||''}\n`;

  if (w) {
    const wt = getWoljuTraits(db, w);
    const r = checkRelation(ji, w[1]);
    t += `- Month (Wol-ju): ${w} (${getGanjiHangul(w)}) | Season: ${wt['계절'] || SEASON_MAP[w[1]]} | Mood: ${wt['설명'] || SEASON_MOOD[w[1]]}\n`;
    if (r.t) t += `- Relation: ${r.d}(${r.pk})\n`;
  }

  const ageCorr = getAgeCorrection(db, age);
  if (ageCorr['영어보정'] || ageCorr['description']) {
    t += `【Age Traits】 ${ageCorr['영어보정'] || ageCorr['description']}\n`;
  }

  t += `\n■ Personality & Temperament
【Unique Personality】
${iu['고유성격'] || ''}

【${gkr} Personality】
${(gt['성격분기'] || getD('H1_표정온도')).trim()}

【Atmosphere & Presence】
${getD('H2_분위기')}

【Emotional Gravity】
${getD('H5_감정중력')}

【Relationship Pattern】
${gt['관계패턴'] || ''}

■ Character Appearance Details
【Body Type & Skeleton】
${getD('A1_골격')}

【Silhouette & Posture】
${getD('A2_체형')}

【Face Shape】
${getD('B1_얼굴형')}

【Eyes & Gaze】
${getD('B2_눈')}

【Gaze During Emotional Peak】
${getD('B3_이면눈매')}
→ Used when emotions (resolve, anger, awe) run high.

【Eyebrows】
${getD('B4_눈썹')}

【Nose】
${getD('B5_코')}

【Mouth】
${getD('B6_입')}

【Facial Shadows】
${getD('B7_얼굴음영')}

【Skin Tone & Texture】
${getD('C1_피부톤')}

【Hair Style】
${getD('D1_헤어')}

【Hair Physics】
${getD('D2_머리물리')}

【Beard / Facial Hair】
${g === 'male' ? getD('D3_수염') : 'None'}

■ Outfit & Style
【Fit & Silhouette】
${getD('E1_의복핏')}

【Top】
${getD('E2_상의')}

【Bottom】
${getD('E3_하의')}

【Shoes】
${getD('E5_신발')}
`;

  if (jobId !== '제외') {
    const categories = db.job_categories_100 || [];
    const jobCat = categories.find((c: any) => c.id === jobId);
    if (jobCat) {
      t += `
【Occupation Traits】
Category: ${jobCat.category} - ${jobCat.name}
Keywords: ${jobCat.keywords?.join(', ')}
Elements: ${jobCat.oheng} | Stars: ${jobCat.sipsung} | Temperament: ${jobCat.gijil}
${jobCat.teukgyeok ? `Note: ${jobCat.teukgyeok}` : ''}
`;
    }
  }

  t += `
【${gkr} Style Direction】
${gt['스타일분기'] || ''}

■ Elemental Accessories & Details
【Head / Face Point】
${getD('F1_머리악세')}

【Body / Outfit Point】
${getD('F2_몸악세')}

【Motif / Pattern】
${getD('F5_인장문양')}

【Color Accent】
${getD('G2_이펙트컬러')}

■ Expression, Pose, & Direction
【Expression Temp】
${dnaC['H1_표정온도'] || ''}

【Signature Gesture】
${getD('H3_제스처')}
`;

  return t;
}
