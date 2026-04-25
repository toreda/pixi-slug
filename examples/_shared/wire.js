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

	function hexToRGBA(hex) {
		var r = parseInt(hex.slice(1, 3), 16) / 255;
		var g = parseInt(hex.slice(3, 5), 16) / 255;
		var b = parseInt(hex.slice(5, 7), 16) / 255;
		return [r, g, b, 1];
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
					var options = {
						fontSize: parseInt(document.getElementById('ctrlFontSize').value, 10) || 48,
						fill: hexToRGBA(document.getElementById('ctrlFillColor').value)
					};
					if (directionEl) options.direction = directionEl.value;

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

			document.getElementById('ctrlFillColor').oninput = function () {
				if (slugText) slugText.color = hexToRGBA(this.value);
			};

			document.getElementById('ctrlWordWrap').onchange = applyWordWrap;
			document.getElementById('ctrlBreakWords').onchange = applyWordWrap;
			linkSlider('ctrlWrapWidth', 'ctrlWrapWidthVal', applyWordWrap);

			var directionEl = document.getElementById('ctrlDirection');
			if (directionEl) {
				directionEl.onchange = function () {
					if (slugText && 'direction' in slugText) slugText.direction = this.value;
				};
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
