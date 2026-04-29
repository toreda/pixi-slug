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
	function pruneUnsupported(sidebar, slugText) {
		sidebar.querySelectorAll('[data-requires]').forEach(function (el) {
			var prop = el.getAttribute('data-requires');
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

			await loadFont(fontSelect.value);
		}
	}

	window.SlugExample = {run: run};
})();
