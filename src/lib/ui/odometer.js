/**
 * «Tacho-Ziffern» (Noah 03.11.2026 «b», Paket C idea 12): a formatted number split into its characters,
 * so every digit can roll up like the wheels of an old bike odometer. { c, d }: c the character, d the
 * digit 0-9 or null for a separator (’ , . space), which stays still.
 */
export const odoParts = (text) => [...String(text ?? '')].map((c) => ({ c, d: /^[0-9]$/.test(c) ? Number(c) : null }));

/** The roll of digit number n (counted over the digits only): left ones are slower, so the number settles from the right. */
export const odoMs = (n) => 700 + n * 110;
