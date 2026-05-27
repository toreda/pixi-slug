/**
 * Shared example wiring for v6/v7/v8 demo pages.
 *
 * Loaded by each per-version index.html after the version-specific
 * pixi.js + pixi-slug bundles. Exposes one global entry point:
 *
 *     window.SlugExample.run({
 *         construct,        // ({text, options, font}) -> new SlugText
 *         addToStage,       // (slugText) -> void
 *         removeFromStage,  // (slugText) -> void
 *         fonts,            // optional: { 'Label': 'url', ... }
 *     })
 *
 * The helper fetches sidebar.html, injects it into #sidebar, and wires
 * every control. Per-version pages only need to provide the three
 * lifecycle callbacks since SlugText construction and stage attachment
 * differ slightly across PixiJS versions.
 *
 * Feature detection: any element marked data-requires="<prop>" is
 * removed from the DOM if the constructed SlugText instance lacks that
 * property. Whole sections OR individual rows can be gated this way.
 */
(function () {
	var DEFAULT_FONTS = {
		'Roboto TTF (default)':  'font.ttf',
		'Roboto TTF (fallback)': '/assets/fonts/roboto-fallback.ttf',
		'Roboto OTF (CFF)':      '/assets/fonts/roboto-fallback.otf',
		'Roboto WOFF':           '/assets/fonts/roboto-fallback.woff',
		'Roboto WOFF2':          '/assets/fonts/roboto-fallback.woff2'
	};

	// Defaults that mirror src/defaults.ts (Defaults.SlugText). Used to
	// drop keys whose current value matches the documented default — the
	// snippet stays minimal and idiomatic. Defined at module scope so
	// `wireCodePanel`'s initial-open refresh path can read it before
	// `start()`'s body finishes initializing.
	var SNIPPET_DEFAULTS = {
		fontSize:       24,
		fill:           [1, 1, 1, 1],
		direction:      'ltr',
		align:          'start',
		textJustify:    'inter-word',
		wordWrap:       false,
		wordWrapWidth:  0,
		breakWords:     false,
		underline:      false,
		strikethrough:  false,
		overline:       false
		// stroke / dropShadow have no default — absence == disabled.
	};

	function hexToRGBA(hex, alpha) {
		var r = parseInt(hex.slice(1, 3), 16) / 255;
		var g = parseInt(hex.slice(3, 5), 16) / 255;
		var b = parseInt(hex.slice(5, 7), 16) / 255;
		var a = (typeof alpha === 'number') ? alpha : 1;
		return [r, g, b, a];
	}

	// Convert a CSS-style gradient angle (degrees, 0 = bottom→top) into
	// start/end points on the unit square (0..1 normalized bbox UV).
	// Both points get clamped to the bbox edge; the gradient sweep stays
	// inside the visible rect.
	function angleToStartEnd(deg) {
		// CSS convention: 0deg points up (start at bottom, end at top).
		// We want the gradient to traverse the full bbox along the chosen
		// direction. Start at bbox center minus half the direction vector,
		// end at center plus half the direction. Normalized to a 1x1 box.
		var rad = (deg - 90) * Math.PI / 180; // -90 so 0deg → up
		var dx = Math.cos(rad);
		var dy = Math.sin(rad);
		// Scale direction so the longer extent reaches the bbox edge.
		var s = 1 / (Math.abs(dx) + Math.abs(dy) || 1);
		dx *= s; dy *= s;
		return {
			start: [0.5 - dx * 0.5, 0.5 - dy * 0.5],
			end:   [0.5 + dx * 0.5, 0.5 + dy * 0.5]
		};
	}

	// Walk the just-injected sidebar and remove anything tagged with
	// data-requires=<prop> when the constructed SlugText doesn't have
	// that property. Hiding (vs. disabling) keeps the UI honest — an
	// absent section reads as "not in this version" rather than
	// "broken right now".
	// Sentinel keys not backed by a SlugText property — these groups are
	// owned by a separate wirer (e.g. `runMathText` handles 'mathText')
	// and pruned by that wirer's own gating logic, not by SlugText
	// feature detection. Without this skip, the SlugText prune pass
	// would delete the group before its real owner could inspect it.
	var PRUNE_SKIP = {mathText: true};

	function pruneUnsupported(sidebar, slugText) {
		sidebar.querySelectorAll('[data-requires]').forEach(function (el) {
			var prop = el.getAttribute('data-requires');
			if (PRUNE_SKIP[prop]) return;
			if (!(prop in slugText)) el.remove();
		});
	}

	// Slider ↔ number-input pair sync with min/max/step clamping.
	function linkSlider(sliderId, inputId, onChange) {
		var slider = document.getElementById(sliderId);
		var input = document.getElementById(inputId);
		if (!slider || !input) return;
		var min = parseFloat(slider.min);
		var max = parseFloat(slider.max);
		var step = parseFloat(slider.step) || 1;
		function clampAndSync(source) {
			var v = parseFloat(source.value);
			if (isNaN(v)) return;
			v = Math.min(Math.max(v, min), max);
			v = Math.round(v / step) * step;
			v = parseFloat(v.toFixed(10));
			slider.value = v;
			input.value = v;
			if (onChange) onChange(v);
		}
		slider.oninput = function () { clampAndSync(slider); };
		input.onchange = function () { clampAndSync(input); };
	}

	function setCollapsed(group, collapsed) {
		group.setAttribute('data-collapsed', collapsed ? 'true' : 'false');
		var btn = group.querySelector('.group-toggle');
		if (btn) btn.textContent = collapsed ? '+' : '−';
	}
	function toggleCollapsed(group) {
		setCollapsed(group, group.getAttribute('data-collapsed') !== 'true');
	}

	// Wire up every collapsible section. Header click toggles collapse,
	// EXCEPT clicks on the enable checkbox or its label (those flip the
	// checkbox; its `change` listener then syncs collapse to match).
	// The +/− button toggles collapse only — it never touches the
	// checkbox, so users can preview a section without enabling it.
	function wireCollapsibles() {
		document.querySelectorAll('.ctrl-group[data-collapsible]').forEach(function (group) {
			var title = group.querySelector('.ctrl-group-title');
			var btn = group.querySelector('.group-toggle');
			var enableId = group.getAttribute('data-enable');
			var enableCb = enableId ? document.getElementById(enableId) : null;

			if (title) {
				title.style.cursor = 'pointer';
				title.addEventListener('click', function (e) {
					if (enableCb && (e.target === enableCb || (e.target.tagName === 'LABEL' &&
						e.target.getAttribute('for') === enableId))) {
						return;
					}
					if (e.target === btn) return;
					toggleCollapsed(group);
				});
			}
			if (btn) {
				btn.addEventListener('click', function (e) {
					e.stopPropagation();
					toggleCollapsed(group);
				});
			}
			if (enableCb) {
				enableCb.addEventListener('change', function () {
					setCollapsed(group, !enableCb.checked);
				});
			}
		});
	}

	function run(opts) {
		var construct = opts.construct;
		var addToStage = opts.addToStage;
		var removeFromStage = opts.removeFromStage;
		var fonts = opts.fonts || DEFAULT_FONTS;
		// Optional: per-version texture loader. Returns a Promise<Texture>
		// (PIXI version-specific shape — wire.js does not type-check). When
		// absent, the texture URL field renders an error.
		var loadTexture = opts.loadTexture || null;

		// Resolve sidebar.html relative to this script's URL so each
		// per-version page can host wire.js from any depth without
		// fixing up paths.
		var scriptUrl = (function () {
			var scripts = document.getElementsByTagName('script');
			for (var i = scripts.length - 1; i >= 0; i--) {
				var s = scripts[i].src;
				if (s && s.indexOf('wire.js') !== -1) return s;
			}
			return '';
		})();
		var sidebarUrl = scriptUrl.replace(/wire\.js(\?.*)?$/, 'sidebar.html');

		fetch(sidebarUrl).then(function (res) {
			if (!res.ok) throw new Error('Failed to load sidebar.html: ' + res.status);
			return res.text();
		}).then(function (markup) {
			var sidebar = document.getElementById('sidebar');
			if (!sidebar) throw new Error('Page is missing a #sidebar element');
			sidebar.innerHTML = markup;
			return start();
		}).catch(function (err) {
			console.error('[SlugExample] init failed:', err);
		});

		async function start() {
			var fontSelect = document.getElementById('ctrlFont');
			Object.keys(fonts).forEach(function (label) {
				var opt = document.createElement('option');
				opt.value = fonts[label];
				opt.textContent = label;
				fontSelect.appendChild(opt);
			});

			var fontStatus = document.getElementById('ctrlFontStatus');
			var slugText = null;
			var prunedForFeatures = false;
			// Cached PIXI Texture from the most recent successful texture
			// URL load. Reused across re-renders until the URL changes.
			var loadedFillTexture = null;

			async function loadFont(url) {
				fontStatus.style.color = '#8b949e';
				fontStatus.textContent = 'Loading ' + url + '...';
				try {
					if (slugText) {
						removeFromStage(slugText);
						slugText.destroy();
						slugText = null;
					}
					var directionEl = document.getElementById('ctrlDirection');
					var alignEl = document.getElementById('ctrlAlign');
					var textJustifyEl = document.getElementById('ctrlTextJustify');
					var options = {
						fontSize: parseInt(document.getElementById('ctrlFontSize').value, 10) || 48,
						fill: buildFillInput()
					};
					if (directionEl) options.direction = directionEl.value;
					if (alignEl) options.align = alignEl.value;
					if (textJustifyEl) options.textJustify = textJustifyEl.value;

					slugText = construct({
						text: document.getElementById('ctrlText').value,
						font: url,
						options: options
					});
					addToStage(slugText);

					// Expose the live instance + font URL for any sibling
					// helpers (e.g. runMathText) that need to track the
					// SlugText for layout sync. Updated on every font swap.
					window.SlugExample._current = {slugText: slugText, fontUrl: url};

					// Prune unsupported sections once we have a real instance
					// to feature-detect against. Only happens on the first
					// successful load; subsequent font swaps reuse the same
					// SlugText class so the support set is stable.
					if (!prunedForFeatures) {
						pruneUnsupported(document.getElementById('sidebar'), slugText);
						prunedForFeatures = true;
					}

					applyStroke();
					applyShadow();
					applyWordWrap();
					applyFill();
					applyDecoration('underline');
					applyDecoration('strikethrough');
					applyDecoration('overline');
					applyRotation();

					fontStatus.style.color = '#4ab07a';
					fontStatus.textContent = 'Loaded ' + url;
				} catch (e) {
					fontStatus.style.color = '#ff6b6b';
					fontStatus.textContent = 'Failed: ' + e.message;
					console.error('Font load failed for ' + url, e);
				}
			}

			fontSelect.onchange = function () { loadFont(this.value); };

			// --- Apply functions ---
			function applyStroke() {
				if (!slugText) return;
				var enabled = document.getElementById('ctrlStroke').checked;
				if (!enabled) { slugText.strokeWidth = 0; return; }
				slugText.stroke = {
					width: parseFloat(document.getElementById('ctrlStrokeWidth').value) || 0,
					color: hexToRGBA(document.getElementById('ctrlStrokeColor').value),
					alphaMode: document.getElementById('ctrlStrokeAlphaMode').value,
					alphaStart: parseFloat(document.getElementById('ctrlStrokeAlphaStart').value),
					alphaRate: parseFloat(document.getElementById('ctrlStrokeAlphaRate').value)
				};
			}

			function applyShadow() {
				if (!slugText) return;
				var enabled = document.getElementById('ctrlShadow').checked;
				if (!enabled) { slugText.dropShadow = null; return; }
				slugText.dropShadow = {
					distance: parseFloat(document.getElementById('ctrlShadowDist').value) || 5,
					angle: (parseFloat(document.getElementById('ctrlShadowAngle').value) || 30) * Math.PI / 180,
					color: hexToRGBA(document.getElementById('ctrlShadowColor').value),
					alpha: parseFloat(document.getElementById('ctrlShadowAlpha').value),
					blur: parseFloat(document.getElementById('ctrlShadowBlur').value) || 0
				};
			}

			// Build the fill input value from the current sidebar state.
			// Falls back to a flat color when fill controls are absent
			// (v6/v7 prune them via data-requires="fill").
			function buildFillInput() {
				var modeEl = document.getElementById('ctrlFillMode');
				var color = document.getElementById('ctrlFillColor').value;
				if (!modeEl) return hexToRGBA(color);
				var mode = modeEl.value;
				if (mode === 'solid') return hexToRGBA(color);
				if (mode === 'linear-gradient' || mode === 'radial-gradient') {
					var stop0Color = document.getElementById('ctrlFillStop0Color').value;
					var stop1Color = document.getElementById('ctrlFillStop1Color').value;
					var stop0Alpha = parseFloat(document.getElementById('ctrlFillStop0Alpha').value);
					var stop1Alpha = parseFloat(document.getElementById('ctrlFillStop1Alpha').value);
					var stops = [
						{offset: 0, color: hexToRGBA(stop0Color, stop0Alpha)},
						{offset: 1, color: hexToRGBA(stop1Color, stop1Alpha)}
					];
					if (mode === 'linear-gradient') {
						var deg = parseFloat(document.getElementById('ctrlFillLinearAngle').value) || 0;
						var pts = angleToStartEnd(deg);
						return {
							type: 'linear-gradient',
							stops: stops,
							start: pts.start,
							end: pts.end
						};
					}
					return {
						type: 'radial-gradient',
						stops: stops,
						center: [0.5, 0.5],
						innerRadius: parseFloat(document.getElementById('ctrlFillRadialInner').value) || 0,
						outerRadius: parseFloat(document.getElementById('ctrlFillRadialOuter').value) || 0.5
					};
				}
				if (mode === 'texture') {
					if (!loadedFillTexture) return hexToRGBA(color); // fall back until loaded
					var fitEl = document.getElementById('ctrlFillTextureFit');
					var sxEl  = document.getElementById('ctrlFillTextureScaleX');
					var syEl  = document.getElementById('ctrlFillTextureScaleY');
					var oxEl  = document.getElementById('ctrlFillTextureOffsetX');
					var oyEl  = document.getElementById('ctrlFillTextureOffsetY');
					return {
						type: 'texture',
						source: loadedFillTexture,
						fit: fitEl ? fitEl.value : 'repeat',
						scaleX: sxEl ? (parseFloat(sxEl.value) || 1) : 1,
						scaleY: syEl ? (parseFloat(syEl.value) || 1) : 1,
						offsetX: oxEl ? (parseFloat(oxEl.value) || 0) : 0,
						offsetY: oyEl ? (parseFloat(oyEl.value) || 0) : 0
					};
				}
				return hexToRGBA(color);
			}

			function applyFill() {
				if (!slugText) return;
				var input = buildFillInput();
				if ('fill' in slugText) {
					slugText.fill = input;
				} else {
					// v6/v7 don't expose `fill` (yet) — fall back to color.
					if (Array.isArray(input)) slugText.color = input;
				}
			}

			function applyWordWrap() {
				if (!slugText) return;
				slugText.wordWrap = document.getElementById('ctrlWordWrap').checked;
				slugText.wordWrapWidth = parseFloat(document.getElementById('ctrlWrapWidth').value) || 400;
				slugText.breakWords = document.getElementById('ctrlBreakWords').checked;
			}

			// One helper for all three decorations. Reads the checkbox
			// group for `name` and produces either `false`, `true`, or
			// the object form depending on which "Use fill" / "Auto
			// thickness" boxes are ticked. `length` and `align` are
			// only sent when they differ from the API defaults
			// (1.0 / 'start') — matches the behavior expected by the
			// SlugText decoration setter.
			function applyDecoration(name) {
				if (!slugText || !(name in slugText)) return;
				var cap = name.charAt(0).toUpperCase() + name.slice(1);
				var enableEl = document.getElementById('ctrl' + cap);
				if (!enableEl) return; // pruned for this version
				if (!enableEl.checked) { slugText[name] = false; return; }
				var colorAuto = document.getElementById('ctrl' + cap + 'ColorAuto').checked;
				var thicknessAuto = document.getElementById('ctrl' + cap + 'ThicknessAuto').checked;
				var length = parseFloat(document.getElementById('ctrl' + cap + 'Length').value);
				if (isNaN(length)) length = 1;
				var align = document.getElementById('ctrl' + cap + 'Align').value;
				if (colorAuto && thicknessAuto && length === 1 && align === 'start') {
					slugText[name] = true;
					return;
				}
				var cfg = {};
				if (!colorAuto) cfg.color = hexToRGBA(document.getElementById('ctrl' + cap + 'Color').value);
				if (!thicknessAuto) cfg.thickness = parseFloat(document.getElementById('ctrl' + cap + 'Thickness').value) || 1;
				if (length !== 1) cfg.length = length;
				if (align !== 'start') cfg.align = align;
				slugText[name] = cfg;
			}

			// --- Wire up controls ---
			document.getElementById('ctrlText').oninput = function () {
				if (slugText) slugText.text = this.value;
			};
			linkSlider('ctrlFontSize', 'ctrlFontSizeVal', function (v) {
				if (slugText) slugText.fontSize = v;
			});

			var _rebuildTimer = null;
			function debounce(fn) {
				return function () {
					clearTimeout(_rebuildTimer);
					_rebuildTimer = setTimeout(fn, 30);
				};
			}

			document.getElementById('ctrlFillColor').oninput = applyFill;

			// Fill mode + gradient/texture controls. Each may be absent
			// when the sidebar pruned data-requires="fill" rows.
			var fillModeEl = document.getElementById('ctrlFillMode');
			var sidebarHost = document.getElementById('sidebar');
			function syncFillMode() {
				if (!fillModeEl || !sidebarHost) return;
				sidebarHost.setAttribute('data-fill-mode', fillModeEl.value);
			}
			if (fillModeEl) {
				syncFillMode();
				fillModeEl.onchange = function () {
					syncFillMode();
					applyFill();
				};
			}

			['ctrlFillStop0Color', 'ctrlFillStop1Color'].forEach(function (id) {
				var el = document.getElementById(id);
				if (el) el.oninput = debounce(applyFill);
			});
			['ctrlFillStop0Alpha', 'ctrlFillStop1Alpha'].forEach(function (id) {
				var el = document.getElementById(id);
				if (el) el.oninput = applyFill;
			});
			linkSlider('ctrlFillLinearAngle', 'ctrlFillLinearAngleVal', applyFill);
			linkSlider('ctrlFillRadialInner', 'ctrlFillRadialInnerVal', applyFill);
			linkSlider('ctrlFillRadialOuter', 'ctrlFillRadialOuterVal', applyFill);

			var fillTextureLoad = document.getElementById('ctrlFillTextureLoad');
			var fillTextureStatus = document.getElementById('ctrlFillTextureStatus');
			var fillTexturePreset = document.getElementById('ctrlFillTexturePreset');

			// Shared loader used by both preset and URL paths. `source` is
			// either a URL string or an HTMLCanvasElement; loadTexture is
			// expected to handle both (the v8 example does).
			function loadFillTextureSource(source, label) {
				if (!loadTexture) {
					if (fillTextureStatus) {
						fillTextureStatus.style.color = '#ff6b6b';
						fillTextureStatus.textContent = 'No texture loader for this version';
					}
					return;
				}
				if (fillTextureStatus) {
					fillTextureStatus.style.color = '#8b949e';
					fillTextureStatus.textContent = 'Loading ' + (label || '...');
				}
				Promise.resolve(loadTexture(source)).then(function (tex) {
					loadedFillTexture = tex;
					if (fillTextureStatus) {
						fillTextureStatus.style.color = '#4ab07a';
						fillTextureStatus.textContent = 'Loaded';
					}
					applyFill();
				}).catch(function (err) {
					if (fillTextureStatus) {
						fillTextureStatus.style.color = '#ff6b6b';
						fillTextureStatus.textContent = 'Failed: ' + (err && err.message || err);
					}
				});
			}

			function syncFillTexturePreset() {
				if (!fillTexturePreset || !sidebarHost) return;
				sidebarHost.setAttribute('data-fill-texture', fillTexturePreset.value);
			}
			// Map preset names that load a URL asset (relative to wire.js)
			// rather than a generated canvas. The URL is resolved against
			// scriptUrl so the asset still loads when wire.js is hosted
			// from another path.
			var fillTextureAssets = {
				metal:        scriptUrl.replace(/wire\.js(\?.*)?$/, 'textures/metal_pse.jpg'),
				'fabric-dots':  scriptUrl.replace(/wire\.js(\?.*)?$/, 'textures/fabric_dots.jpg'),
				'fabric-knit':  scriptUrl.replace(/wire\.js(\?.*)?$/, 'textures/fabric_knit.jpg'),
				wood:         scriptUrl.replace(/wire\.js(\?.*)?$/, 'textures/wood_grain.jpg')
			};

			if (fillTexturePreset) {
				syncFillTexturePreset();
				fillTexturePreset.onchange = function () {
					syncFillTexturePreset();
					if (this.value === 'custom') return; // wait for user to load a URL
					var assetUrl = fillTextureAssets[this.value];
					if (assetUrl) loadFillTextureSource(assetUrl, this.value);
				};
			}

			if (fillTextureLoad) {
				fillTextureLoad.onclick = function () {
					var url = (document.getElementById('ctrlFillTextureUrl').value || '').trim();
					if (!url) {
						if (fillTextureStatus) {
							fillTextureStatus.style.color = '#ff6b6b';
							fillTextureStatus.textContent = 'Enter a URL';
						}
						return;
					}
					loadFillTextureSource(url, url);
				};
			}

			['ctrlFillTextureFit',
			 'ctrlFillTextureScaleX', 'ctrlFillTextureScaleY',
			 'ctrlFillTextureOffsetX', 'ctrlFillTextureOffsetY'].forEach(function (id) {
				var el = document.getElementById(id);
				if (!el) return;
				if (el.tagName === 'SELECT') el.onchange = applyFill;
				else el.oninput = applyFill;
			});

			// Pre-load the default preset so switching the fill mode to
			// Texture immediately renders something.
			if (fillTexturePreset && fillTexturePreset.value !== 'custom' && loadTexture) {
				var initialAsset = fillTextureAssets[fillTexturePreset.value];
				if (initialAsset) loadFillTextureSource(initialAsset, fillTexturePreset.value);
			}

			document.getElementById('ctrlWordWrap').onchange = applyWordWrap;
			document.getElementById('ctrlBreakWords').onchange = applyWordWrap;
			linkSlider('ctrlWrapWidth', 'ctrlWrapWidthVal', applyWordWrap);

			function applyRotation() {
				if (!slugText) return;
				var deg = parseFloat(document.getElementById('ctrlRotation').value) || 0;
				slugText.rotation = deg * Math.PI / 180;
			}
			linkSlider('ctrlRotation', 'ctrlRotationVal', applyRotation);
			var rotationResetBtn = document.getElementById('ctrlRotationReset');
			if (rotationResetBtn) {
				rotationResetBtn.onclick = function () {
					var slider = document.getElementById('ctrlRotation');
					var input = document.getElementById('ctrlRotationVal');
					slider.value = 0;
					input.value = 0;
					applyRotation();
					// Fire input/change so the code panel listener re-renders the snippet.
					slider.dispatchEvent(new Event('input', {bubbles: true}));
				};
			}

			var directionEl = document.getElementById('ctrlDirection');
			if (directionEl) {
				directionEl.onchange = function () {
					if (slugText && 'direction' in slugText) slugText.direction = this.value;
				};
			}

			var alignEl = document.getElementById('ctrlAlign');
			var textJustifyEl = document.getElementById('ctrlTextJustify');
			function syncJustifyEnabled() {
				if (!textJustifyEl || !alignEl) return;
				var on = alignEl.value === 'justify';
				textJustifyEl.disabled = !on;
				textJustifyEl.style.opacity = on ? '' : '0.5';
			}
			if (alignEl) {
				alignEl.onchange = function () {
					if (slugText && 'align' in slugText) slugText.align = this.value;
					syncJustifyEnabled();
				};
			}
			if (textJustifyEl) {
				textJustifyEl.onchange = function () {
					if (slugText && 'textJustify' in slugText) slugText.textJustify = this.value;
				};
				syncJustifyEnabled();
			}

			['underline', 'strikethrough', 'overline'].forEach(function (name) {
				var cap = name.charAt(0).toUpperCase() + name.slice(1);
				var enableEl = document.getElementById('ctrl' + cap);
				if (!enableEl) return;
				var update = function () { applyDecoration(name); };
				enableEl.onchange = update;
				document.getElementById('ctrl' + cap + 'Color').oninput = debounce(update);
				document.getElementById('ctrl' + cap + 'ColorAuto').onchange = update;
				document.getElementById('ctrl' + cap + 'ThicknessAuto').onchange = update;
				document.getElementById('ctrl' + cap + 'Align').onchange = update;
				linkSlider('ctrl' + cap + 'Thickness', 'ctrl' + cap + 'ThicknessVal', update);
				linkSlider('ctrl' + cap + 'Length', 'ctrl' + cap + 'LengthVal', update);
			});

			document.getElementById('ctrlStroke').onchange = applyStroke;
			linkSlider('ctrlStrokeWidth', 'ctrlStrokeWidthVal', applyStroke);
			document.getElementById('ctrlStrokeColor').oninput = debounce(applyStroke);
			document.getElementById('ctrlStrokeAlphaMode').onchange = applyStroke;
			linkSlider('ctrlStrokeAlphaStart', 'ctrlStrokeAlphaStartVal', applyStroke);
			linkSlider('ctrlStrokeAlphaRate', 'ctrlStrokeAlphaRateVal', applyStroke);

			document.getElementById('ctrlShadow').onchange = applyShadow;
			linkSlider('ctrlShadowDist', 'ctrlShadowDistVal', applyShadow);
			linkSlider('ctrlShadowAngle', 'ctrlShadowAngleVal', debounce(applyShadow));
			linkSlider('ctrlShadowAlpha', 'ctrlShadowAlphaVal', applyShadow);
			linkSlider('ctrlShadowBlur', 'ctrlShadowBlurVal', applyShadow);
			document.getElementById('ctrlShadowColor').oninput = debounce(applyShadow);

			wireCollapsibles();
			injectCodePanel();
			wireCodePanel();

			await loadFont(fontSelect.value);

			// Inject the second-sidebar code panel and the in-sidebar trigger
			// row that opens it. Idempotent — safe to call more than once.
			//
			// The panel is added as a sibling of #app inside #main so it
			// participates in the flex layout. When `data-code-open="true"`
			// is set on #main the panel is visible and #app naturally narrows
			// to make room. PIXI's ResizeObserver / resizeTo handles the
			// canvas rescale automatically.
			function injectCodePanel() {
				if (document.getElementById('codePanel')) return;

				// highlight.js (CDN) + a dark theme matching the page palette.
				var hljsCss = document.createElement('link');
				hljsCss.rel = 'stylesheet';
				hljsCss.href = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github-dark.min.css';
				document.head.appendChild(hljsCss);
				var hljsScript = document.createElement('script');
				hljsScript.src = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js';
				hljsScript.async = false;
				document.head.appendChild(hljsScript);
				var hljsTs = document.createElement('script');
				hljsTs.src = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/languages/typescript.min.js';
				hljsTs.async = false;
				document.head.appendChild(hljsTs);

				// In-sidebar trigger row — appended after the last control group.
				var sidebar = document.getElementById('sidebar');
				if (sidebar) {
					var triggerHost = document.createElement('div');
					triggerHost.innerHTML = (
						'<div class="ctrl-group code-trigger-group">' +
						'<button type="button" id="codeToggle" class="code-toggle">' +
						'<span class="code-toggle-icon">&lt;/&gt;</span>' +
						'<span class="code-toggle-label">Show code</span>' +
						'</button></div>'
					);
					while (triggerHost.firstChild) sidebar.appendChild(triggerHost.firstChild);
				}

				// Code panel docks at the bottom of the canvas area (not full
				// page width — sidebar stays untouched on the left). Layout:
				//
				//   #main (flex row)
				//     #sidebar
				//     .main-right (flex column)
				//       #app
				//       #codePanel
				//
				// To get there we wrap the existing #app in a .main-right
				// container and append #codePanel as the column's second child.
				var main = document.getElementById('main');
				var app  = document.getElementById('app');
				if (main && app) {
					// Default to closed so the panel is hidden until wireCodePanel
					// reads the persisted state and updates this attribute.
					if (!main.hasAttribute('data-code-open')) {
						main.setAttribute('data-code-open', 'false');
					}

					// Wrap #app in .main-right so #app and #codePanel can stack
					// vertically without disturbing the sidebar's row layout.
					var rightStack = document.querySelector('.main-right');
					if (!rightStack) {
						rightStack = document.createElement('div');
						rightStack.className = 'main-right';
						main.insertBefore(rightStack, app);
						rightStack.appendChild(app);
					}

					var panelHost = document.createElement('div');
					panelHost.innerHTML = (
						'<aside id="codePanel" class="code-panel" aria-label="Construction code">' +
						'<div class="code-resize-handle" id="codeResizeHandle" aria-label="Resize" role="separator"></div>' +
						'<div class="code-header">' +
						'<div class="code-tabs" role="tablist">' +
						'<button type="button" class="code-tab" role="tab" data-lang="js" aria-selected="true">JavaScript</button>' +
						'<button type="button" class="code-tab" role="tab" data-lang="ts" aria-selected="false">TypeScript</button>' +
						'</div>' +
						'<div class="code-actions">' +
						'<button type="button" id="codeCopy">Copy</button>' +
						'<button type="button" id="codeClose" class="code-close" aria-label="Close">×</button>' +
						'</div></div>' +
						'<pre class="code-pre"><code id="codeBlock" class="hljs"></code></pre>' +
						'</aside>'
					);
					rightStack.appendChild(panelHost.firstChild);
				}
			}

			// --- Code panel wiring ---
			//
			// The panel lives next to #app in the flex layout. Visibility is
			// driven by `data-code-open="true|false"` on #main; CSS hides
			// the panel when false and shows it (with width set via inline
			// `--code-w`) when true.
			//
			// Three pieces of persisted state via localStorage:
			//   - slugExample.codeOpen  — '1' / '0'
			//   - slugExample.codeLang  — 'js' / 'ts'
			//   - slugExample.codeWidth — pixel width of the panel
			//
			// Live updates: while open, every sidebar input/change re-renders
			// the snippet. While closed, no listeners fire.
			function wireCodePanel() {
				var main       = document.getElementById('main');
				var trigger    = document.getElementById('codeToggle');
				var triggerLbl = trigger ? trigger.querySelector('.code-toggle-label') : null;
				var panel      = document.getElementById('codePanel');
				var copyBtn    = document.getElementById('codeCopy');
				var closeBtn   = document.getElementById('codeClose');
				var codeEl     = document.getElementById('codeBlock');
				var handle     = document.getElementById('codeResizeHandle');
				var tabs       = panel ? panel.querySelectorAll('.code-tab') : [];
				if (!main || !trigger || !panel || !codeEl) return;

				function readPref(key, fallback) {
					try {
						var v = localStorage.getItem(key);
						return v === null ? fallback : v;
					} catch (_) { return fallback; }
				}
				function writePref(key, value) {
					try { localStorage.setItem(key, value); } catch (_) {}
				}

				var activeLang = readPref('slugExample.codeLang', 'js');
				var openState  = readPref('slugExample.codeOpen', '0') === '1';
				var height     = parseInt(readPref('slugExample.codeHeight', '280'), 10);
				if (isNaN(height)) height = 280;
				height = Math.max(120, Math.min(height, 800));
				panel.style.setProperty('--code-h', height + 'px');

				function isOpen() { return main.getAttribute('data-code-open') === 'true'; }

				function refresh() {
					if (!isOpen()) return;
					codeEl.textContent = buildSnippet(activeLang);
					codeEl.className = 'hljs language-' + (activeLang === 'ts' ? 'typescript' : 'javascript');
					if (window.hljs && typeof window.hljs.highlightElement === 'function') {
						codeEl.removeAttribute('data-highlighted');
						window.hljs.highlightElement(codeEl);
					}
				}

				function setOpen(open) {
					main.setAttribute('data-code-open', open ? 'true' : 'false');
					writePref('slugExample.codeOpen', open ? '1' : '0');
					if (triggerLbl) triggerLbl.textContent = open ? 'Hide code' : 'Show code';
					trigger.setAttribute('aria-pressed', open ? 'true' : 'false');
					if (open) refresh();
				}

				function setActiveTab(lang) {
					activeLang = lang;
					writePref('slugExample.codeLang', lang);
					tabs.forEach(function (t) {
						t.setAttribute('aria-selected',
							t.getAttribute('data-lang') === lang ? 'true' : 'false');
					});
					refresh();
				}

				// --- Initial state ---
				tabs.forEach(function (t) {
					t.setAttribute('aria-selected',
						t.getAttribute('data-lang') === activeLang ? 'true' : 'false');
				});
				setOpen(openState);

				// --- Wiring ---
				trigger.addEventListener('click', function () { setOpen(!isOpen()); });
				if (closeBtn) closeBtn.addEventListener('click', function () { setOpen(false); });
				tabs.forEach(function (t) {
					t.addEventListener('click', function () {
						setActiveTab(t.getAttribute('data-lang'));
					});
				});

				// Live updates from any sidebar control (no-op while closed).
				var sidebar = document.getElementById('sidebar');
				if (sidebar) {
					var refreshIfOpen = function () { if (isOpen()) refresh(); };
					sidebar.addEventListener('input', refreshIfOpen);
					sidebar.addEventListener('change', refreshIfOpen);
				}

				// --- Resize handle ---
				if (handle) {
					var dragStartY = 0;
					var dragStartH = 0;
					function onMove(e) {
						// Handle is on the TOP edge of the panel; dragging up
						// grows the panel (and shrinks the canvas above it).
						var dy = e.clientY - dragStartY;
						var h = Math.max(120, Math.min(dragStartH - dy, 800));
						panel.style.setProperty('--code-h', h + 'px');
					}
					function onUp() {
						document.removeEventListener('mousemove', onMove);
						document.removeEventListener('mouseup', onUp);
						document.body.style.cursor = '';
						document.body.style.userSelect = '';
						var final = parseInt(panel.style.getPropertyValue('--code-h'), 10);
						if (!isNaN(final)) writePref('slugExample.codeHeight', String(final));
					}
					handle.addEventListener('mousedown', function (e) {
						e.preventDefault();
						dragStartY = e.clientY;
						dragStartH = parseInt(panel.style.getPropertyValue('--code-h'), 10) || height;
						document.addEventListener('mousemove', onMove);
						document.addEventListener('mouseup', onUp);
						document.body.style.cursor = 'row-resize';
						document.body.style.userSelect = 'none';
					});
				}

				// --- Copy ---
				if (copyBtn) {
					copyBtn.addEventListener('click', function () {
						var text = codeEl.textContent || '';
						var done = function () {
							copyBtn.classList.add('copied');
							copyBtn.textContent = 'Copied';
							setTimeout(function () {
								copyBtn.classList.remove('copied');
								copyBtn.textContent = 'Copy';
							}, 1500);
						};
						if (navigator.clipboard && navigator.clipboard.writeText) {
							navigator.clipboard.writeText(text).then(done, fallbackCopy);
						} else {
							fallbackCopy();
						}
						function fallbackCopy() {
							var ta = document.createElement('textarea');
							ta.value = text;
							ta.style.position = 'fixed';
							ta.style.opacity = '0';
							document.body.appendChild(ta);
							ta.select();
							try { document.execCommand('copy'); done(); }
							finally { document.body.removeChild(ta); }
						}
					});
				}
			}

			// --- Snippet generator ---
			//
			// Emits a SlugText construction snippet matching the current
			// sidebar state. Strategy:
			//
			//   1. Walk every control and build a plain JS `options` object
			//      mirroring the SlugTextStyleOptions API surface.
			//   2. Strip every key whose value matches the documented default
			//      (DEFAULTS table below — kept in sync with src/defaults.ts).
			//   3. Pretty-print as a single `new SlugText({...})` call. No
			//      post-construction assignments — every UI-controlled field
			//      lives in the constructor's `options` block.
			//
			// Per-version differences (v6/v7 lack decorations, fill, etc.) are
			// handled by (a) reading from controls that may not exist and (b)
			// feature-detecting against the live `slugText` for shape decisions.

			// SNIPPET_DEFAULTS is module-scoped (above) so it's defined even
			// when the code panel's initial `setOpen(openState)` runs before
			// this point in `start()`. The previous `var` declaration here
			// was hoisted but not initialized, so any code-panel-open
			// localStorage pref caused a TypeError on first refresh.

			function snippetIndent(s, n) {
				var pad = new Array(n + 1).join('\t');
				return s.split('\n').map(function (line) {
					return line.length ? pad + line : line;
				}).join('\n');
			}

			// Deep equality for default-comparison. Handles primitives, arrays,
			// and plain objects — enough for the small value space we deal with.
			function deepEqual(a, b) {
				if (a === b) return true;
				if (a === null || b === null) return false;
				if (typeof a !== typeof b) return false;
				if (Array.isArray(a)) {
					if (!Array.isArray(b) || a.length !== b.length) return false;
					for (var i = 0; i < a.length; i++) {
						if (!deepEqual(a[i], b[i])) return false;
					}
					return true;
				}
				if (typeof a === 'object') {
					var ak = Object.keys(a), bk = Object.keys(b);
					if (ak.length !== bk.length) return false;
					for (var j = 0; j < ak.length; j++) {
						if (!deepEqual(a[ak[j]], b[ak[j]])) return false;
					}
					return true;
				}
				return false;
			}

			function fmtValue(value) {
				if (value === null) return 'null';
				if (value === undefined) return 'undefined';
				if (typeof value === 'boolean' || typeof value === 'number') return String(value);
				if (typeof value === 'string') return JSON.stringify(value);
				if (Array.isArray(value)) {
					var allPrimitive = value.every(function (v) {
						return v === null || typeof v !== 'object';
					});
					if (allPrimitive) {
						return '[' + value.map(fmtValue).join(', ') + ']';
					}
					var arrLines = value.map(function (v) {
						return snippetIndent(fmtValue(v), 1);
					});
					return '[\n' + arrLines.join(',\n') + '\n]';
				}
				if (typeof value === 'object') {
					var keys = Object.keys(value);
					if (keys.length === 0) return '{}';
					var lines = keys.map(function (k) {
						return snippetIndent(k + ': ' + fmtValue(value[k]), 1);
					});
					return '{\n' + lines.join(',\n') + '\n}';
				}
				return String(value);
			}

			// fill values may carry a PIXI.Texture under `source` — replace
			// it with an identifier reference so the snippet doesn't try to
			// stringify the live object.
			function fmtFillValue(fill) {
				if (fill && typeof fill === 'object' && !Array.isArray(fill) && fill.type === 'texture') {
					var clone = {};
					Object.keys(fill).forEach(function (k) {
						clone[k] = (k === 'source') ? '__TEXTURE__' : fill[k];
					});
					return fmtValue(clone).replace(/"__TEXTURE__"/, '/* PIXI.Texture */ texture');
				}
				return fmtValue(fill);
			}

			// Build the decoration value from sidebar controls. Returns the
			// same shape applyDecoration() builds and feeds to SlugText:
			// `false` (disabled), `true` (enabled with all defaults), or a
			// config object with overrides.
			function readDecoration(name) {
				var cap = name.charAt(0).toUpperCase() + name.slice(1);
				var enableEl = document.getElementById('ctrl' + cap);
				if (!enableEl) return null;
				if (!enableEl.checked) return false;
				var colorAuto = document.getElementById('ctrl' + cap + 'ColorAuto').checked;
				var thicknessAuto = document.getElementById('ctrl' + cap + 'ThicknessAuto').checked;
				var length = parseFloat(document.getElementById('ctrl' + cap + 'Length').value);
				if (isNaN(length)) length = 1;
				var align = document.getElementById('ctrl' + cap + 'Align').value;
				if (colorAuto && thicknessAuto && length === 1 && align === 'start') return true;
				var cfg = {};
				if (!colorAuto) cfg.color = hexToRGBA(document.getElementById('ctrl' + cap + 'Color').value);
				if (!thicknessAuto) cfg.thickness = parseFloat(document.getElementById('ctrl' + cap + 'Thickness').value) || 1;
				if (length !== 1) cfg.length = length;
				if (align !== 'start') cfg.align = align;
				return cfg;
			}

			function readStroke() {
				if (!document.getElementById('ctrlStroke').checked) return null;
				var stroke = {
					width: parseFloat(document.getElementById('ctrlStrokeWidth').value) || 0
				};
				var color = hexToRGBA(document.getElementById('ctrlStrokeColor').value);
				if (!deepEqual(color, [0, 0, 0, 1])) stroke.color = color;
				var alphaMode = document.getElementById('ctrlStrokeAlphaMode').value;
				if (alphaMode !== 'uniform') {
					stroke.alphaMode = alphaMode;
					var alphaStart = parseFloat(document.getElementById('ctrlStrokeAlphaStart').value);
					if (alphaStart !== 1) stroke.alphaStart = alphaStart;
					var alphaRate = parseFloat(document.getElementById('ctrlStrokeAlphaRate').value);
					if (alphaRate !== 0) stroke.alphaRate = alphaRate;
				}
				return stroke;
			}

			function readDropShadow() {
				if (!document.getElementById('ctrlShadow').checked) return null;
				var shadow = {};
				var distance = parseFloat(document.getElementById('ctrlShadowDist').value);
				if (distance !== 5) shadow.distance = distance;
				var angle = (parseFloat(document.getElementById('ctrlShadowAngle').value) || 0) * Math.PI / 180;
				if (Math.abs(angle - Math.PI / 6) > 1e-9) shadow.angle = angle;
				var color = hexToRGBA(document.getElementById('ctrlShadowColor').value);
				if (!deepEqual(color, [0, 0, 0, 1])) shadow.color = color;
				var alpha = parseFloat(document.getElementById('ctrlShadowAlpha').value);
				if (alpha !== 1) shadow.alpha = alpha;
				var blur = parseFloat(document.getElementById('ctrlShadowBlur').value);
				if (blur !== 0) shadow.blur = blur;
				return shadow; // may be empty == "use all defaults"
			}

			// Collect every UI-controlled options field as a plain object,
			// then strip keys whose value matches SNIPPET_DEFAULTS.
			function buildOptionsObject() {
				var raw = {};

				var fontSize = parseInt(document.getElementById('ctrlFontSize').value, 10);
				if (!isNaN(fontSize)) raw.fontSize = fontSize;

				raw.fill = buildFillInput();

				var directionEl = document.getElementById('ctrlDirection');
				if (directionEl) raw.direction = directionEl.value;

				var alignEl = document.getElementById('ctrlAlign');
				if (alignEl) raw.align = alignEl.value;

				var textJustifyEl = document.getElementById('ctrlTextJustify');
				// Only relevant when align === 'justify'; skip otherwise.
				if (textJustifyEl && raw.align === 'justify') {
					raw.textJustify = textJustifyEl.value;
				}

				raw.wordWrap = document.getElementById('ctrlWordWrap').checked;
				if (raw.wordWrap) {
					raw.wordWrapWidth = parseFloat(document.getElementById('ctrlWrapWidth').value) || 400;
					raw.breakWords = document.getElementById('ctrlBreakWords').checked;
				}

				// Decorations — only on versions that expose them.
				['underline', 'strikethrough', 'overline'].forEach(function (name) {
					if (slugText && !(name in slugText)) return;
					var v = readDecoration(name);
					if (v === null) return; // control absent on this version
					raw[name] = v;
				});

				var stroke = readStroke();
				if (stroke) raw.stroke = stroke;

				var dropShadow = readDropShadow();
				if (dropShadow) raw.dropShadow = dropShadow;

				// Drop keys matching documented defaults.
				var trimmed = {};
				Object.keys(raw).forEach(function (k) {
					if (k in SNIPPET_DEFAULTS && deepEqual(raw[k], SNIPPET_DEFAULTS[k])) return;
					trimmed[k] = raw[k];
				});
				return trimmed;
			}

			// Pretty-print options. Only `fill` needs special handling for
			// the texture placeholder; everything else routes through fmtValue.
			function fmtOptions(opts) {
				var keys = Object.keys(opts);
				if (keys.length === 0) return '{}';
				var lines = keys.map(function (k) {
					var v = (k === 'fill') ? fmtFillValue(opts[k]) : fmtValue(opts[k]);
					return snippetIndent(k + ': ' + v, 1);
				});
				return '{\n' + lines.join(',\n') + '\n}';
			}

			// Render the snippet for the requested language. JS uses the
			// `pixiSlug.SlugText` global form (matches what the example page
			// itself does); TS adds an import line and uses the bare class.
			function buildSnippet(lang) {
				var fontUrl = (document.getElementById('ctrlFont') || {}).value || 'font.ttf';
				var text    = document.getElementById('ctrlText').value;
				var opts    = buildOptionsObject();

				var ctor = {text: text, font: fontUrl};
				if (Object.keys(opts).length > 0) ctor.options = opts;

				var ctorKeys = Object.keys(ctor);
				var ctorLines = ctorKeys.map(function (k) {
					var v = (k === 'options') ? fmtOptions(ctor[k]) : fmtValue(ctor[k]);
					return snippetIndent(k + ': ' + v, 1);
				});
				var ctorStr = '{\n' + ctorLines.join(',\n') + '\n}';

				var rotationDeg = parseFloat(document.getElementById('ctrlRotation').value) || 0;
				var tail = 'slugText.position.set(10, 10);';
				if (rotationDeg !== 0) {
					tail += '\nslugText.rotation = ' + rotationDeg + ' * Math.PI / 180;';
				}

				if (lang === 'ts') {
					return (
						"import {SlugText} from 'pixi-slug';\n" +
						'\n' +
						'const slugText = new SlugText(' + ctorStr + ');\n' +
						tail
					);
				}
				return (
					'const slugText = new pixiSlug.SlugText(' + ctorStr + ');\n' +
					tail
				);
			}
		}
	}

	/**
	 * Construct one MathText below the existing SlugText on the example
	 * page and bind the sidebar's Math group to it.
	 *
	 * `opts.MathText` and `opts.mathBuilder` must come from the
	 * version-specific bundle (`pixiSlug.MathText`, `pixiSlug.mathBuilder`
	 * on v8 — undefined on v6/v7 until those ports land). `opts.addToStage`
	 * / `opts.removeFromStage` mirror the SlugText callbacks. Returns the
	 * constructed MathText, or `null` when MathText is unavailable on this
	 * version (graceful no-op for v6/v7 pages).
	 */
	function runMathText(opts) {
		var MathText = opts.MathText;
		var mathBuilder = opts.mathBuilder;
		if (!MathText || !mathBuilder) {
			document.querySelectorAll('[data-requires="mathText"]').forEach(function (el) {
				el.remove();
			});
			return null;
		}

		// The sidebar is fetched async by `run()`; runMathText is usually
		// invoked synchronously right after `run()` so its controls may
		// not be in the DOM yet. Wait for them to appear before wiring.
		var presetEl = document.getElementById('ctrlMathPreset');
		if (!presetEl) {
			var waited = 0;
			var timer = setInterval(function () {
				if (document.getElementById('ctrlMathPreset')) {
					clearInterval(timer);
					runMathText(opts);
				} else if ((waited += 50) > 5000) {
					clearInterval(timer);
					console.warn('[SlugExample.runMathText] sidebar Math group never appeared');
				}
			}, 50);
			return null;
		}

		var addToStage = opts.addToStage;
		var removeFromStage = opts.removeFromStage;
		var getFontUrl = opts.getFontUrl || function () { return null; };
		var getSlugText = opts.getSlugText || function () { return null; };
		var presets = window.SlugMathPresets || {};

		var sizeEl   = document.getElementById('ctrlMathSize');
		var alignEl  = document.getElementById('ctrlMathAlign');
		var lineEl   = document.getElementById('ctrlMathLineSpacing');
		var useBodyEl = document.getElementById('ctrlMathUseBodyFont');
		var fillEl   = document.getElementById('ctrlMathFill');

		if (!sizeEl || !alignEl) return null;

		var mathText = null;

		function fillRgba() {
			return hexToRGBA(fillEl ? fillEl.value : '#ffffff');
		}

		function buildFormula(name) {
			var fn = presets[name] || presets.quadratic;
			return MathText.build(fn);
		}

		function construct() {
			if (mathText && !mathText.destroyed) {
				removeFromStage(mathText);
				mathText.destroy();
			}
			var fontUrl = useBodyEl && useBodyEl.checked ? getFontUrl() : null;
			mathText = new MathText({
				formula: buildFormula(presetEl.value),
				font: fontUrl,
				fontSize: parseFloat(sizeEl.value) || 48,
				options: {fill: fillRgba()},
				align: alignEl.value,
				lineSpacing: parseFloat(lineEl.value) || 1.2
			});
			addToStage(mathText);
			placeBelowSlugText();
		}

		function placeBelowSlugText() {
			if (!mathText || mathText.destroyed) return;
			var st = getSlugText();
			// Fallback when the SlugText isn't constructed yet (font still
			// loading): drop the math below where a default-size SlugText
			// would sit, so the formula is visible immediately on first
			// page load.
			if (!st) {
				mathText.position.set(10, 200);
				return;
			}
			var baseX = st.x || 10;
			var stH = (st.height && st.height > 1) ? st.height : (st.fontSize || 120) * 1.2;
			var baseY = (st.y || 10) + stH + 32;
			mathText.position.set(baseX, baseY);
		}

		function applyAll() {
			if (!mathText) return;
			mathText.fontSize = parseFloat(sizeEl.value) || 48;
			mathText.align = alignEl.value;
			mathText.lineSpacing = parseFloat(lineEl.value) || 1.2;
			mathText.fill = fillRgba();
			placeBelowSlugText();
		}

		presetEl.onchange = function () {
			mathText.formula = buildFormula(presetEl.value);
			placeBelowSlugText();
		};
		linkSlider('ctrlMathSize', 'ctrlMathSizeVal', function () { applyAll(); });
		linkSlider('ctrlMathLineSpacing', 'ctrlMathLineSpacingVal', function () { applyAll(); });
		alignEl.onchange = applyAll;
		if (fillEl) fillEl.oninput = applyAll;
		if (useBodyEl) useBodyEl.onchange = construct;

		construct();

		// Keep the math text glued to the bottom of the SlugText as the
		// SlugText resizes via sidebar controls. Polling each frame is
		// cheap; alternative would be to expose a "bbox changed" signal
		// on SlugText, which doesn't exist today. Also re-construct
		// once when the SlugText's font URL first becomes available so
		// MathText picks up the body font (the initial construct() ran
		// before `loadFont` resolved).
		var lastFontUrl = getFontUrl();
		var raf = function () {
			var cur = getFontUrl();
			if (useBodyEl && useBodyEl.checked && cur && cur !== lastFontUrl) {
				lastFontUrl = cur;
				construct();
			}
			placeBelowSlugText();
			requestAnimationFrame(raf);
		};
		requestAnimationFrame(raf);

		return mathText;
	}

	window.SlugExample = {run: run, runMathText: runMathText, _current: null};
})();
