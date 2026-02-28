// Pitch Tip Detector — identify pitchers who may be tipping pitches

export interface TipIndicator {
  indicator: string;
  confidence: number;      // 0-100
  description: string;
  evidenceCount: number;
}

export interface PitcherTipProfile {
  name: string;
  role: 'SP' | 'RP' | 'CL';
  tipRisk: 'none' | 'low' | 'possible' | 'likely';
  overallConfidence: number;  // 0-100
  indicators: TipIndicator[];
  impactEstimate: string;
  recommendation: string;
}

export interface PitchTipDetectorData {
  teamName: string;
  pitchersAnalyzed: number;
  tippersFound: number;
  pitchers: PitcherTipProfile[];
}

export function getTipRiskColor(risk: string): string {
  if (risk === 'none') return '#22c55e';
  if (risk === 'low') return '#3b82f6';
  if (risk === 'possible') return '#f59e0b';
  return '#ef4444';
}

export function generateDemoPitchTipDetector(): PitchTipDetectorData {
  return {
    teamName: 'San Francisco Giants',
    pitchersAnalyzed: 8,
    tippersFound: 2,
    pitchers: [
      {
        name: 'Greg Thornton', role: 'SP', tipRisk: 'likely', overallConfidence: 78,
        impactEstimate: 'Opponents bat .312 when tip is active vs .255 normally',
        recommendation: 'Vary set position timing — work with pitching coach on glove position',
        indicators: [
          { indicator: 'Glove Height', confidence: 82, description: 'Glove held 2 inches higher on off-speed pitches', evidenceCount: 45 },
          { indicator: 'Set Timing', confidence: 72, description: 'Longer pause before breaking ball delivery', evidenceCount: 38 },
          { indicator: 'Head Position', confidence: 55, description: 'Slight head tilt toward 1B on fastball', evidenceCount: 22 },
        ],
      },
      {
        name: 'Derek Solis', role: 'RP', tipRisk: 'possible', overallConfidence: 52,
        impactEstimate: 'Opponents avg up .025 in suspected tip at-bats',
        recommendation: 'Monitor stretch delivery — consider randomizing pre-pitch routine',
        indicators: [
          { indicator: 'Leg Kick Timing', confidence: 58, description: 'Slightly faster leg kick on changeup', evidenceCount: 18 },
          { indicator: 'Arm Slot Variation', confidence: 45, description: 'Arm slot drops 3 degrees on slider', evidenceCount: 12 },
        ],
      },
      {
        name: 'Javier Castillo', role: 'SP', tipRisk: 'none', overallConfidence: 8,
        impactEstimate: 'No evidence of pitch tipping',
        recommendation: 'No action needed — excellent deception metrics',
        indicators: [],
      },
      {
        name: 'Colton Braithwaite', role: 'CL', tipRisk: 'low', overallConfidence: 22,
        impactEstimate: 'Minimal impact — velocity compensates for any minor tells',
        recommendation: 'Continue monitoring — not actionable yet',
        indicators: [
          { indicator: 'Grip Exposure', confidence: 28, description: 'Occasionally flashes grip change in glove', evidenceCount: 8 },
        ],
      },
    ],
  };
}
