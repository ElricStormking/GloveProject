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
        this.time.delayedCall(10000, () => {
            if (!this.load.isLoading()) return; // Already finished
            console.warn('Loading timeout - forcing completion');
            assetText.setText('Loading timeout - continuing...');
            this.load.removeAllListeners();
            this.time.delayedCall(1000, () => {
                this.scene.start('MenuScene');
            });
        });
    }
    
    loadGameAssets() {
        // Load actual gem images
        this.load.image('space_gem', 'assets/images/space_gem.png');
        this.load.image('mind_gem', 'assets/images/mind_gem.png');
        this.load.image('reality_gem', 'assets/images/reality_gem.png');
        this.load.image('power_gem', 'assets/images/power_gem.png');
        this.load.image('time_gem', 'assets/images/time_gem.png');
        this.load.image('soul_gem', 'assets/images/soul_gem.png');
        
        // Load actual Infinity Glove image
        this.load.image('infinity_glove', 'assets/images/infinity_glove.png');
        
        // Create colored rectangles for remaining symbols
        const placeholderColors = {
            thanos: 0x4B0082,         // Indigo
            scarlet_witch: 0xDC143C,  // Crimson
            scarlet_magic_spell: 0xFF1493 // Deep Pink
        };
        
        // Generate placeholder textures for non-gem symbols
        Object.keys(placeholderColors).forEach(key => {
            console.log(`Generating placeholder texture for: ${key}`);
            try {
                const texture = this.generateColoredTexture(placeholderColors[key], key);
                this.load.image(key, texture);
                console.log(`Successfully generated texture for: ${key}`);
            } catch (error) {
                console.error(`Failed to generate texture for ${key}:`, error);
                // Create a simple fallback
                this.load.image(key, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
            }
        });
        
        // Skip audio loading for now - we'll handle this in the sound system
        console.log('Skipping audio loading - using silent fallbacks');
        
        // Create button texture
        this.load.image('button', this.generateButtonTexture());
        
        // Create background texture
        this.load.image('background', this.generateBackgroundTexture());
        
        // Create particle texture
        this.load.image('particle', this.generateParticleTexture());
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
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const displayText = text.replace(/_/g, ' ').toUpperCase();
        const words = displayText.split(' ');
        
        if (words.length > 1) {
            ctx.fillText(words[0], 50, 40);
            ctx.fillText(words[1], 50, 60);
        } else {
            ctx.fillText(displayText, 50, 50);
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
    

    
    create() {
        console.log('LoadingScene create() called - transitioning to MenuScene');
        // Add a short delay before transitioning
        this.time.delayedCall(500, () => {
            console.log('Starting MenuScene...');
            this.scene.start('MenuScene');
        });
    }
} 