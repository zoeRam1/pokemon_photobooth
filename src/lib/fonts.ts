const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/** Resolves once the card fonts are loaded (or after 2.5 s, so a slow network never blocks drawing). */
export const fontsReady: Promise<void> = Promise.race([
  Promise.all([
    '96px "Lilita One"', "800 50px Rubik", "italic 900 50px Rubik",
    "700 22px Rubik", "800 34px Nunito", "900 44px Rubik",
  ].map(f => document.fonts.load(f))).then(() => undefined).catch(() => undefined),
  sleep(2500),
]);
