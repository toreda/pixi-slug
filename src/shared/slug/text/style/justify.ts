/**
 * Strategy controlling how `text-align: justify` distributes the extra
 * width on a justified line. Mirrors the CSS `text-justify` property,
 * but only the strategies our renderer implements are listed.
 *
 *  - `'inter-word'` (default): expand inter-word gaps only. Matches
 *    CSS `text-justify: inter-word` and is the right behavior for
 *    Latin / Cyrillic / similar scripts.
 *  - `'inter-character'`: distribute extra width evenly across every
 *    inter-glyph gap on the line, stretching both word spacing and
 *    inter-letter spacing. Matches CSS `text-justify: inter-character`
 *    (sometimes called "distribute") and is the right behavior for
 *    CJK and similar scripts where word boundaries aren't meaningful.
 *
 * Ignored when `align !== 'justify'`.
 */
export type SlugTextJustify = 'inter-word' | 'inter-character';
