# TODO

## Text Features

- [x] Stroke width & color (outline of specified thickness in px with hex color around text)
- [ ] Font weight
- [x] Font underline (decoration)
- [x] Font strikethrough (decoration)
- [ ] Emoji text characters
- [ ] Text fill color
- [x] Drop shadow
- [ ] Text alignment
- [x] Word wrap (boolean toggle & max width)

## Technical Debt

- [ ] Review `_font` strong ref vs `_fontRef` WeakRef in SlugTextBase — added strong ref to prevent GC of font during rapid rebuilds, but the WeakRef is now redundant. Decide whether to drop WeakRef entirely or keep both for a reason.
