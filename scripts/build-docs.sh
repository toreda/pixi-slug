#!/bin/bash
# Build all bundles and copy examples + dist to docs/ for GitHub Pages.
# Run from project root: bash scripts/build-docs.sh

set -e

echo "Building all versions..."
npx webpack --config webpack.config.ts --env version=v6 --env target=prod
npx webpack --config webpack.config.ts --env version=v7 --env target=prod
npx webpack --config webpack.config.ts --env version=v8 --env target=prod

echo "Cleaning docs/..."
rm -rf docs
mkdir -p docs/dist/v6 docs/dist/v7 docs/dist/v8
mkdir -p docs/v6 docs/v7 docs/v8 docs/comparison

echo "Copying bundles..."
cp dist/v6/index.js docs/dist/v6/
cp dist/v7/index.js docs/dist/v7/
cp dist/v8/index.js docs/dist/v8/

echo "Copying examples..."
cp examples/v6/index.html docs/v6/
cp examples/v6/font.ttf docs/v6/ 2>/dev/null || true
cp examples/v7/index.html docs/v7/
cp examples/v7/font.ttf docs/v7/ 2>/dev/null || true
cp examples/v8/index.html docs/v8/
cp examples/v8/font.ttf docs/v8/ 2>/dev/null || true
cp examples/comparison/index.html docs/comparison/
cp examples/comparison/font.ttf docs/comparison/ 2>/dev/null || true

echo "Fixing paths in docs/..."
# Fix font fetch paths: absolute → relative
sed -i "s|fetch('/examples/v6/font.ttf')|fetch('./font.ttf')|g" docs/v6/index.html
sed -i "s|fetch('/examples/v7/font.ttf')|fetch('./font.ttf')|g" docs/v7/index.html
sed -i "s|fetch('/examples/v8/font.ttf')|fetch('./font.ttf')|g" docs/v8/index.html
sed -i "s|fetch('/examples/comparison/font.ttf')|fetch('./font.ttf')|g" docs/comparison/index.html

# Fix bundle paths: ../../dist/vN/index.js → ../dist/vN/index.js
sed -i 's|../../dist/v6/index.js|../dist/v6/index.js|g' docs/v6/index.html
sed -i 's|../../dist/v7/index.js|../dist/v7/index.js|g' docs/v7/index.html
sed -i 's|../../dist/v8/index.js|../dist/v8/index.js|g' docs/v8/index.html
sed -i 's|../../dist/v8/index.js|../dist/v8/index.js|g' docs/comparison/index.html

echo "Creating docs/index.html..."
cat > docs/index.html << 'INDEXEOF'
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>pixi-slug — Examples</title>
	<style>
		body { font-family: sans-serif; max-width: 600px; margin: 40px auto; color: #333; }
		h1 { margin-bottom: 8px; }
		p { color: #666; margin-bottom: 24px; }
		a { display: block; padding: 12px 16px; margin: 8px 0; background: #f0f0f0; border-radius: 6px; text-decoration: none; color: #16213e; }
		a:hover { background: #e0e0f0; }
		small { color: #999; }
	</style>
</head>
<body>
	<h1>pixi-slug Examples</h1>
	<p>GPU-accelerated text rendering for PixiJS using the Slug algorithm.</p>
	<a href="comparison/">Font Rendering Comparison <small>— pixi-slug vs Text vs BitmapText</small></a>
	<a href="v8/">PixiJS v8 Example</a>
	<a href="v7/">PixiJS v7 Example</a>
	<a href="v6/">PixiJS v6 Example</a>
</body>
</html>
INDEXEOF

echo "Done. docs/ is ready for GitHub Pages."
echo "Configure GitHub Pages to serve from /docs on the main branch."
