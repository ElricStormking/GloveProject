// Phaser is loaded globally
// GameStateManager is loaded globally

window.LoadingScene = class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
        console.log('LoadingScene constructor called');
    }
    
    preload() {
        console.log('LoadingScene preload started');
        // Initialize game state manager
        this.game.stateManager = new window.GameStateManager();
        console.log('GameStateManager initialized');
        
        // Create loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000);
        
        // Title
        const title = this.add.text(width / 2, height / 2 - 100, 'INFINITY STORM', {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            stroke: '#6B46C1',
            strokeThickness: 6
        });
        title.setOrigin(0.5);
        
        // Progress bar background
        const progressBox = this.add.graphics();
        const progressBar = this.add.graphics();
        
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 320, height / 2 - 25, 640, 50);
        
        // Loading text
        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 + 50,
            text: 'Loading...',
            style: {
                font: '20px Arial',
                color: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5);
        
        // Asset text
        const assetText = this.make.text({
            x: width / 2,
            y: height / 2 + 100,
            text: '',
            style: {
                font: '18px Arial',
                color: '#ffffff'
            }
        });
        assetText.setOrigin(0.5);
        
        // Update progress bar
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x9B59B6, 1);
            progressBar.fillRect(width / 2 - 315, height / 2 - 20, 630 * value, 40);
            loadingText.setText(`Loading... ${Math.round(value * 100)}%`);
        });
        
        this.load.on('fileprogress', (file) => {
            assetText.setText('Loading: ' + file.key);
        });
        
        this.load.on('complete', () => {
            console.log('All assets loaded successfully!');
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            assetText.destroy();
        });
        
        this.load.on('loaderror', (file) => {
            console.error('Failed to load:', file.key, file.src);
            assetText.setText('Error loading: ' + file.key);
        });
        
        // Load game assets - actual gem images and placeholder textures
        this.loadGameAssets();
        
        // Add a timeout to force loading to complete if it hangs
        this.time.delayedCall(5000, () => {
            if (!this.load.isLoading()) return; // Already finished
            console.warn('Loading timeout - forcing completion');
            assetText.setText('Loading timeout - continuing...');
            this.load.removeAllListeners();
            
            // Ensure all essential textures exist before continuing
            this.ensureAllTexturesExist();
            
            this.time.delayedCall(500, () => {
                this.scene.start('MenuScene');
            });
        });
    }
    
    loadGameAssets() {
        // First, create all essential textures immediately to ensure they exist
        this.createEssentialTextures();
        
        // Then try to load actual gem images with fallbacks
        this.loadImageWithFallback('space_gem', 'assets/images/space_gem.png', 0x0099FF);
        this.loadImageWithFallback('mind_gem', 'assets/images/mind_gem.png', 0x00FFFF);
        this.loadImageWithFallback('reality_gem', 'assets/images/reality_gem.png', 0xFF0000);
        this.loadImageWithFallback('power_gem', 'assets/images/power_gem.png', 0x9932CC);
        this.loadImageWithFallback('time_gem', 'assets/images/time_gem.png', 0x00FF00);
        this.loadImageWithFallback('soul_gem', 'assets/images/soul_gem.png', 0xFF8C00);
        this.loadImageWithFallback('infinity_glove', 'assets/images/infinity_glove.png', 0xFFD700);
        
        // Load character portrait images with fallbacks
        this.loadImageWithFallback('portrait_thanos', 'assets/images/portrait_thanos.png', 0x4B0082);
        this.loadImageWithFallback('portrait_scarlet_witch', 'assets/images/portrait_scarlet_witch.png', 0xDC143C);
        
        // Load character symbol images with fallbacks (for game symbols)
        this.loadImageWithFallback('thanos', 'assets/images/thanos.png', 0x4B0082);
        this.loadImageWithFallback('scarlet_witch', 'assets/images/scarlet_witch.png', 0xDC143C);
        
        // Load custom background
        this.loadImageWithFallback('bg_infinity_storm', 'assets/images/BG_infinity_storm.png', 0x1a1a2e);
        
        // Load custom background music
        this.load.audio('bgm_infinity_storm', 'assets/audio/BGM_infinity_storm.mp3');
        
        // Audio loading enabled for custom background music
        console.log('Loading custom background music: BGM_infinity_storm.mp3');
    }
    
    createEssentialTextures() {
        console.log('Creating essential textures...');
        
        // Create all required textures immediately
        const textures = {
            'scarlet_magic_spell': { color: 0xFF1493, text: 'SCARLET MAGIC SPELL' },
            'button': null,
            'background': null,
            'particle': null
        };
        
        // Generate symbol textures
        Object.keys(textures).forEach(key => {
            try {
                let textureData;
                if (textures[key] === null) {
                    // Special textures
                    switch(key) {
                        case 'button':
                            textureData = this.generateButtonTexture();
                            break;
                        case 'background':
                            textureData = this.generateBackgroundTexture();
                            break;
                        case 'particle':
                            textureData = this.generateParticleTexture();
                            break;
                    }
                } else {
                    // Symbol textures
                    textureData = this.generateColoredTexture(textures[key].color, textures[key].text);
                }
                
                // Add texture to loader
                this.textures.addBase64(key, textureData);
                console.log(`Created essential texture: ${key}`);
            } catch (error) {
                console.error(`Failed to create texture ${key}:`, error);
                // Create minimal fallback
                this.textures.addBase64(key, this.generateMinimalTexture());
            }
        });
    }
    
    loadImageWithFallback(key, path, fallbackColor) {
        // Try to load the image
        this.load.image(key, path);
        
        // Set up error handler for this specific image
        this.load.once(`fileerror-image-${key}`, () => {
            console.warn(`Failed to load ${key}, using fallback`);
            // Create fallback texture
            const fallbackTexture = this.generateColoredTexture(fallbackColor, key.replace(/_/g, ' ').toUpperCase());
            this.textures.addBase64(key, fallbackTexture);
        });
    }
    
    generateMinimalTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        // Simple gray square
        ctx.fillStyle = '#666666';
        ctx.fillRect(0, 0, 100, 100);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, 98, 98);
        
        return canvas.toDataURL();
    }
    
    generateColoredTexture(color, text) {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        // Draw colored square
        ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        ctx.fillRect(0, 0, 100, 100);
        
        // Add border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, 96, 96);
        
        // Add text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const displayText = text.replace(/_/g, ' ').toUpperCase();
        const words = displayText.split(' ');
        
        // Handle different numbers of words
        if (words.length === 1) {
            ctx.fillText(words[0], 50, 50);
        } else if (words.length === 2) {
            ctx.fillText(words[0], 50, 40);
            ctx.fillText(words[1], 50, 60);
        } else if (words.length === 3) {
            ctx.fillText(words[0], 50, 30);
            ctx.fillText(words[1], 50, 50);
            ctx.fillText(words[2], 50, 70);
        } else {
            // Too many words, just show first two
            ctx.fillText(words[0], 50, 40);
            ctx.fillText(words.slice(1).join(' '), 50, 60);
        }
        
        return canvas.toDataURL();
    }
    
    generateButtonTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 60);
        gradient.addColorStop(0, '#9B59B6');
        gradient.addColorStop(1, '#6B46C1');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 200, 60);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, 198, 58);
        
        return canvas.toDataURL();
    }
    
    generateBackgroundTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Create a simple pattern
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, 32, 32);
        
        ctx.fillStyle = '#16213e';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillRect(16, 16, 16, 16);
        
        return canvas.toDataURL();
    }
    
    generateParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        
        // Create a radial gradient circle for particle
        const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(8, 8, 8, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas.toDataURL();
    }
    
    ensureAllTexturesExist() {
        console.log('Ensuring all textures exist...');
        const requiredTextures = [
            'space_gem', 'mind_gem', 'reality_gem', 'power_gem', 'time_gem', 'soul_gem',
            'infinity_glove', 'thanos', 'scarlet_witch', 'scarlet_magic_spell',
            'portrait_thanos', 'portrait_scarlet_witch', 'bg_infinity_storm',
            'button', 'background', 'particle'
        ];
        
        requiredTextures.forEach(key => {
            if (!this.textures.exists(key)) {
                console.warn(`Texture ${key} missing, creating fallback`);
                this.textures.addBase64(key, this.generateMinimalTexture());
            }
        });
    }
    
    create() {
        console.log('LoadingScene create() called - transitioning to MenuScene');
        // Add a short delay before transitioning
        this.time.delayedCall(500, () => {
            console.log('Starting MenuScene...');
            this.scene.start('MenuScene');
        });
    }
} 