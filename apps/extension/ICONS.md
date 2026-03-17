# Icon Generation

The extension requires PNG icons for browser toolbar display. 

## Required Sizes

- 16x16 (toolbar)
- 32x32 (toolbar @2x)
- 48x48 (extensions page)
- 128x128 (Chrome Web Store)

## Generate Using

### ImageMagick (recommended)
```bash
convert -background none icons/icon.svg -resize 16x16 icons/icon16.png
convert -background none icons/icon.svg -resize 32x32 icons/icon32.png
convert -background none icons/icon.svg -resize 48x48 icons/icon48.png
convert -background none icons/icon.svg -resize 128x128 icons/icon128.png
```

### Online Tools
Use https://realfavicongenerator.net to generate all required sizes from the SVG.

### Manual
Export the SVG at each required size using Figma, Sketch, or Inkscape.

## Current Status

Currently using placeholder configuration. For production:
1. Generate PNG icons
2. Update manifest.json to reference PNG files
