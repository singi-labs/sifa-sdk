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

/** CIDv1 (raw codec, sha2-256, base32) as used for rpg.actor image blobs. */
export const RPG_CID_REGEX = /^bafkrei[a-z2-7]{52}$/;

export const RpgItemSchema = z.object({
  /** Lowercase `[a-z0-9_]` only: the id is embedded in an AT Protocol record key. */
  id: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_]+$/),
  title: z.string().max(100),
  description: z.string().max(500),
  kind: z.enum(['layer', 'held', 'overlay']),
  category: z.string().max(30),
  /** rpg.actor channels the item is offered in (optional). */
  channels: z.array(z.string().min(1)).optional(),
  /** Full-size sprite asset (CIDv1, raw codec, base32). */
  assetCid: z.string().regex(RPG_CID_REGEX),
  /** Inventory icon (CIDv1, raw codec, base32). */
  iconCid: z.string().regex(RPG_CID_REGEX),
  unlock: z.array(RpgUnlockSchema).min(1), // ANY of these unlocks the item
  enabled: z.boolean(),
});
export type RpgItem = z.infer<typeof RpgItemSchema>;
export type RpgUnlock = z.infer<typeof RpgUnlockSchema>;

/**
 * The Sifa item catalog for rpg.actor. Ids, titles, descriptions, kinds,
 * categories, channels and image CIDs come from rpg.actor's item cores; the
 * weekly drift check compares them and `pnpm rpg:sync-catalog` adopts
 * rpg.actor's changes. `unlock` and `enabled` are ours.
 */
export const RPG_ITEMS: readonly RpgItem[] = [
  {
    id: 'leather_briefcase',
    title: 'Leather Briefcase',
    description: 'A trusty briefcase, for your daily commute',
    kind: 'held',
    category: 'righthand',
    channels: ['main'],
    assetCid: 'bafkreibjtgvetkpzwkliq4o4qnf7atbui6nxgyas3fyk6sjgd5zrl52swa',
    iconCid: 'bafkreifmyglopjtbkiuocmcjcbjhtr34vjumkzbnspbnlsezbdphbkfvu4',
    enabled: true,
    unlock: [{ kind: 'hasRecord', collection: 'id.sifa.profile.position' }],
  },
  {
    id: 'sifa_suit',
    title: 'Sifa Suit',
    description: 'Sharp power suit for confirmed professionals',
    kind: 'overlay',
    category: 'costume',
    channels: ['main'],
    assetCid: 'bafkreibortlffvfzkdcuqdpoubczuno7ohnvfwqhefe4h4s36eooe4njgu',
    iconCid: 'bafkreifo7vojbr4i6uvsthj2hbczoqwmrn3ovysrskvxlxw6fvkbswm2ae',
    enabled: false,
    // Reserved for the confirmed tier (a colleague confirms the job and both
    // have a confirmed work email). The unlock kind for that is added once work
    // email confirmation exists; until then the item stays disabled.
    unlock: [{ kind: 'hasRecord', collection: 'id.sifa.profile.position' }],
  },
  {
    id: 'speaker_mic',
    title: 'Speaker Mic',
    description: "A presentation mic, so you can drop it on 'em",
    kind: 'held',
    category: 'righthand',
    channels: ['main'],
    assetCid: 'bafkreibr4kgeijc5naecf7l4awfv3omph4ngjmjb36qkfnk2sdo6l45ck4',
    iconCid: 'bafkreidnkirbw4nwiro3ocrn5nk66uxf3dhcoy5pojunisvs7so55u3j3q',
    enabled: true,
    unlock: [{ kind: 'hasRecord', collection: 'id.sifa.profile.presentation' }],
  },
  {
    id: 'strapped_books',
    title: 'Strapped Books',
    description: 'Knowledge is power, better come strapped',
    kind: 'held',
    category: 'righthand',
    channels: ['main'],
    assetCid: 'bafkreieofltl6427jy3n6dfv63phublalv6nq2hcs36qnyxz33ta6u6yqi',
    iconCid: 'bafkreiavywpv4sgw7gnkzq5gw3nq6yihaucdexpsvgko26q6jq6u6grjpi',
    enabled: true,
    unlock: [{ kind: 'hasRecord', collection: 'id.sifa.profile.education' }],
  },
  {
    id: 'dev_hoodie',
    title: 'Dev Hoodie',
    description: 'Snug hoodie for when you enter total code mode',
    kind: 'layer',
    category: 'tops',
    channels: ['main', 'sub1'],
    assetCid: 'bafkreigmrqp5kd6lytqcen2mypuv6dqonrdfbi2ngxhq3uqozk63yi7hoy',
    iconCid: 'bafkreigjwti3w43ta6gy2c75qtdnuvovfohjtv2febbd6hdhpri4tupbem',
    enabled: true,
    unlock: [
      { kind: 'hasExternalAccount', platforms: ['github'] },
      { kind: 'usesApp', appId: 'tangled' },
    ],
  },
  {
    id: 'doctoral_cap',
    title: 'Doctoral Cap',
    description: 'Took so many long years to earn this hat',
    kind: 'layer',
    category: 'headwear',
    channels: ['main'],
    assetCid: 'bafkreic7pvfpb7fjgooiaianrc27mh7fwj5vkicre63l6x5hrzb4w36tcq',
    iconCid: 'bafkreigqt6lmx5crj3w7vc3bvuewarzdreg2doxyeerbxmhljhpeshjewm',
    enabled: true,
    unlock: [{ kind: 'hasDoctorate' }],
  },
  {
    id: 'weekend_shirt',
    title: 'Weekend Shirt',
    description:
      'Fun shirt to wear when work is all finished.... but you still have a side-project...',
    kind: 'layer',
    category: 'tops',
    channels: ['main', 'sub1', 'sub2'],
    assetCid: 'bafkreigifgpwkxvftiuzbjc6c2xz4xf2iv4bznbhu364e7rhvfmhosbak4',
    iconCid: 'bafkreieguco74wkabuyhs4sz6ec35nyywr7ikaw6et4coeezphnsnqqjui',
    enabled: true,
    unlock: [{ kind: 'hasRecord', collection: 'id.sifa.profile.volunteering' }],
  },
  {
    id: 'lab_coat',
    title: 'Lab Coat',
    description: 'Scientifically proven attire',
    kind: 'layer',
    category: 'tops',
    channels: ['main'],
    assetCid: 'bafkreiby4g6fgkmi65myv7tdblgb4jvqa3kgnrxvtkxlrtme55unuie4he',
    iconCid: 'bafkreifoddxk5tobgwadib5rxwjn67iind6me3swpvw4t5rbcauc5r4syy',
    enabled: true,
    unlock: [{ kind: 'hasExternalAccount', platforms: ['orcid'] }],
  },
];
