# GitHub Pages Setup for Infinity Storm

## Quick Setup

1. Go to your GitHub repository: https://github.com/ElricStormking/GloveProject
2. Click **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select "Deploy from a branch"
5. Choose **main** branch and **/ (root)** folder
6. Click **Save**

## Your Game URLs

Once GitHub Pages is enabled, your game will be available at:

- **Main Game**: `https://elricstormking.github.io/GloveProject/infinity-storm/`
- **Repository**: `https://github.com/ElricStormking/GloveProject`

## How It Works

✅ **No Server Required**: The game now loads Phaser.js from CDN with local fallback  
✅ **Direct Play**: Works directly in any modern web browser  
✅ **Mobile Friendly**: Responsive design works on phones and tablets  
✅ **Offline Capable**: Includes local phaser.min.js as backup  

## Technical Details

- **Phaser.js**: Loaded from CDN (https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js)
- **Fallback**: Local phaser.min.js file if CDN fails
- **No Build Process**: Pure JavaScript, no compilation needed
- **CORS Safe**: All modules loaded as global variables

## Sharing Your Game

Share this link with anyone to play your game:
`https://elricstormking.github.io/GloveProject/infinity-storm/`

No installation or server setup required! 