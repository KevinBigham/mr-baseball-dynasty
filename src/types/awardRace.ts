import type { AwardCandidate } from './league';

export interface AwardRaceLeagueCandidates {
  al: AwardCandidate[];
  nl: AwardCandidate[];
}

export interface AwardRaceData {
  mvp: AwardRaceLeagueCandidates;
  cyYoung: AwardRaceLeagueCandidates;
  roy: AwardRaceLeagueCandidates;
}

function emptyLeagueCandidates(): AwardRaceLeagueCandidates {
  return { al: [], nl: [] };
}

export function createEmptyAwardRaceData(): AwardRaceData {
  return {
    mvp: emptyLeagueCandidates(),
    cyYoung: emptyLeagueCandidates(),
    roy: emptyLeagueCandidates(),
  };
}

function normalizeLeagueCandidates(value: unknown): AwardRaceLeagueCandidates | null {
  if (!value || typeof value !== 'object') return null;

  const candidateGroup = value as Record<string, unknown>;
  if (!Array.isArray(candidateGroup.al) || !Array.isArray(candidateGroup.nl)) {
    return null;
  }

  return {
    al: candidateGroup.al as AwardCandidate[],
    nl: candidateGroup.nl as AwardCandidate[],
  };
}

export function normalizeAwardRaceData(value: unknown): AwardRaceData | null {
  if (!value || typeof value !== 'object') return null;

  const raw = value as Record<string, unknown>;
  const hasAwardRaceKeys = 'mvp' in raw || 'cyYoung' in raw || 'roy' in raw;
  const looksLikeLegacySeasonAwards =
    'alMVP' in raw ||
    'nlMVP' in raw ||
    'alCyYoung' in raw ||
    'nlCyYoung' in raw ||
    'mvpAL' in raw ||
    'mvpNL' in raw ||
    'cyYoungAL' in raw ||
    'cyYoungNL' in raw;

  if (!hasAwardRaceKeys && !looksLikeLegacySeasonAwards) {
    return null;
  }

  return {
    mvp: normalizeLeagueCandidates(raw.mvp) ?? emptyLeagueCandidates(),
    cyYoung: normalizeLeagueCandidates(raw.cyYoung) ?? emptyLeagueCandidates(),
    roy: normalizeLeagueCandidates(raw.roy) ?? emptyLeagueCandidates(),
  };
}
