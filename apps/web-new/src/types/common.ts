/**
 * Common utility types used throughout the application
 */

export type Person = 'A' | 'B';

export type YesMaybeNo = 'YES' | 'MAYBE' | 'NO';

export type RiskLevel = 'A' | 'B' | 'C';

export type QuestionSchema =
  | 'consent_rating'
  | 'scale_1_10'
  | 'scale_1_5'
  | 'scale'  // Generic scale
  | 'slider' // Slider variant
  | 'enum'
  | 'multi'
  | 'text'
  | 'bool'
  | 'scenario';

/**
 * Valid tags for categorizing questions
 */
export const VALID_TAGS = new Set([
  // Acts
  'kissing',
  'touching',
  'oral',
  'penetration',
  'anal',
  'handjob',
  'fingering',
  'rimming',
  'fisting',
  'sex',
  // Dynamics
  'dominance',
  'submission',
  'switch',
  'control',
  'lead',
  'follow',
  'service',
  'worship',
  'humiliation',
  'degradation',
  'praise',
  'discipline',
  // Toys & Gear
  'toys',
  'vibrator',
  'plug',
  'dildo',
  'strap-on',
  'rope',
  'restraint',
  'bondage',
  'cuffs',
  'gag',
  'blindfold',
  'hood',
  'collar',
  'leash',
  'gear',
  'material',
  'latex',
  'leather',
  // Risk / Sensation
  'breath',
  'breathplay',
  'impact',
  'spanking',
  'pain',
  'sensation',
  'temperature',
  'wax',
  'ice',
  'edge',
  'edging',
  'cnc',
  'fear',
  'choking',
  'blood',
  'needles',
  // Context / Social
  'public',
  'voyeur',
  'exhibition',
  'group',
  'threesome',
  'partner_swap',
  'soft_swap',
  'privacy',
  'digital',
  'recording',
  // Body
  'feet',
  'hands',
  'bodyparts',
  'fluids',
  'watersports',
  'scat',
  'spit',
  'cum',
  'period',
  'lactation',
  // Logistics / Meta
  'time',
  'stress',
  'coping',
  'aftercare',
  'safety',
  'rules',
  'negotiation',
  'communication',
  'boundaries',
  'review',
  'planning',
  'money',
  // ... (additional tags abbreviated for brevity)
  'satisfaction',
  'consent',
  'intimacy',
  'kink',
] as const);

export type Tag = (typeof VALID_TAGS extends Set<infer T> ? T : never) | string;
