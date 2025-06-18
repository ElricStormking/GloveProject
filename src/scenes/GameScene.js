// Phaser is loaded globally
// All classes are loaded globally

window.GameScene = class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    create() {
        this.stateManager = this.game.stateManager;
        this.stateManager.setState(this.stateManager.states.PLAYING);
        
        // Create custom cosmic background
        const bg = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'bg_infinity_storm');
        bg.setOrigin(0.5, 0.5);
        
        // Scale the background to cover the entire screen while maintaining aspect ratio
        const scaleX = this.cameras.main.width / bg.width;
        const scaleY = this.cameras.main.height / bg.height;
        const scale = Math.max(scaleX, scaleY); // Use the larger scale to ensure full coverage
        bg.setScale(scale);
        bg.setDepth(-10); // Ensure it's behind everything
        
        // Initialize grid manager
        this.gridManager = new window.GridManager(this);
        
        // Initialize win calculator
        this.winCalculator = new window.WinCalculator(this);
        
        // Initialize UI manager
        this.uiManager = new window.UIManager(this);
        
        // Position grid in center with proper spacing for UI
        const gridWidth = this.gridManager.getGridWidth();
        const gridHeight = this.gridManager.getGridHeight();
        const gridX = (this.cameras.main.width - gridWidth) / 2;
        const gridY = 120; // Start below the top UI bar
        
        this.gridManager.setPosition(gridX, gridY);
        
        // Add character portraits to frame the grid
        this.createCharacterPortraits(gridX, gridY, gridWidth, gridHeight);
        
        // Create UI
        this.createUI();
        
        // Fill initial grid
        this.gridManager.fillGrid();
        
        // Initialize game variables
        this.totalWin = 0;
        this.cascadeMultiplier = 1;
        this.isSpinning = false;
        this.quickSpinEnabled = false;
        this.freeSpinsAutoPlay = true; // Auto-play free spins by default
        
        // Start background music if enabled
        if (this.stateManager.gameData.musicEnabled && !this.sound.get('bgm_infinity_storm')) {
            this.bgMusic = window.SafeSound.add(this, 'bgm_infinity_storm', { loop: true, volume: 0.3 });
            if (this.bgMusic) this.bgMusic.play();
        }
    }
    
    createCharacterPortraits(gridX, gridY, gridWidth, gridHeight) {
        const portraitScale = 0.8; // Scale down the portraits to fit nicely
        const portraitSpacing = 40; // Distance from grid edge
        
        // Scarlet Witch on the left side
        const scarletWitch = this.add.image(
            gridX - portraitSpacing, 
            gridY + (gridHeight / 2), 
            'portrait_scarlet_witch'
        );
        scarletWitch.setOrigin(1, 0.5); // Right-aligned to grid
        scarletWitch.setScale(portraitScale);
        scarletWitch.setDepth(1); // Behind UI elements but above background
        
        // Add subtle glow effect to Scarlet Witch
        const witchGlow = this.add.image(scarletWitch.x, scarletWitch.y, 'portrait_scarlet_witch');
        witchGlow.setOrigin(1, 0.5);
        witchGlow.setScale(portraitScale * 1.1);
        witchGlow.setTint(0xFF1493); // Deep pink glow
        witchGlow.setAlpha(0.3);
        witchGlow.setDepth(0);
        
        // Thanos on the right side
        const thanos = this.add.image(
            gridX + gridWidth + portraitSpacing, 
            gridY + (gridHeight / 2), 
            'portrait_thanos'
        );
        thanos.setOrigin(0, 0.5); // Left-aligned to grid
        thanos.setScale(portraitScale);
        thanos.setDepth(1);
        
        // Add subtle glow effect to Thanos
        const thanosGlow = this.add.image(thanos.x, thanos.y, 'portrait_thanos');
        thanosGlow.setOrigin(0, 0.5);
        thanosGlow.setScale(portraitScale * 1.1);
        thanosGlow.setTint(0x4B0082); // Indigo glow
        thanosGlow.setAlpha(0.3);
        thanosGlow.setDepth(0);
        
        // Add breathing animation to both characters
        this.tweens.add({
            targets: [scarletWitch, witchGlow],
            scaleX: portraitScale * 1.05,
            scaleY: portraitScale * 1.05,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        this.tweens.add({
            targets: [thanos, thanosGlow],
            scaleX: portraitScale * 1.05,
            scaleY: portraitScale * 1.05,
            duration: 2200, // Slightly different timing for variety
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Store references for potential future use
        this.characterPortraits = {
            scarletWitch: scarletWitch,
            scarletWitchGlow: witchGlow,
            thanos: thanos,
            thanosGlow: thanosGlow
        };
    }
    
    createUI() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Top bar background - make it taller and more prominent
        const topBar = this.add.rectangle(width / 2, 40, width, 80, 0x000000, 0.8);
        
        // Balance display - left side
        this.balanceText = this.add.text(30, 40, `Balance: $${this.stateManager.gameData.balance.toFixed(2)}`, {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#FFD700'
        });
        this.balanceText.setOrigin(0, 0.5);
        
        // Win display - center, but move up a bit
        this.winText = this.add.text(width / 2, 25, 'Win: $0.00', {
            fontSize: '24px',
            fontFamily: 'Arial Black',
            color: '#00FF00'
        });
        this.winText.setOrigin(0.5);
        
        // Bet display - right side
        this.betText = this.add.text(width - 30, 40, `Bet: $${this.stateManager.gameData.currentBet.toFixed(2)}`, {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        });
        this.betText.setOrigin(1, 0.5);
        
        // Bottom controls - move them higher up
        const bottomY = height - 80;
        
        // Spin button - center
        this.spinButton = this.createButton(width / 2, bottomY, 'SPIN', () => this.handleSpinButtonClick());
        
        // Bet adjustment buttons - closer to spin button
        this.minusButton = this.createSmallButton(width / 2 - 120, bottomY, '-', () => this.adjustBet(-1));
        this.plusButton = this.createSmallButton(width / 2 - 60, bottomY, '+', () => this.adjustBet(1));
        
        // Autoplay button - right side
        this.autoplayButton = this.createButton(width / 2 + 120, bottomY, 'AUTO', () => this.toggleAutoplay());
        
        // Menu button - left side
        this.menuButton = this.createSmallButton(60, bottomY, 'MENU', () => {
            this.sound.stopAll();
            this.scene.start('MenuScene');
        });
        
        // Free spins indicator - position it between grid and controls, make it more prominent
        this.freeSpinsText = this.add.text(width / 2, height - 130, '', {
            fontSize: '32px',
            fontFamily: 'Arial Black',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.freeSpinsText.setOrigin(0.5);
        this.freeSpinsText.setVisible(false);
        this.freeSpinsText.setDepth(100); // Ensure it's visible
        
        // Debug panel - top right
        this.createDebugPanel();
    }
    
    createButton(x, y, text, callback) {
        const button = this.add.container(x, y);
        
        const bg = this.add.image(0, 0, 'button');
        bg.setInteractive({ useHandCursor: true });
        bg.setScale(0.6); // Make buttons smaller
        
        const label = this.add.text(0, 0, text, {
            fontSize: '20px', // Smaller font
            fontFamily: 'Arial Black',
            color: '#ffffff'
        });
        label.setOrigin(0.5);
        
        button.add([bg, label]);
        button.callback = callback;
        
        bg.on('pointerup', () => {
            if (!button.disabled) {
                window.SafeSound.play(this, 'click');
                callback();
            }
        });
        
        bg.on('pointerover', () => {
            if (!button.disabled) {
                button.setScale(1.1);
            }
        });
        
        bg.on('pointerout', () => {
            button.setScale(1);
        });
        
        return button;
    }
    
    createSmallButton(x, y, text, callback) {
        const button = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, 70, 35, 0x6B46C1); // Smaller buttons
        bg.setStrokeStyle(2, 0xffffff);
        bg.setInteractive({ useHandCursor: true });
        
        const label = this.add.text(0, 0, text, {
            fontSize: '16px', // Smaller font
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        label.setOrigin(0.5);
        
        button.add([bg, label]);
        
        bg.on('pointerup', () => {
            window.SafeSound.play(this, 'click');
            callback();
        });
        
        bg.on('pointerover', () => {
            bg.setFillStyle(0x9B59B6);
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0x6B46C1);
        });
        
        return button;
    }
    
    createDebugPanel() {
        const width = this.cameras.main.width;
        
        // Debug panel background - top right
        this.debugPanel = this.add.rectangle(width - 200, 120, 380, 200, 0x000000, 0.8);
        this.debugPanel.setStrokeStyle(2, 0xFFFFFF);
        
        // Debug title
        this.debugTitle = this.add.text(width - 200, 50, 'WIN CALCULATION DEBUG', {
            fontSize: '14px',
            fontFamily: 'Arial Bold',
            color: '#FFD700'
        });
        this.debugTitle.setOrigin(0.5);
        
        // Debug text lines
        this.debugLines = [];
        for (let i = 0; i < 8; i++) {
            const line = this.add.text(width - 380, 80 + (i * 18), '', {
                fontSize: '11px',
                fontFamily: 'Arial',
                color: '#FFFFFF'
            });
            line.setOrigin(0, 0);
            this.debugLines.push(line);
        }
        
        // Initially hide debug panel
        this.setDebugPanelVisible(false);
    }
    
    setDebugPanelVisible(visible) {
        this.debugPanel.setVisible(visible);
        this.debugTitle.setVisible(visible);
        this.debugLines.forEach(line => line.setVisible(visible));
    }
    
    updateDebugPanel(matches, totalWin, bet) {
        this.setDebugPanelVisible(true);
        
        let lineIndex = 0;
        this.debugLines[lineIndex++].setText(`Total Win: $${totalWin.toFixed(2)} (${(totalWin/bet).toFixed(1)}x)`);
        this.debugLines[lineIndex++].setText(`Bet: $${bet.toFixed(2)} | Matches: ${matches.length}`);
        this.debugLines[lineIndex++].setText('');
        
        matches.forEach((match, index) => {
            if (lineIndex >= this.debugLines.length) return;
            
            const symbolType = match[0].symbol.symbolType;
            const symbolInfo = window.GameConfig.SYMBOLS[symbolType.toUpperCase()];
            const matchSize = match.length;
            
            // Get highest multiplier in this match
            let highestMultiplier = 1;
            match.forEach(({ symbol }) => {
                if (symbol && symbol.multiplier > highestMultiplier) {
                    highestMultiplier = symbol.multiplier;
                }
            });
            
            const baseWin = symbolInfo.payout * bet;
            const matchSizeMultiplier = 1 + ((matchSize - window.GameConfig.MIN_MATCH_COUNT) * 0.5);
            const finalWin = baseWin * matchSizeMultiplier * highestMultiplier;
            
            this.debugLines[lineIndex++].setText(`${symbolType}: ${matchSize} symbols`);
            if (lineIndex < this.debugLines.length) {
                this.debugLines[lineIndex++].setText(`  $${baseWin.toFixed(2)} x${matchSizeMultiplier.toFixed(1)} x${highestMultiplier} = $${finalWin.toFixed(2)}`);
            }
        });
        
        // Clear remaining lines
        for (let i = lineIndex; i < this.debugLines.length; i++) {
            this.debugLines[i].setText('');
        }
    }
    
    adjustBet(direction) {
        const currentIndex = window.GameConfig.BET_LEVELS.indexOf(this.stateManager.gameData.currentBet);
        let newIndex = currentIndex + direction;
        
        newIndex = Math.max(0, Math.min(window.GameConfig.BET_LEVELS.length - 1, newIndex));
        
        this.stateManager.setBet(window.GameConfig.BET_LEVELS[newIndex]);
        this.uiManager.updateBet(this.stateManager.gameData.currentBet);
    }
    
    toggleAutoplay() {
        if (this.stateManager.gameData.autoplayActive) {
            this.stateManager.stopAutoplay();
            this.autoplayButton.getAt(1).setText('AUTO');
        } else {
            this.stateManager.setAutoplay(10); // 10 spins
            this.autoplayButton.getAt(1).setText('STOP');
            if (!this.isSpinning) {
                this.startSpin();
            }
        }
    }
    
    async startSpin() {
        if (this.isSpinning) return;
        
        // Check if player can afford bet
        if (!this.stateManager.canAffordBet() && !this.stateManager.freeSpinsData.active) {
            this.showMessage('Insufficient Balance!');
            return;
        }
        
        this.isSpinning = true;
        this.totalWin = 0;
        this.cascadeMultiplier = 1;
        
        // Disable buttons
        this.setButtonsEnabled(false);
        
        // Place bet or use free spin
        if (this.stateManager.freeSpinsData.active) {
            this.stateManager.useFreeSpins();
            this.updateFreeSpinsDisplay();
        } else {
            this.stateManager.placeBet();
        }
        
        // Update balance
        this.uiManager.updateBalance(this.stateManager.gameData.balance);
        
        // Clear current grid with animation
        await this.clearGridWithAnimation();
        
        // Fill new grid
        this.gridManager.fillGrid();
        
        // Play spin sound
        window.SafeSound.play(this, 'spin');
        
        // Check for Infinity Power BEFORE processing cascades
        if (this.gridManager.checkForInfinityPower()) {
            this.triggerInfinityPower();
        }
        
        // Debug: Show grid state before cascades
        this.debugGridState();
        
        // Start cascade process
        await this.processCascades();
        
        // Check for other bonus features
        this.checkOtherBonusFeatures();
        
        // End spin
        this.endSpin();
    }
    
    async clearGridWithAnimation() {
        const promises = [];
        
        for (let col = 0; col < this.gridManager.cols; col++) {
            for (let row = 0; row < this.gridManager.rows; row++) {
                const symbol = this.gridManager.grid[col][row];
                if (symbol) {
                    const promise = new Promise(resolve => {
                        this.tweens.add({
                            targets: symbol,
                            alpha: 0,
                            scaleX: 0,
                            scaleY: 0,
                            duration: 200,
                            delay: (col + row) * 20,
                            ease: 'Power2',
                            onComplete: () => {
                                symbol.destroy();
                                resolve();
                            }
                        });
                    });
                    promises.push(promise);
                }
            }
        }
        
        await Promise.all(promises);
        this.gridManager.initializeGrid();
    }
    
    async processCascades() {
        let hasMatches = true;
        let cascadeCount = 0;
        
        while (hasMatches) {
            // Find matches
            const matches = this.gridManager.findMatches();
            
            // Debug: Log match detection
            console.log(`=== MATCH DETECTION (Cascade ${cascadeCount + 1}) ===`);
            console.log(`Matches found: ${matches.length}`);
            matches.forEach((match, index) => {
                const symbolType = match[0].symbol.symbolType;
                const positions = match.map(m => `(${m.col},${m.row})`).join(', ');
                console.log(`Match ${index + 1}: ${symbolType} - ${match.length} symbols at ${positions}`);
            });
            
            if (matches.length > 0) {
                // Calculate win using WinCalculator
                const win = this.winCalculator.calculateTotalWin(matches, this.stateManager.gameData.currentBet);
                this.totalWin += win;
                
                // Debug: Show win calculation details
                this.showWinCalculationDebug(matches, win);
                
                // Update debug panel
                this.updateDebugPanel(matches, win, this.stateManager.gameData.currentBet);
                
                // Update win display
                this.uiManager.updateWin(this.totalWin);
                
                            // Play win sound
            window.SafeSound.play(this, 'win');
                
                // Highlight matches
                this.gridManager.highlightMatches(matches);
                
                // Wait a bit
                await this.delay(500);
                
                // Stop all animations before removing matches
                this.gridManager.stopAllSymbolAnimations();
                
                // Remove matches
                this.gridManager.removeMatches(matches);
                
                            // Play cascade sound
            window.SafeSound.play(this, 'cascade');
                
                // Wait for removal
                await this.delay(window.GameConfig.ANIMATIONS.SYMBOL_DESTROY_TIME);
                
                // Cascade symbols
                await this.gridManager.cascadeSymbols();
                
                cascadeCount++;
                
                // Apply cascade multiplier in free spins
                if (this.stateManager.freeSpinsData.active && cascadeCount > 1) {
                    const randomMultiplier = window.GameConfig.RANDOM_MULTIPLIERS[
                        Math.floor(Math.random() * window.GameConfig.RANDOM_MULTIPLIERS.length)
                    ];
                    this.stateManager.accumulateMultiplier(randomMultiplier);
                    this.showMultiplier(randomMultiplier);
                }
            } else {
                hasMatches = false;
                // Hide debug panel when no matches
                if (cascadeCount === 0) {
                    this.setDebugPanelVisible(false);
                }
            }
        }
    }
    
    // Win calculation is now handled by WinCalculator
    
    showWinPresentation(totalWin) {
        const winCategory = this.winCalculator.getWinCategory(totalWin, this.stateManager.gameData.currentBet);
        
        if (winCategory) {
            // Show special win presentation based on category
            const colors = {
                SMALL: '#00FF00',
                MEDIUM: '#00FFFF',
                BIG: '#FFD700',
                MEGA: '#FF00FF',
                EPIC: '#FF0000',
                LEGENDARY: '#FFFFFF'
            };
            
            const message = this.add.text(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2 - 150,
                winCategory.name.toUpperCase() + '!',
                {
                    fontSize: '72px',
                    fontFamily: 'Arial Black',
                    color: colors[winCategory.key] || '#FFD700',
                    stroke: '#000000',
                    strokeThickness: 8
                }
            );
            message.setOrigin(0.5);
            message.setScale(0);
            
            this.tweens.add({
                targets: message,
                scaleX: 1,
                scaleY: 1,
                duration: 500,
                ease: 'Back.out',
                onComplete: () => {
                    this.time.delayedCall(2000, () => {
                        this.tweens.add({
                            targets: message,
                            alpha: 0,
                            duration: 500,
                            onComplete: () => message.destroy()
                        });
                    });
                }
            });
        }
    }
    
    checkOtherBonusFeatures() {
        // Check for Free Spins
        const scatterCount = this.gridManager.countScatters();
        if (scatterCount >= 4 && !this.stateManager.freeSpinsData.active) {
            this.triggerFreeSpins(scatterCount);
        } else if (scatterCount >= 4 && this.stateManager.freeSpinsData.active) {
            // Retrigger - 4+ scatter during free spins awards +2 spins per scatter
            const extraSpins = scatterCount * window.GameConfig.FREE_SPINS.RETRIGGER_SPINS;
            this.stateManager.addFreeSpins(extraSpins);
            this.showMessage(`+${extraSpins} Free Spins!`);
            this.updateFreeSpinsDisplay();
            // Note: Auto-play continues automatically, no need to restart it
        }
    }
    
    triggerInfinityPower() {
        // Select random position on the grid
        const col = Math.floor(Math.random() * this.gridManager.cols);
        const row = Math.floor(Math.random() * this.gridManager.rows);
        
        // Select random multiplier
        const multiplier = window.GameConfig.RANDOM_MULTIPLIERS[
            Math.floor(Math.random() * window.GameConfig.RANDOM_MULTIPLIERS.length)
        ];
        
        // Apply multiplier to single symbol
        this.gridManager.applyMultiplierToSymbol(col, row, multiplier);
        
        // Show effect
        this.showMessage(`INFINITY POWER! All 6 Gems + Thanos! Symbol x${multiplier}!`);
        window.SafeSound.play(this, 'bonus');
    }
    
    triggerFreeSpins(scatterCount) {
        let freeSpins = 0;
        
        switch (scatterCount) {
            case 4:
                freeSpins = window.GameConfig.FREE_SPINS.SCATTER_4;  // 10 free spins
                break;
            case 5:
                freeSpins = window.GameConfig.FREE_SPINS.SCATTER_5;  // 15 free spins
                break;
            case 6:
            default:
                freeSpins = window.GameConfig.FREE_SPINS.SCATTER_6_PLUS;  // 20 free spins
                break;
        }
        
        this.stateManager.startFreeSpins(freeSpins);
        
        // Show big prominent free spins message
        this.showBigFreeSpinsMessage(freeSpins);
        window.SafeSound.play(this, 'bonus');
        this.updateFreeSpinsDisplay();
        
        // Start auto-spinning free spins after the message is shown
        this.freeSpinsAutoPlay = true; // Enable auto-play for new free spins
        console.log(`Free spins awarded: ${freeSpins} - will start auto-spinning in 5 seconds`);
        this.time.delayedCall(5000, () => {
            if (this.stateManager.freeSpinsData.active && this.stateManager.freeSpinsData.count > 0 && !this.isSpinning && this.freeSpinsAutoPlay) {
                console.log(`Starting first free spin auto-play`);
                this.startSpin();
            }
        });
        
    }
    
    updateFreeSpinsDisplay() {
        console.log(`=== UPDATE FREE SPINS DISPLAY ===`);
        console.log(`Free spins active: ${this.stateManager.freeSpinsData.active}`);
        console.log(`Free spins count: ${this.stateManager.freeSpinsData.count}`);
        console.log(`Multiplier accumulator: ${this.stateManager.freeSpinsData.multiplierAccumulator}`);
        
        if (this.stateManager.freeSpinsData.active) {
            console.log(`Calling uiManager.updateFreeSpins(${this.stateManager.freeSpinsData.count}, ${this.stateManager.freeSpinsData.multiplierAccumulator})`);
            this.uiManager.updateFreeSpins(
                this.stateManager.freeSpinsData.count,
                this.stateManager.freeSpinsData.multiplierAccumulator
            );
        } else {
            console.log(`Calling uiManager.updateFreeSpins(0, 1) - free spins not active`);
            this.uiManager.updateFreeSpins(0, 1);
        }
        
        console.log(`=== END UPDATE FREE SPINS DISPLAY ===`);
    }
    
    updateSpinButtonText() {
        if (this.spinButton && this.spinButton.getAt(1)) {
            if (this.stateManager.freeSpinsData.active && this.stateManager.freeSpinsData.count > 0) {
                if (this.freeSpinsAutoPlay) {
                    this.spinButton.getAt(1).setText('STOP AUTO');
                } else {
                    this.spinButton.getAt(1).setText('SPIN');
                }
            } else {
                this.spinButton.getAt(1).setText('SPIN');
            }
        }
    }
    
    handleSpinButtonClick() {
        if (this.stateManager.freeSpinsData.active && this.stateManager.freeSpinsData.count > 0) {
            if (this.freeSpinsAutoPlay) {
                // Stop auto-play
                this.freeSpinsAutoPlay = false;
                console.log('Free spins auto-play stopped by user');
                this.updateSpinButtonText();
                this.showMessage('Auto-play stopped - Click SPIN to continue');
            } else {
                // Manual spin during free spins
                this.startSpin();
            }
        } else {
            // Regular spin
            this.startSpin();
        }
    }
    
    showMessage(text) {
        console.log(`=== SHOW MESSAGE ===`);
        console.log(`Message: ${text}`);
        
        const message = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            text,
            {
                fontSize: '48px',
                fontFamily: 'Arial Black',
                color: '#FFD700',
                stroke: '#000000',
                strokeThickness: 6
            }
        );
        message.setOrigin(0.5);
        message.setScale(0);
        message.setDepth(1000); // Ensure it's on top
        
        console.log(`Message created at position: (${message.x}, ${message.y})`);
        console.log(`Camera dimensions: ${this.cameras.main.width} x ${this.cameras.main.height}`);
        
        this.tweens.add({
            targets: message,
            scaleX: 1,
            scaleY: 1,
            duration: 500,
            ease: 'Back.out',
            onComplete: () => {
                console.log(`Message animation complete, will fade in 1500ms`);
                this.time.delayedCall(1500, () => {
                    this.tweens.add({
                        targets: message,
                        alpha: 0,
                        y: message.y - 50,
                        duration: 500,
                        onComplete: () => {
                            console.log(`Message destroyed`);
                            message.destroy();
                        }
                    });
                });
            }
        });
        
        console.log(`=== END SHOW MESSAGE ===`);
    }
    
    showBigFreeSpinsMessage(freeSpins) {
        console.log(`=== SHOW BIG FREE SPINS MESSAGE ===`);
        console.log(`Free spins awarded: ${freeSpins}`);
        
        // Create dramatic background overlay
        const overlay = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000,
            0.8
        );
        overlay.setDepth(999);
        
        // Main title
        const title = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 50,
            'FREE SPINS AWARDED!',
            {
                fontSize: '72px',
                fontFamily: 'Arial Black',
                color: '#FFD700',
                stroke: '#000000',
                strokeThickness: 8
            }
        );
        title.setOrigin(0.5);
        title.setDepth(1000);
        title.setScale(0);
        
        // Number of spins
        const spinsText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 50,
            `${freeSpins} FREE SPINS`,
            {
                fontSize: '48px',
                fontFamily: 'Arial Black',
                color: '#00FF00',
                stroke: '#000000',
                strokeThickness: 6
            }
        );
        spinsText.setOrigin(0.5);
        spinsText.setDepth(1000);
        spinsText.setScale(0);
        
        // Animate entrance
        this.tweens.add({
            targets: [title, spinsText],
            scaleX: 1,
            scaleY: 1,
            duration: 800,
            ease: 'Back.out',
            delay: 200
        });
        
        // Pulsing effect
        this.tweens.add({
            targets: [title, spinsText],
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 600,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut',
            delay: 1000
        });
        
        // Remove after 4 seconds
        this.time.delayedCall(4000, () => {
            this.tweens.add({
                targets: [overlay, title, spinsText],
                alpha: 0,
                duration: 800,
                ease: 'Power2',
                onComplete: () => {
                    overlay.destroy();
                    title.destroy();
                    spinsText.destroy();
                    console.log(`Big free spins message removed`);
                }
            });
        });
        
        console.log(`=== END SHOW BIG FREE SPINS MESSAGE ===`);
    }
    
    showMultiplier(multiplier) {
        const multText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 100,
            `x${multiplier}`,
            {
                fontSize: '64px',
                fontFamily: 'Arial Black',
                color: '#FF00FF',
                stroke: '#FFFFFF',
                strokeThickness: 4
            }
        );
        multText.setOrigin(0.5);
        multText.setScale(2);
        
        this.tweens.add({
            targets: multText,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.time.delayedCall(800, () => {
                    this.tweens.add({
                        targets: multText,
                        alpha: 0,
                        scaleX: 0,
                        scaleY: 0,
                        duration: 300,
                        onComplete: () => multText.destroy()
                    });
                });
            }
        });
    }
    
    endSpin() {
        // Add win to balance
        if (this.totalWin > 0) {
            this.stateManager.addWin(this.totalWin);
            this.uiManager.updateBalance(this.stateManager.gameData.balance);
            
            // Show win presentation for big wins
            this.showWinPresentation(this.totalWin);
            
            // Add free spins win
            if (this.stateManager.freeSpinsData.active) {
                this.stateManager.freeSpinsData.totalWin += this.totalWin;
            }
        }
        
        // Check if free spins ended
        if (this.stateManager.freeSpinsData.active && this.stateManager.freeSpinsData.count === 0) {
            const totalFreeSpinsWin = this.stateManager.endFreeSpins();
            this.showMessage(`Free Spins Complete! Total Win: $${totalFreeSpinsWin.toFixed(2)}`);
            this.updateFreeSpinsDisplay();
        }
        
        // Start idle animations for all symbols now that spin is complete
        this.gridManager.startAllIdleAnimations();
        
        // Re-enable buttons
        this.setButtonsEnabled(true);
        this.isSpinning = false;
        
        // Update spin button text based on free spins status
        this.updateSpinButtonText();
        
        // Handle free spins auto-play
        if (this.stateManager.freeSpinsData.active && this.stateManager.freeSpinsData.count > 0 && this.freeSpinsAutoPlay) {
            console.log(`Free spins active with ${this.stateManager.freeSpinsData.count} remaining - auto-spinning in 2 seconds`);
            // Auto-spin for free spins after a short delay
            this.time.delayedCall(2000, () => {
                if (this.stateManager.freeSpinsData.active && this.stateManager.freeSpinsData.count > 0 && !this.isSpinning && this.freeSpinsAutoPlay) {
                    console.log(`Auto-spinning free spin ${this.stateManager.freeSpinsData.totalCount - this.stateManager.freeSpinsData.count + 1}`);
                    this.startSpin();
                }
            });
        }
        // Handle regular autoplay
        else if (this.stateManager.gameData.autoplayActive) {
            this.stateManager.decrementAutoplay();
            
            if (this.stateManager.gameData.autoplayCount === 0) {
                this.autoplayButton.getAt(1).setText('AUTO');
            } else {
                // Continue autoplay after delay
                this.time.delayedCall(1000, () => {
                    if (this.stateManager.gameData.autoplayActive) {
                        this.startSpin();
                    }
                });
            }
        }
        
        // Save game state
        this.stateManager.saveState();
    }
    
    setButtonsEnabled(enabled) {
        this.uiManager.setButtonsEnabled(enabled);
    }
    
    showWinCalculationDebug(matches, totalWin) {
        console.log('=== WIN CALCULATION DEBUG ===');
        console.log(`Total Win: $${totalWin.toFixed(2)}`);
        console.log(`Bet: $${this.stateManager.gameData.currentBet.toFixed(2)}`);
        console.log(`Matches found: ${matches.length}`);
        
        matches.forEach((match, index) => {
            const symbolType = match[0].symbol.symbolType;
            const symbolInfo = window.GameConfig.SYMBOLS[symbolType.toUpperCase()];
            const matchSize = match.length;
            
            // Get highest multiplier in this match
            let highestMultiplier = 1;
            match.forEach(({ symbol }) => {
                if (symbol && symbol.multiplier > highestMultiplier) {
                    highestMultiplier = symbol.multiplier;
                }
            });
            
            const baseWin = symbolInfo.payout * this.stateManager.gameData.currentBet;
            const matchSizeMultiplier = 1 + ((matchSize - window.GameConfig.MIN_MATCH_COUNT) * 0.5);
            const finalWin = baseWin * matchSizeMultiplier * highestMultiplier;
            
            console.log(`Match ${index + 1}:`);
            console.log(`  Symbol: ${symbolType} (${matchSize} symbols)`);
            console.log(`  Base Payout: ${symbolInfo.payout}x`);
            console.log(`  Base Win: $${baseWin.toFixed(2)}`);
            console.log(`  Match Size Multiplier: ${matchSizeMultiplier}x`);
            console.log(`  Highest Symbol Multiplier: ${highestMultiplier}x`);
            console.log(`  Final Match Win: $${finalWin.toFixed(2)}`);
            
            // Show positions with multipliers
            const positions = match.map(({ col, row, symbol }) => {
                const mult = symbol.multiplier || 1;
                return `(${col},${row})${mult > 1 ? ` x${mult}` : ''}`;
            }).join(', ');
            console.log(`  Positions: ${positions}`);
        });
        
        console.log('========================');
    }
    
    debugGridState() {
        console.log('=== GRID STATE ===');
        for (let row = 0; row < this.gridManager.rows; row++) {
            let rowStr = '';
            for (let col = 0; col < this.gridManager.cols; col++) {
                const symbol = this.gridManager.grid[col][row];
                if (symbol) {
                    const shortName = symbol.symbolType.replace('_gem', '').replace('_', '').substring(0, 4).toUpperCase();
                    rowStr += shortName.padEnd(6, ' ');
                } else {
                    rowStr += 'NULL  ';
                }
            }
            console.log(`Row ${row}: ${rowStr}`);
        }
        console.log('==================');
    }

    delay(ms) {
        return new Promise(resolve => {
            this.time.delayedCall(ms, resolve);
        });
    }
} 