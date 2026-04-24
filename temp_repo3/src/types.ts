/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Polarity = '+' | '-';

export interface SajuPillar {
  stem: string;
  branch: string;
  element: string;
  polarity: Polarity;
}

export interface CharacterResult {
  pillars: {
    year?: SajuPillar;
    month?: SajuPillar;
    day: SajuPillar;
    hour?: SajuPillar;
  };
  dayMaster: {
    element: string;
    polarity: string;
    description: string;
  };
  archetype: {
    title: string;
    description: string;
    traits: string[];
    potential: string;
  };
  sajuDetails: {
    sipSung: string;
    unSeong: string;
    napEum: string;
    season: string;
  };
  personality: string;
  illustrationPrompt: {
    en: string;
    ko: string;
  };
  imageUrl?: string;
}
