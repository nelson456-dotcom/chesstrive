# Convert Bot Images to WebP

This script converts all bot avatar images from PNG to WebP format for better performance and smaller file sizes.

## Prerequisites

Install the `sharp` package (image processing library):

```bash
npm install sharp --save-dev
```

Or if you're in the root directory:

```bash
cd chessrep-main
npm install sharp --save-dev
```

## Usage

Run the script from the project root:

```bash
node scripts/convert-bot-images-to-webp.js
```

Or from the chessrep-main directory:

```bash
cd chessrep-main
node ../scripts/convert-bot-images-to-webp.js
```

## What the Script Does

1. **Converts Images**: Converts all PNG files in `frontend/public/images/bots/` to WebP format
   - Input: `bot1.png`, `bot2.png`, ..., `bot16.png`
   - Output: `bot1.webp`, `bot2.webp`, ..., `bot16.webp`

2. **Updates Component**: Automatically updates `PlayWithBotPage.js` to use `.webp` instead of `.png`

3. **Shows Statistics**: Displays file size savings for each converted image

## Example Output

```
🖼️  Converting bot images to WebP format...

Found 16 PNG files to convert:

Converting bot1.png to WebP...
  ✓ Converted: 45.23 KB → 12.34 KB (72.7% smaller)
Converting bot2.png to WebP...
  ✓ Converted: 48.12 KB → 13.45 KB (72.0% smaller)
...

✅ Conversion complete!
   Success: 16 files

📝 Updating PlayWithBotPage.js to use WebP images...

   ✓ Updated 16 avatar references from .png to .webp

✅ Component file updated successfully!

🎉 All done! Bot images have been converted to WebP format.
```

## After Running the Script

1. **Review the converted images** in `frontend/public/images/bots/`
2. **Test the play-with-bot page** to ensure images load correctly
3. **Commit the changes** to Git:
   ```bash
   git add frontend/public/images/bots/*.webp
   git add frontend/src/components/PlayWithBotPage.js
   git commit -m "Convert bot images to WebP format for better performance"
   git push origin main
   ```
4. **Rebuild the frontend on your VPS**:
   ```bash
   cd /var/www/chessrep/chessrep-main/frontend
   rm -rf build
   HUSKY=0 npm run build
   sudo systemctl reload nginx
   ```

## WebP Quality Settings

The script uses a quality setting of 85 (on a scale of 0-100). This provides:
- Excellent visual quality (virtually indistinguishable from PNG)
- Significant file size reduction (typically 60-80% smaller)
- Better page load performance

You can modify the `WEBP_QUALITY` constant in the script if you want to adjust the quality/size tradeoff.

## Troubleshooting

### Error: sharp package not found
```bash
npm install sharp --save-dev
```

### Error: Cannot find module 'sharp'
Make sure you're running the script from the correct directory and that sharp is installed.

### Images not loading after conversion
1. Clear browser cache
2. Verify WebP files exist in `frontend/public/images/bots/`
3. Check that `PlayWithBotPage.js` was updated correctly
4. Rebuild the frontend

## Notes

- Original PNG files are kept (not deleted) so you can revert if needed
- WebP is supported by all modern browsers (Chrome, Firefox, Safari, Edge)
- The script automatically handles file paths and updates the component

