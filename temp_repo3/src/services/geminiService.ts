import { GoogleGenAI, Type } from "@google/genai";
import { CharacterResult } from "../types";
import { 
  genWebAI, 
  genSD, 
  getIljuUnique, 
  OH_MAP, 
  YY_MAP, 
  KR_CH, 
  KR_JI, 
  SEASON_MAP 
} from "../lib/saju_engine";
import sajuDb from "../lib/saju_db.json";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ANALYSIS_SYSTEM_INSTRUCTION = `
You are a master of Saju Myeongni (Four Pillars of Destiny) specialized in "Character Prompt Engineering".
Your goal is to generate a comprehensive character analysis and a highly specific AI image generation prompt.

**Saju Logic**:
- Core calculation based on Year, Month, Day, Hour (No Yaja-si).
- Primary identity determined by Il-ju (Day Pillar), Gender, and Wol-ji (Month Branch).

**Character Persona Logic**:
- **Personality**: Generate a detailed "Il-ju Personality" (일주 고유 성격) section. Describe how the Day Master (Il-gan) and Day Branch (Il-ji) interact to form a personality.
- **Visual Synthesis**: Map elemental composition to a character concept.

**AI Illustration Prompt Rules (CRITICAL - MUST INCLUDE IN THE PROMPT FIELD)**:
1. **Style**: Japanese Shonen Manga style (Modern), thick and clear line work, strong lighting/shadow contrast (Style of Naruto, Jujutsu Kaisen).
2. **Background**: Pure white (#FFFFFF) only. No background elements.
3. **Typography**: Top left corner must have the Il-ju text (e.g., "戊子") written small, not overlapping the character.
4. **Outfit**: Modern urban clothing. **STRICTLY FORBIDDEN**: Fantasy armor, Hanbok (Korean traditional), wings, horns, weapons (swords, staffs, etc.).
5. **Elemental Expression**: Reflect the Saju element colors ONLY via accessories or subtle outfit details (Wood=Green, Fire=Red, Earth=Gold, Metal=Gray, Water=Black).
6. **Pose**: Full-body standing, neutral stance. Minimal character-appropriate pose variation.
7. **Count**: Exactly one character.

**JSON Schema Requirements**:
- "sajuDetails": Provide Sip-sung (e.g., 정재), Un-seong (e.g., 태), Nap-eum (e.g., 벽력화), and Season (e.g., 가을).
- "personality": A multi-sentence description based on the Il-ju + Wol-ji.
- "illustrationPrompt": The final text for the user to copy/paste into an image generator, following all rules above.
`;

export async function analyzeDestiny(
  ilju: string, 
  gender: 'male' | 'female', 
  month: string, 
  age: string, 
  job: string
): Promise<CharacterResult> {
  // 1. Get base data from local DB
  const iu = getIljuUnique(sajuDb, ilju);
  const ch = ilju[0];
  const ji = ilju[1];
  const oh = OH_MAP[ch];
  const yy = YY_MAP[ch];
  const sj = month.match(/[가-힣]\((.+)\)/)?.[1] || month;

  // 2. Build direct prompts from repo logic
  const webPrompt = genWebAI(sajuDb, ilju, gender, age, month === '없음' ? null : month, job);
  const sdPrompt = genSD(sajuDb, ilju, gender, age, month === '없음' ? null : month, job);

  // 3. Use Gemini to create a polished narrative and archetype
  const prompt = `
    Based on the Saju data provided below, generate a polished character profile.
    
    [Saju Data]
    Il-ju: ${ilju} (${KR_CH[ch]}${KR_JI[ji]})
    Gender: ${gender}
    Month (Wol-ji): ${month}
    Age: ${age}
    Job: ${job}
    
    [DB Insights]
    Day Master Info: ${oh} (${yy})
    Unique Traits: ${iu['고유성격'] || 'None'}
    Life Star (12 Un-seong): ${iu['십이운성'] || 'None'}
    Ten Gods (Sip-sung): ${iu['일지십성'] || 'None'}
    
    Instruction:
    - Create a structured character profile.
    - Archetype: Create a cool title (e.g., "The Radiant Scholar") and description.
    - Personality: Write a detailed, polite analysis in Korean based on the DB insights.
    - Saju Details: Use the database values provided.
    
    IMPORTANT: Return ONLY valid JSON.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          archetype: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              traits: { type: Type.ARRAY, items: { type: Type.STRING } },
              potential: { type: Type.STRING },
            },
            required: ["title", "description", "traits", "potential"],
          },
          personality: { type: Type.STRING },
        },
        required: ["archetype", "personality"],
      },
    },
  });

  const text = response.text || '{}';
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const gResult = JSON.parse(cleaned);

    // 4. Merge Gemini narrative with DB-driven data
    return {
      pillars: {
        day: {
          stem: ch,
          branch: ji,
          element: oh,
          polarity: yy,
        },
      } as any,
      dayMaster: {
        element: `${oh} (${yy})`,
        polarity: yy,
        description: KR_CH[ch],
      },
      archetype: gResult.archetype,
      sajuDetails: {
        sipSung: iu['일지십성'] || "None",
        unSeong: iu['십이운성'] || "None",
        napEum: iu['납음'] || "None",
        season: SEASON_MAP[sj] || "None",
      },
      personality: gResult.personality || iu['고유성격'] || "분석 정보를 불러올 수 없습니다.",
      illustrationPrompt: {
        ko: webPrompt,
        en: sdPrompt,
      },
    };
  } catch (e) {
    console.error("Failed to parse Saju analysis JSON:", text);
    // Fallback if Gemini fails but we have DB data
    return {
      pillars: {} as any,
      dayMaster: { element: `${oh} (${yy})`, polarity: yy, description: KR_CH[ch] },
      archetype: { title: "분류 중", description: "", traits: [], potential: "" },
      sajuDetails: {
        sipSung: iu['일지십성'] || "None",
        unSeong: iu['십이운성'] || "None",
        napEum: iu['납음'] || "None",
        season: SEASON_MAP[sj] || "None",
      },
      personality: iu['고유성격'] || "분석 정보를 불러올 수 없습니다.",
      illustrationPrompt: {
        ko: webPrompt,
        en: sdPrompt,
      },
    };
  }
}

export async function generateCharacterImage(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `A high-quality, professional character illustration. Aesthetic: Mystical, mythic, detailed. Style: Digital painting with ethereal light. Subject: ${prompt}`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("Failed to generate image");
}
