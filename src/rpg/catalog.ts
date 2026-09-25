import { z } from 'zod';

export const RpgUnlockSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('hasRecord'),
    collection: z.enum([
      'id.sifa.profile.position',
      'id.sifa.profile.volunteering',
      'id.sifa.profile.presentation',
      'id.sifa.profile.education',
    ]),
  }),
  z.object({ kind: z.literal('hasExternalAccount'), platforms: z.array(z.string()).min(1) }),
  z.object({ kind: z.literal('usesApp'), appId: z.string().min(1) }),
  z.object({ kind: z.literal('hasDoctorate') }),
]);

export const RpgItemSchema = z.object({
  /** Lowercase `[a-z0-9_]` only: the id is embedded in an AT Protocol record key. */
  id: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_]+$/),
  title: z.string().max(100),
  description: z.string().max(500),
  kind: z.enum(['layer', 'held']),
  category: z.string().max(30),
  unlock: z.array(RpgUnlockSchema).min(1), // ANY of these unlocks the item
  enabled: z.boolean(),
});
export type RpgItem = z.infer<typeof RpgItemSchema>;
export type RpgUnlock = z.infer<typeof RpgUnlockSchema>;

/**
 * The Sifa item catalog for rpg.actor. PLACEHOLDER titles/categories until
 * rpg.actor transfers the real item cores.
 */
export const RPG_ITEMS: readonly RpgItem[] = [
  {
    id: 'sifa_power_suit',
    title: 'Power Suit',
    description: '',
    kind: 'layer',
    category: 'tops',
    enabled: true,
    unlock: [{ kind: 'hasRecord', collection: 'id.sifa.profile.position' }],
  },
  {
    id: 'sifa_weekend_shirt',
    title: 'Weekend Shirt',
    description: '',
    kind: 'layer',
    category: 'tops',
    enabled: true,
    unlock: [{ kind: 'hasRecord', collection: 'id.sifa.profile.volunteering' }],
  },
  {
    id: 'sifa_speaker_mic',
    title: 'Speaker Mic',
    description: '',
    kind: 'held',
    category: 'righthand',
    enabled: true,
    unlock: [{ kind: 'hasRecord', collection: 'id.sifa.profile.presentation' }],
  },
  {
    id: 'sifa_school_books',
    title: 'School Books',
    description: '',
    kind: 'held',
    category: 'lefthand',
    enabled: true,
    unlock: [{ kind: 'hasRecord', collection: 'id.sifa.profile.education' }],
  },
  {
    id: 'sifa_doctoral_cap',
    title: 'Doctoral Cap',
    description: '',
    kind: 'layer',
    category: 'headwear',
    enabled: false,
    unlock: [{ kind: 'hasDoctorate' }],
  },
  {
    id: 'sifa_lab_coat',
    title: 'Lab Coat',
    description: '',
    kind: 'layer',
    category: 'tops',
    enabled: true,
    unlock: [{ kind: 'hasExternalAccount', platforms: ['orcid'] }],
  },
  {
    id: 'sifa_dev_hoodie',
    title: 'Dev Hoodie',
    description: '',
    kind: 'layer',
    category: 'tops',
    enabled: true,
    unlock: [
      { kind: 'hasExternalAccount', platforms: ['github'] },
      { kind: 'usesApp', appId: 'tangled' },
    ],
  },
];
