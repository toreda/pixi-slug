/**
 * Text direction. Drives how `start` and `end` resolve on direction-
 * aware fields (e.g. decoration alignment).
 *
 * Today only the decoration align resolution honors this field —
 * glyph layout is always laid out left-to-right regardless. Full
 * RTL glyph layout (BiDi reordering, OpenType shaping, line fill
 * direction) will land as a separate feature; the `direction` field
 * is exposed now so application code can be written direction-aware
 * without changing API surface later.
 */
export type SlugTextDirection = 'ltr' | 'rtl';
