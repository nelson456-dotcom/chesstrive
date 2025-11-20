#!/usr/bin/env node

/**
 * Script to convert bot avatar images from PNG to WebP format
 * 
 * This script:
 * 1. Converts all PNG images in frontend/public/images/bots/ to WebP
 * 2. Updates PlayWithBotPage.js to use WebP images
 * 
 * Usage:
 *   node scripts/convert-bot-images-to-webp.js
 * 
 * Requirements:
 *   npm install sharp --save-dev
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const BOTS_DIR = path.join(__dirname, '../frontend/public/images/bots');
const COMPONENT_FILE = path.join(__dirname, '../frontend/src/components/PlayWithBotPage.js');

// Quality settings for WebP (0-100, higher = better quality but larger file)
const WEBP_QUALITY = 85;

async function convertImageToWebP(inputPath, outputPath) {
  try {
    console.log(`Converting ${path.basename(inputPath)} to WebP...`);
    
    await sharp(inputPath)
      .webp({ quality: WEBP_QUALITY })
      .toFile(outputPath);
    
    // Get file sizes for comparison
    const originalSize = fs.statSync(inputPath).size;
    const webpSize = fs.statSync(outputPath).size;
    const savings = ((1 - webpSize / originalSize) * 100).toFixed(1);
    
    console.log(`  ✓ Converted: ${(originalSize / 1024).toFixed(2)} KB → ${(webpSize / 1024).toFixed(2)} KB (${savings}% smaller)`);
    
    return true;
  } catch (error) {
    console.error(`  ✗ Error converting ${inputPath}:`, error.message);
    return false;
  }
}

async function convertAllBotImages() {
  console.log('🖼️  Converting bot images to WebP format...\n');
  
  if (!fs.existsSync(BOTS_DIR)) {
    console.error(`❌ Error: Bots directory not found: ${BOTS_DIR}`);
    process.exit(1);
  }
  
  // Read all PNG files
  const files = fs.readdirSync(BOTS_DIR)
    .filter(file => file.toLowerCase().endsWith('.png'))
    .sort((a, b) => {
      // Sort by number (bot1.png, bot2.png, etc.)
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      return numA - numB;
    });
  
  if (files.length === 0) {
    console.log('⚠️  No PNG files found in bots directory');
    return;
  }
  
  console.log(`Found ${files.length} PNG files to convert:\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  // Convert each PNG to WebP
  for (const file of files) {
    const inputPath = path.join(BOTS_DIR, file);
    const outputPath = path.join(BOTS_DIR, file.replace(/\.png$/i, '.webp'));
    
    const success = await convertImageToWebP(inputPath, outputPath);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log(`\n✅ Conversion complete!`);
  console.log(`   Success: ${successCount} files`);
  if (failCount > 0) {
    console.log(`   Failed: ${failCount} files`);
  }
}

async function updateComponentFile() {
  console.log('\n📝 Updating PlayWithBotPage.js to use WebP images...\n');
  
  if (!fs.existsSync(COMPONENT_FILE)) {
    console.error(`❌ Error: Component file not found: ${COMPONENT_FILE}`);
    return;
  }
  
  let content = fs.readFileSync(COMPONENT_FILE, 'utf8');
  let updated = false;
  
  // Replace all .png references with .webp in avatar paths
  const pngPattern = /(avatar:\s*['"]\/images\/bots\/bot\d+)\.png(['"])/g;
  const matches = content.match(pngPattern);
  
  if (matches) {
    content = content.replace(pngPattern, '$1.webp$2');
    updated = true;
    console.log(`   ✓ Updated ${matches.length} avatar references from .png to .webp`);
  } else {
    console.log('   ℹ️  No .png avatar references found (may already be updated)');
  }
  
  if (updated) {
    fs.writeFileSync(COMPONENT_FILE, content, 'utf8');
    console.log(`\n✅ Component file updated successfully!`);
  }
}

async function main() {
  try {
    // Check if sharp is installed
    try {
      require.resolve('sharp');
    } catch (e) {
      console.error('❌ Error: sharp package not found.');
      console.error('   Please install it with: npm install sharp --save-dev');
      process.exit(1);
    }
    
    // Convert images
    await convertAllBotImages();
    
    // Update component file
    await updateComponentFile();
    
    console.log('\n🎉 All done! Bot images have been converted to WebP format.');
    console.log('\n📋 Next steps:');
    console.log('   1. Review the converted images');
    console.log('   2. Test the play-with-bot page');
    console.log('   3. Commit the changes to Git');
    console.log('   4. Rebuild the frontend on your VPS');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();

