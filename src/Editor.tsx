/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  User, 
  RefreshCw, 
  Zap, 
  Briefcase, 
  Copy, 
  CheckCircle2, 
  Clock, 
  Moon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CharacterResult } from './types';
import { analyzeDestiny, translatePromptToEnglish } from './services/geminiService';
import { cn } from './lib/utils';
import { 
  getGanjiHangul, 
  getJobList, 
  JobCategory,
  getOHColor, 
  genWebAI, 
  genSD, 
  getIljuUnique, 
  OH_MAP, 
  YY_MAP, 
  SEASON_MAP,
  KR_CH,
  KR_JI
} from './lib/saju_engine';
import sajuDb from './lib/saju_db.json';

const SIXTY_GANJI = [
  "甲子", "乙丑", "丙寅", "丁卯", "戊辰", "己巳", "庚午", "辛未", "壬申", "癸酉",
  "甲戌", "乙亥", "丙子", "丁丑", "戊寅", "己卯", "庚辰", "辛巳", "壬午", "癸未",
  "甲申", "乙酉", "丙戌", "丁亥", "戊子", "己丑", "庚寅", "辛卯", "壬辰", "癸巳",
  "甲午", "乙미", "丙申", "丁酉", "戊戌", "己亥", "庚子", "辛丑", "壬寅", "癸卯",
  "甲辰", "乙巳", "丙午", "丁미", "戊申", "己酉", "庚戌", "辛亥", "壬子", "癸丑",
  "甲寅", "乙卯", "丙辰", "丁巳", "戊午", "己未", "庚申", "辛酉", "壬戌", "癸亥"
];

// Correcting potential Hanja typos in the list from user's perspective
const CORRECT_SIXTY_GANJI = SIXTY_GANJI.map(g => g.replace('미', '未'));

const AGES = ["7~12세(10대미만)", "13~19세(10대)", "20대", "30대", "40대", "50대", "60대", "70대", "80대"];

const OH_TEXT_COLOR: Record<string, string> = {
  '목': 'text-emerald-500', // 초록
  '화': 'text-red-500',     // 빨강
  '토': 'text-amber-500',   // 밝은황토색
  '금': 'text-white',       // 흰색
  '수': 'text-[#6082B6]'    // 기존 slate-400보다 파란빛이 더 감도는 회푸른색(Glaucous)
};

