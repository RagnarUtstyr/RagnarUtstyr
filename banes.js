export const BANES = [
  {
    "id": "blinded",
    "name": "Blinded",
    "url": "https://openlegendrpg.com/bane/blinded",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "charmed",
    "name": "Charmed",
    "url": "https://openlegendrpg.com/bane/charmed",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "deafened",
    "name": "Deafened",
    "url": "https://openlegendrpg.com/bane/deafened",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "death",
    "name": "Death",
    "url": "https://openlegendrpg.com/bane/death",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "demoralized",
    "name": "Demoralized",
    "url": "https://openlegendrpg.com/bane/demoralized",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "disarmed",
    "name": "Disarmed",
    "url": "https://openlegendrpg.com/bane/disarmed",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "dominated",
    "name": "Dominated",
    "url": "https://openlegendrpg.com/bane/dominated",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "fatigued",
    "name": "Fatigued",
    "url": "https://openlegendrpg.com/bane/fatigued",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "fear",
    "name": "Fear",
    "url": "https://openlegendrpg.com/bane/fear",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "forced-move",
    "name": "Forced Move",
    "url": "https://openlegendrpg.com/bane/forced-move",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "immobile",
    "name": "Immobile",
    "url": "https://openlegendrpg.com/bane/immobile",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "incapacitated",
    "name": "Incapacitated",
    "url": "https://openlegendrpg.com/bane/incapacitated",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "knockdown",
    "name": "Knockdown",
    "url": "https://openlegendrpg.com/bane/knockdown",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "memory-alteration",
    "name": "Memory Alteration",
    "url": "https://openlegendrpg.com/bane/memory-alteration",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "mind-dredge",
    "name": "Mind Dredge",
    "url": "https://openlegendrpg.com/bane/mind-dredge",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "nullify",
    "name": "Nullify",
    "url": "https://openlegendrpg.com/bane/nullify",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "persistent-damage",
    "name": "Persistent Damage",
    "url": "https://openlegendrpg.com/bane/persistent-damage",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "phantasm",
    "name": "Phantasm",
    "url": "https://openlegendrpg.com/bane/phantasm",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "polymorph",
    "name": "Polymorph",
    "url": "https://openlegendrpg.com/bane/polymorph",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "provoked",
    "name": "Provoked",
    "url": "https://openlegendrpg.com/bane/provoked",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "spying",
    "name": "Spying",
    "url": "https://openlegendrpg.com/bane/spying",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "sickened",
    "name": "Sickened",
    "url": "https://openlegendrpg.com/bane/sickened",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "silenced",
    "name": "Silenced",
    "url": "https://openlegendrpg.com/bane/silenced",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "slowed",
    "name": "Slowed",
    "url": "https://openlegendrpg.com/bane/slowed",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "stunned",
    "name": "Stunned",
    "url": "https://openlegendrpg.com/bane/stunned",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "stupefied",
    "name": "Stupefied",
    "url": "https://openlegendrpg.com/bane/stupefied",
    "icon: "icons/banes/test.png"
  },
  {
    "id": "truthfulness",
    "name": "Truthfulness",
    "url": "https://openlegendrpg.com/bane/truthfulness",
    "icon: "icons/banes/test.png"
  }
];

export function getBaneByName(name) {
  return BANES.find(b => b.name === name) || null;
}

export function normalizeStoredBanes(value) {
  if (!value) return [];

  const raw = Array.isArray(value)
    ? value
    : (typeof value === 'object' ? Object.values(value) : []);

  const deduped = [];
  const seen = new Set();

  raw.forEach((item) => {
    if (!item) return;
    const bane = typeof item === 'string' ? getBaneByName(item) : item;
    const name = bane?.name || item?.name;
    if (!name || seen.has(name)) return;
    const canonical = getBaneByName(name);
    seen.add(name);
    deduped.push({
      id: canonical?.id || bane?.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      url: canonical?.url || bane?.url || '',
      icon: canonical?.icon || bane?.icon || ''
    });
  });

  return deduped;
}
