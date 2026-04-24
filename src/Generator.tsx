import React, { useState, useMemo, useEffect } from 'react';
import { Copy, CheckCircle2, Sparkles, ExternalLink } from 'lucide-react';
import { cn } from './lib/utils';
import { getJobList, genWebAI, JobCategory } from './lib/saju_engine';
import { translatePromptToEnglish } from './services/geminiService';
import sajuDb from './lib/saju_db.json';

const SIXTY_GANJI = [
  "甲子", "乙丑", "丙寅", "丁卯", "戊辰", "己巳", "庚午", "辛未", "壬申", "癸酉",
  "甲戌", "乙亥", "丙子", "丁丑", "戊寅", "己卯", "庚辰", "辛巳", "壬午", "癸未",
  "甲申", "乙酉", "丙戌", "丁亥", "戊子", "己丑", "庚寅", "辛卯", "壬辰", "癸巳",
  "甲午", "乙未", "丙申", "丁酉", "戊戌", "己亥", "庚子", "辛丑", "壬寅", "癸卯",
  "甲辰", "乙巳", "丙午", "丁未", "戊申", "己酉", "庚戌", "辛亥", "壬子", "癸丑",
  "甲寅", "乙卯", "丙辰", "丁巳", "戊午", "己未", "庚申", "辛酉", "壬戌", "癸亥"
];

const AGES = ["7~12세(10대미만)", "13~19세(10대)", "20대", "30대", "40대", "50대", "60대", "70대", "80대"];

const getGanjiHangul = (ganji: string) => {
  const map: Record<string, string> = {
    '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무', '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
    '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해'
  };
  return (map[ganji[0]] || '') + (map[ganji[1]] || '');
};

const CORRECT_SIXTY_GANJI = SIXTY_GANJI.map(g => g.replace('미', '未'));

const renderFormattedPrompt = (text: string) => {
  const parts = text.split(/(■.*|【.*?】)/g);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('■')) {
      return <span key={i} className="font-bold text-[14px] tracking-wide text-white/90">{part}</span>;
    }
    if (part.startsWith('【')) {
      return <span key={i} className="font-normal text-[13px] tracking-wide text-white/90">{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
};

export default function Generator() {
  const [selectedGanji, setSelectedGanji] = useState<string>("甲子");
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('female');
  const [selectedAge, setSelectedAge] = useState<string>("20대");
  const [selectedMonth, setSelectedMonth] = useState<string>("丙寅");
  const [selectedJob, setSelectedJob] = useState<string>("제외");
  const [promptLang, setPromptLang] = useState<'ko' | 'en'>('ko');
  const [copySuccess, setCopySuccess] = useState(false);
  
  const [translatedEnPrompt, setTranslatedEnPrompt] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [lastTranslatedKo, setLastTranslatedKo] = useState<string>('');

  const availableJobs = useMemo(() => getJobList(sajuDb, selectedGanji, selectedMonth), [selectedGanji, selectedMonth]);

  useEffect(() => {
    if (selectedJob !== '제외' && !availableJobs.find(j => j.id === selectedJob)) {
      setSelectedJob('제외');
    }
  }, [availableJobs, selectedJob]);

  const liveKoPrompt = useMemo(() => {
    return genWebAI(sajuDb, selectedGanji, selectedGender, selectedAge, selectedMonth === '제외' ? null : selectedMonth, selectedJob);
  }, [selectedGanji, selectedGender, selectedAge, selectedMonth, selectedJob]);

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
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [liveKoPrompt, promptLang, lastTranslatedKo]);

  const handleCopy = () => {
    const textToCopy = promptLang === 'ko' ? liveKoPrompt : (translatedEnPrompt || 'No translation available.');
    navigator.clipboard.writeText(textToCopy);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 pb-24 md:p-12 font-sans selection:bg-sky-400/30">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter flex items-center gap-2">
              <Sparkles className="text-sky-400" /> Saju Prompt Generator
            </h1>
            <p className="text-white/40 text-sm mt-2">Simplify your prompt generation instantly.</p>
          </div>
          <button 
            onClick={() => window.location.hash = '#/editor'}
            className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-white hover:text-sky-300 transition-colors bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10"
          >
            Go to Editor <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Controls */}
        <div className="bg-[#111] border border-white/5 p-6 rounded-3xl grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-2 col-span-2 md:col-span-1">
            <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">일주 (Il-ju)</label>
            <select
              className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-sky-400"
              value={selectedGanji}
              onChange={(e) => setSelectedGanji(e.target.value)}
            >
              {SIXTY_GANJI.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">성별 (Gender)</label>
            <select
              className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-sky-400"
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value as any)}
            >
              <option value="female">여성</option>
              <option value="male">남성</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">연령대 (Age)</label>
            <select
              className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-sky-400"
              value={selectedAge}
              onChange={(e) => setSelectedAge(e.target.value)}
            >
              {AGES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">월주 (Wol-ju / 60 Gan-ji)</label>
            <select
              className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-sky-400"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {CORRECT_SIXTY_GANJI.map((g) => <option key={g} value={g}>{g} ({getGanjiHangul(g)})</option>)}
            </select>
          </div>
          <div className="space-y-2 col-span-2 md:col-span-1">
            <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">직업군 (Job)</label>
            <select
              className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-sky-400"
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
            >
              <option value="제외">선택 안함</option>
              {Object.entries(
                (availableJobs as JobCategory[]).reduce((acc: Record<string, JobCategory[]>, job: JobCategory) => {
                  if (!acc[job.category]) acc[job.category] = [];
                  acc[job.category].push(job);
                  return acc;
                }, {} as Record<string, JobCategory[]>)
              ).map(([category, jobs]) => (
                <optgroup key={category} label={category}>
                  {jobs.map((j: JobCategory) => (
                    <option key={j.id} value={j.id}>{j.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* Output Area */}
        <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="flex bg-black/40 p-2 border-b border-white/5">
            <button 
              onClick={() => setPromptLang('ko')}
              className={cn(
                "flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-xl",
                promptLang === 'ko' ? "bg-sky-400 text-white shadow-lg" : "text-white bg-white/5 hover:bg-white/10"
              )}
            >
              Korean ver.
            </button>
            <button 
              onClick={() => handleLangSwitch('en')}
              className={cn(
                "flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-xl ml-2",
                promptLang === 'en' ? "bg-sky-400 text-white shadow-lg" : "text-white bg-white/5 hover:bg-white/10"
              )}
            >
              {isTranslating ? 'Translating...' : 'English ver.'}
            </button>
          </div>
          
          <div className="relative group">
            <div className="p-8 font-mono text-[11px] leading-relaxed text-white/60 min-h-[400px] h-[60vh] overflow-y-auto custom-scrollbar not-italic whitespace-pre-wrap">
              {promptLang === 'en' && isTranslating ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50 pt-20">
                  <div className="w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
                  <p>AI가 영문 프롬프트로 번역 중입니다...</p>
                </div>
              ) : (
                renderFormattedPrompt(promptLang === 'ko' ? liveKoPrompt : (translatedEnPrompt || 'Please translate first.'))
              )}
            </div>
            <button 
              onClick={handleCopy}
              className="absolute bottom-6 right-6 flex items-center gap-2 px-3 py-2 bg-sky-400 hover:bg-sky-300 text-white rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all shadow-[0_0_40px_rgba(56,189,248,0.2)] hover:shadow-[0_0_60px_rgba(56,189,248,0.4)] hover:-translate-y-1"
            >
              {copySuccess ? <><CheckCircle2 className="w-5 h-5" /> Copied!</> : <><Copy className="w-5 h-5" /> Copy Prompt</>}
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
