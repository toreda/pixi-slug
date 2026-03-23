# TODO

## Text Features

- [ ] Stroke width & color (outline of specified thickness in px with hex color around text)
- [ ] Font weight
- [ ] Font underline
- [ ] Emoji text characters
- [ ] Text fill color
- [ ] Drop shadow
- [ ] Text alignment
- [ ] Word wrap (boolean toggle & max width)

## Technical Debt

- [ ] Review `_font` strong ref vs `_fontRef` WeakRef in SlugTextBase — added strong ref to prevent GC of font during rapid rebuilds, but the WeakRef is now redundant. Decide whether to drop WeakRef entirely or keep both for a reason.