const renderFormattedPrompt = (text: string) => {
  // Split by specific bullet or title markers to safely inject span
  const parts = text.split(/(■.*|【.*?】)/g);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('■')) {
      return (
        <span key={i} className="font-bold text-[15px] tracking-wide text-white/90">
          {part}
        </span>
      );
    }
    if (part.startsWith('【')) {
      return (
        <span key={i} className="font-normal text-[13px] tracking-wide text-white/90">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

export default function Editor() {
  const [selectedGanji, setSelectedGanji] = useState<string>("甲子");
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('female');
  const [selectedJob, setSelectedJob] = useState<string>("제외");
  const [selectedAge, setSelectedAge] = useState<string>("7~12세(10대미만)");
  const [selectedMonth, setSelectedMonth] = useState<string>("甲子");
  const [availableJobs, setAvailableJobs] = useState<JobCategory[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  const [promptLang, setPromptLang] = useState<'ko' | 'en'>('ko');
  const [copySuccess, setCopySuccess] = useState(false);

  const [translatedEnPrompt, setTranslatedEnPrompt] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [lastTranslatedKo, setLastTranslatedKo] = useState<string>('');

  // Derive Saju info reactively
  const currentIu = getIljuUnique(sajuDb, selectedGanji);
  const ch = selectedGanji[0];
  const oh = OH_MAP[ch];
  const yy = YY_MAP[ch];
  const sj = selectedMonth.match(/[가-힣]\((.+)\)/)?.[1] || selectedMonth;

  // Compute live prompts and data based on local DB logic
  const liveKoPrompt = genWebAI(sajuDb, selectedGanji, selectedGender, selectedAge, selectedMonth === '제외' ? null : selectedMonth, selectedJob);

  const handleLangSwitch = async (lang: 'ko' | 'en') => {
    setPromptLang(lang);
    if (lang === 'en' && lastTranslatedKo !== liveKoPrompt) {
      setIsTranslating(true);
      try {
        const enText = await translatePromptToEnglish(liveKoPrompt);
        setTranslatedEnPrompt(enText);
        setLastTranslatedKo(liveKoPrompt);
      } catch (e) {
        console.error(e);
        setTranslatedEnPrompt("Failed to translate prompt. Please try again.");
      } finally {
        setIsTranslating(false);
      }
    }
  };

  useEffect(() => {
    if (promptLang === 'en' && lastTranslatedKo !== liveKoPrompt) {
      const timer = setTimeout(() => {
        handleLangSwitch('en');
      }, 500); // debounce by 500ms
      return () => clearTimeout(timer);
    }
  }, [liveKoPrompt, promptLang, lastTranslatedKo]);

  useEffect(() => {
    const jobs = getJobList(sajuDb, selectedGanji, selectedMonth);
    setAvailableJobs(jobs);
    
    // 선택된 직업은 추천 목록과 무관하게 유지되도록 변경 (정합성 제한 제거)
  }, [selectedGanji, selectedMonth]);

  // 드롭다운 메뉴 (모든 직업군 표시)
  const filteredJobDropdown = useMemo(() => {
    const sheet40 = (sajuDb as any)['시트40_직업군_100매칭'];
    if (Array.isArray(sheet40)) {
      const groups: Record<string, any> = {};
      sheet40.forEach((j: any) => {
        const catName = j['카테고리'] || j.category || '기타';
        if (!groups[catName]) {
          groups[catName] = { 
            id: catName, 
            name: catName, 
            jobs: [] 
          };
        }
        groups[catName].jobs.push({
          code: j['ID'] || j['코드'] || j.id,
          name: j['직업명'] || j.name
        });
      });
      return Object.values(groups);
    }
    return (sajuDb as any).job_dropdown || [];
  }, []);

  // Group jobs by category
  const jobsByCategory = availableJobs.reduce((acc, job) => {
    if (!acc[job.category]) {
      acc[job.category] = [];
    }
    acc[job.category].push(job);
    return acc;
  }, {} as Record<string, JobCategory[]>);

  const categories = Object.keys(jobsByCategory);

  const handleCopy = () => {
    const text = promptLang === 'ko' ? liveKoPrompt : translatedEnPrompt || 'No translation available.';
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-sky-400/30 pb-24">
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        
        {/* 0. Title */}
        <div className="text-center py-8 relative">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-accent-gold tracking-[0.4em] uppercase mb-3"
          >
            사주 캐릭터 프롬프트 엔진
          </motion.h1>
        </div>

        <section className="space-y-10 bg-[#111] p-8 rounded-3xl border border-white/5 shadow-2xl">
          
          {/* 1. Gender Selection */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-accent-gold/60 uppercase tracking-widest flex items-center gap-2">
              <User className="w-3 h-3" /> 1. 성별 선택 (Select Gender)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {(['female', 'male'] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedGender(g)}
                  className={cn(
                    "py-5 rounded-2xl border-2 text-sm uppercase tracking-widest font-black transition-all",
                    selectedGender === g 
                      ? "bg-sky-400 text-white border-sky-400 shadow-lg" 
                      : "bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/30"
                  )}
                >
                  {g === 'female' ? '♀ 여성(FEMALE)' : '♂ 남성(MALE)'}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Age Selection */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-accent-gold/60 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3 h-3" /> 2. 나이대 선택 (Select Age)
            </h3>
            <div className="grid grid-cols-5 md:grid-cols-9 gap-1">
              {AGES.map(age => {
                const match = age.match(/(.*)\((.*)\)/);
                const displayMain = match ? match[2] : age;
                const displaySub = match ? `(${match[1]})` : null;
                return (
                  <button
                    key={age}
                    onClick={() => setSelectedAge(age)}
                    className={cn(
                      "py-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center min-h-[54px]",
                      selectedAge === age 
                        ? "bg-sky-400 text-white border-sky-400 shadow-md" 
                        : "bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/30"
                    )}
                  >
                    <span>{displayMain}</span>
                    {displaySub && <span className="text-[9px] opacity-60 leading-tight mt-0.5 font-normal">{displaySub}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Il-ju Selection */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-accent-gold/60 uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-3 h-3" /> 3. 일주 선택 (Select Il-ju / 60 Gan-ji)
            </h3>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-1">
              {CORRECT_SIXTY_GANJI.map(gj => (
                <button
                  key={gj}
                  onClick={() => setSelectedGanji(gj)}
                  className={cn(
                    "py-2 rounded-lg border transition-all flex flex-col items-center justify-center min-h-[54px]",
                    selectedGanji === gj 
                      ? "bg-sky-400 text-white border-sky-400 font-bold z-10 scale-105 shadow-xl" 
                      : "bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/30"
                  )}
                >
                  <span className="font-serif text-[14px] leading-none mb-1">{gj}</span>
                  <span className="text-[10px] opacity-80">({getGanjiHangul(gj)})</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Wol-ju Selection */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-accent-gold/60 uppercase tracking-widest flex items-center gap-2">
              <Moon className="w-3 h-3" /> 4. 월주 선택 (Select Wol-ju / 60 Gan-ji)
            </h3>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-1">
              {CORRECT_SIXTY_GANJI.map(gj => (
                <button
                  key={gj}
                  onClick={() => setSelectedMonth(gj)}
                  className={cn(
                    "py-2 rounded-lg border transition-all flex flex-col items-center justify-center min-h-[54px]",
                    selectedMonth === gj 
                      ? "bg-sky-400 text-white border-sky-400 font-bold z-10 scale-105 shadow-xl" 
                      : "bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/30"
                  )}
                >
                  <span className="font-serif text-[14px] leading-none mb-1">{gj}</span>
                  <span className="text-[10px] opacity-80">({getGanjiHangul(gj)})</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Job Selection */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-accent-gold/60 uppercase tracking-widest flex items-center gap-2">
              <Briefcase className="w-3 h-3" /> 5. 직업 선택 (Select Occupation)
            </h3>
            
            <div className="grid grid-cols-6 lg:grid-cols-6 gap-2 relative z-20">
              <div className="relative flex">
                <button
                  key="제외"
                  onClick={() => {
                    setSelectedJob("제외");
                    setExpandedCategory(null);
                  }}
                  className={cn(
                    "w-full h-full min-h-[75px] p-2 rounded-lg border transition-all flex flex-col items-center justify-center text-center",
                    selectedJob === "제외" 
                      ? "bg-stone-500 text-white border-stone-500 shadow-md" 
                      : "bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/30"
                  )}
                >
                  <span className="text-xs font-bold leading-tight break-keep">비주얼 설정<br/>제외</span>
                </button>
              </div>

              {filteredJobDropdown.map((group) => {
                const selectedJobObj = group.jobs.find(j => j.code === selectedJob);
                const isSelected = !!selectedJobObj;

                return (
                  <div key={group.id} className="relative flex">
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === group.id ? null : group.id)}
                      className={cn(
                        "w-full h-full min-h-[75px] p-2 rounded-lg border transition-all flex flex-col items-center justify-center text-center gap-1 relative",
                        isSelected 
                          ? "bg-sky-400 text-white border-sky-400 shadow-md" 
                          : "bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/30"
                      )}
                    >
                      <div className="text-xs font-bold leading-tight flex flex-col items-center justify-center gap-0.5">
                        {(() => {
                          const parts = group.name.split('·');
                          if (parts.length <= 1) {
                            return (
                              <span className="flex items-center justify-center break-keep">
                                {group.name} <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                              </span>
                            );
                          }
                          
                          let bestSplitIdx = 0;
                          let minDiff = Infinity;
                          let currentLen = 0;
                          const totalLen = group.name.length;
                          
                          for (let i = 0; i < parts.length - 1; i++) {
                            currentLen += parts[i].length + 1;
                            const diff = Math.abs((totalLen - currentLen) - currentLen);
                            if (diff < minDiff) {
                              minDiff = diff;
                              bestSplitIdx = i;
                            }
                          }
                          
                          const line1 = parts.slice(0, bestSplitIdx + 1).join('·') + '·';
                          const line2 = parts.slice(bestSplitIdx + 1).join('·');
                          
                          return (
                            <>
                              <span className="flex items-center justify-center break-keep">{line1}</span>
                              <span className="flex items-center justify-center break-keep">
                                {line2} <ChevronDown className="inline-block w-3 h-3 opacity-60 ml-0.5" />
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      {isSelected && (
                        <span className="text-[9px] text-white/90 font-black bg-black/20 px-1.5 py-0.5 rounded break-keep w-full whitespace-normal">
                          {selectedJobObj.name}
                        </span>
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {expandedCategory === group.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[160px] max-h-[300px] overflow-y-auto custom-scrollbar bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-[100] p-1.5 flex flex-col gap-1"
                        >
                          {group.jobs.map(job => (
                            <button
                              key={job.code}
                              onClick={() => {
                                setSelectedJob(job.code);
                                setExpandedCategory(null);
                              }}
                              className={cn(
                                "w-full text-center p-2.5 rounded-lg text-[11px] font-bold transition-all border",
                                selectedJob === job.code
                                  ? "bg-sky-400 text-white border-sky-400"
                                  : "bg-black/40 text-white/50 border-white/5 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              {job.name}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. Saju Profile Section - Fully Reactive */}
        <div className="space-y-8 mt-12">
          <motion.div 
            key={`${selectedGanji}-${selectedGender}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#050505] p-10 rounded-3xl border border-white/5 space-y-8"
          >
            {/* Large Il-ju Display */}
            <div className="flex items-baseline gap-4">
              <h2 className={cn("text-6xl font-serif font-bold tracking-tighter", OH_TEXT_COLOR[oh] || "text-orange-500")}>
                {selectedGanji}
              </h2>
              <div className="text-xl text-white/40 font-medium">
                {KR_CH[selectedGanji[0]]}({selectedGanji[0]})+{KR_JI[selectedGanji[1]]}({selectedGanji[1]})
              </div>
            </div>

            {/* Visual Saju Tags (Chips) */}
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold flex items-center gap-2">
                <span className="text-orange-400">오행</span>
                <span className="text-white/80">{oh}</span>
              </span>
              <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold flex items-center gap-2">
                <span className="text-yellow-500">음양</span>
                <span className="text-white/80">{yy}</span>
              </span>
              <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold flex items-center gap-2">
                <span className="text-fuchsia-500">운성</span>
                <span className="text-white/80">{currentIu['십이운성']}</span>
              </span>
              <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold flex items-center gap-2">
                <span className="text-sky-400">십성</span>
                <span className="text-white/80">{currentIu['일지십성']}</span>
              </span>
              <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold flex items-center gap-2">
                <span className="text-orange-600">납음</span>
                <span className="text-white/80">{currentIu['납음']}</span>
              </span>
            </div>
          </motion.div>

          {/* Real-time Summary & Prompts */}
          <div className="bg-[#111] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            {/* Real-time Summary Header */}
            <div className="p-8 bg-black/40 border-b border-white/10">
              <div className="flex items-center gap-2 text-[10px] font-black text-accent-gold uppercase tracking-[0.3em] mb-6 opacity-60">
                <RefreshCw className="w-3 h-3" />
                <span>Real-time Selection Summary | 현재 선택된 정보</span>
              </div>
              <div className="flex flex-wrap gap-3 mb-4">
                <SummaryChip label="Il-ju" value={`${selectedGanji} (${getGanjiHangul(selectedGanji)})`} color="gold" />
                <SummaryChip label="Gender" value={selectedGender === 'female' ? '여성(♀)' : '남성(♂)'} color="rose" />
                <SummaryChip label="Age" value={selectedAge} color="sky" />
                <SummaryChip label="Month" value={selectedMonth} color="emerald" />
                <SummaryChip label="Occupation" value={selectedJob} color="orange" />
              </div>
              {availableJobs.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <span className="text-[10px] font-bold text-white/40 block mb-2 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-accent-gold" /> 추천 직업군 ({availableJobs.length})
                  </span>
                  <div className="text-[11px] text-white/60 leading-relaxed font-medium break-keep">
                    {availableJobs.map(j => j.name).join(', ')}
                  </div>
                </div>
              )}
            </div>

            {/* Dual Prompt Toggles & Content */}
            <div className="p-10 space-y-8">
              <div className="flex bg-black/40 p-1.5 rounded-2xl w-fit mx-auto border border-white/5">
                <button 
                  onClick={() => setPromptLang('ko')}
                  className={cn(
                    "px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                    promptLang === 'ko' ? "bg-sky-400 text-white shadow-lg" : "text-white hover:bg-white/10"
                  )}
                >
                  Korean ver.
                </button>
                <button 
                  onClick={() => handleLangSwitch('en')}
                  className={cn(
                    "px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                    promptLang === 'en' ? "bg-sky-400 text-white shadow-lg" : "text-white hover:bg-white/10"
                  )}
                >
                  {isTranslating ? 'Translating...' : 'English ver.'}
                </button>
              </div>

              <div className="relative group">
                <div className="p-8 bg-black/80 border border-white/10 rounded-2xl font-mono text-[11px] leading-relaxed text-white/60 min-h-[500px] max-h-[1000px] overflow-y-auto custom-scrollbar not-italic whitespace-pre-wrap">
                  {promptLang === 'en' && isTranslating ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50 pt-20">
                      <div className="w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
                      <p>AI가 영문 프롬프트로 번역 중입니다...</p>
                    </div>
                  ) : (
                    renderFormattedPrompt(promptLang === 'ko' ? liveKoPrompt : (translatedEnPrompt || 'Please translate first.'))
                  )}
                </div>
              </div>

              <button 
                onClick={handleCopy}
                className="w-max mx-auto px-12 py-4 bg-sky-400 hover:bg-sky-500 text-white rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-3 font-black text-lg uppercase tracking-[0.2em]"
              >
                {copySuccess ? (
                  <>
                    <CheckCircle2 className="w-6 h-6" />
                    <span>Copied Successfully!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-6 h-6" />
                    <span>Copy Prompt (프롬프트 복사하기)</span>
                  </>
                )}
              </button>
            </div>

            {/* AI Rules Footer */}
            <div className="px-10 py-8 bg-black/20 border-t border-white/5 opacity-40">
              <h4 className="text-[10px] font-black text-white/50 mb-4 flex items-center gap-2 uppercase tracking-widest">
                <Zap className="w-3 h-3 text-accent-gold" /> AI 이미지 생성 규칙 (Must Follow Rules)
              </h4>
              <ul className="text-[9px] text-white/60 space-y-2 list-disc list-inside leading-relaxed uppercase tracking-wider">
                <li>스타일: 일본 소년만화 현대물 (NARUTO, JUJUTSU KAISEN 스타일)</li>
                <li>배경: 순수 흰색(#FFFFFF)만 허용</li>
                <li>텍스트: 좌측 상단에 "{selectedGanji}" 한글 표시 금지, 한자만 작게</li>
                <li>의상: 현대적 의상 (판타지/전통의상 장식 절대 금지)</li>
              </ul>
            </div>
          </div>
        </div>

      </main>
      
      <footer className="text-center text-[9px] text-white/10 uppercase tracking-[0.4em] font-medium py-12">
        © 2026 Saju Character Studio • Cosmic Prompt Engine v3
      </footer>
    </div>
  );
}

function SummaryChip({ label, value, color }: { label: string, value: string, color: string }) {
  const colorMap: Record<string, string> = {
    gold: "bg-accent-gold/10 border-accent-gold text-accent-gold",
    rose: "bg-rose-500/10 border-rose-500 text-rose-500",
    sky: "bg-sky-500/10 border-sky-500 text-sky-500",
    emerald: "bg-emerald-500/10 border-emerald-500 text-emerald-500",
    orange: "bg-orange-500/10 border-orange-500 text-orange-400"
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[7px] text-white/20 uppercase font-black px-1 tracking-widest">{label}</span>
      <span className={cn("px-3 py-1.5 border rounded-lg text-[10px] font-bold", colorMap[color])}>
        {value}
      </span>
    </div>
  );
}
