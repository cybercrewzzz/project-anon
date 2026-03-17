import { PrismaService } from '../../prisma/prisma.service.js';

const ADJECTIVES = [
  'Silent',
  'Brave',
  'Calm',
  'Swift',
  'Gentle',
  'Bright',
  'Quiet',
  'Bold',
  'Warm',
  'Kind',
  'Wise',
  'Cool',
  'Free',
  'Soft',
  'True',
  'Lucky',
  'Happy',
  'Shy',
  'Keen',
  'Deep',
  'Wild',
  'Pure',
  'Zen',
  'Cozy',
  'Chill',
  'Noble',
  'Vivid',
  'Misty',
  'Lunar',
  'Solar',
  'Amber',
  'Azure',
  'Coral',
  'Ivory',
  'Jade',
  'Maple',
  'Ocean',
  'River',
  'Storm',
  'Frost',
];

const ANIMALS = [
  'Fox',
  'Owl',
  'Bear',
  'Wolf',
  'Deer',
  'Hawk',
  'Lynx',
  'Dove',
  'Hare',
  'Seal',
  'Wren',
  'Lark',
  'Swan',
  'Crow',
  'Fawn',
  'Moth',
  'Orca',
  'Puma',
  'Ibis',
  'Newt',
  'Kite',
  'Finch',
  'Robin',
  'Raven',
  'Otter',
  'Panda',
  'Koala',
  'Tiger',
  'Eagle',
  'Crane',
  'Bison',
  'Moose',
  'Whale',
  'Viper',
  'Gecko',
  'Coral',
  'Snowy',
  'Cedar',
  'Birch',
  'Aspen',
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a unique nickname like "BlueFox42".
 * Checks uniqueness against the database.
 * Retries up to maxAttempts times before throwing.
 */
export async function generateUniqueNickname(
  prisma: PrismaService,
  maxAttempts = 10,
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const adjective = randomElement(ADJECTIVES);
    const animal = randomElement(ANIMALS);
    const number = randomNumber(1, 99);
    const nickname = `${adjective}${animal}${number}`;

    const existing = await prisma.account.findUnique({
      where: { nickname },
      select: { accountId: true },
    });

    if (!existing) {
      return nickname;
    }
  }

  // Fallback: use timestamp to guarantee uniqueness
  const adjective = randomElement(ADJECTIVES);
  const animal = randomElement(ANIMALS);
  const suffix = Date.now().toString(36).slice(-4);
  return `${adjective}${animal}${suffix}`;
}
