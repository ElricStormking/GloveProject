// Phaser is loaded globally
// All classes are loaded globally

window.GameScene = class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    create() {
        this.stateManager = this.game.stateManager;
        this.stateManager.setState(this.stateManager.states.PLAYING);
        
        // Create background
        const bg = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'background');
        bg.setOrigin(0, 0);
        
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
        
        // Create UI
        this.createUI();
        
        // Fill initial grid
        this.gridManager.fillGrid();
        
        // Initialize game variables
        this.totalWin = 0;
        this.cascadeMultiplier = 1;
        this.isSpinning = false;
        this.quickSpinEnabled = false;
        
        // Start background music if enabled
        if (this.stateManager.gameData.musicEnabled && !this.sound.get('bgm')) {
            this.bgMusic = window.SafeSound.add(this, 'bgm', { loop: true, volume: 0.3 });
            if (this.bgMusic) this.bgMusic.play();
        }
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
        this.spinButton = this.createButton(width / 2, bottomY, 'SPIN', () => this.startSpin());
        
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
        
        // Free spins indicator - position it between grid and controls
        this.freeSpinsText = this.add.text(width / 2, height - 130, '', {
            fontSize: '28px',
            fontFamily: 'Arial Black',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.freeSpinsText.setOrigin(0.5);
        this.freeSpinsText.setVisible(false);
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
        
        // Start cascade process
        await this.processCascades();
        
        // Check for bonus features
        this.checkBonusFeatures();
        
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
            
            if (matches.length > 0) {
                // Calculate win using WinCalculator
                const win = this.winCalculator.calculateTotalWin(matches, this.stateManager.gameData.currentBet);
                this.totalWin += win;
                
                // Update win display
                this.uiManager.updateWin(this.totalWin);
                
                            // Play win sound
            window.SafeSound.play(this, 'win');
                
                // Highlight matches
                this.gridManager.highlightMatches(matches);
                
                // Wait a bit
                await this.delay(500);
                
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
    
    checkBonusFeatures() {
        // Check for Infinity Power
        if (this.gridManager.checkForInfinityPower()) {
            this.triggerInfinityPower();
        }
        
        // Check for Free Spins
        const scatterCount = this.gridManager.countScatters();
        if (scatterCount >= 4 && !this.stateManager.freeSpinsData.active) {
            this.triggerFreeSpins(scatterCount);
        } else if (scatterCount >= 1 && this.stateManager.freeSpinsData.active) {
            // Retrigger
            const extraSpins = scatterCount * window.GameConfig.FREE_SPINS.RETRIGGER_SPINS;
            this.stateManager.addFreeSpins(extraSpins);
            this.showMessage(`+${extraSpins} Free Spins!`);
            this.updateFreeSpinsDisplay();
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
        this.showMessage(`INFINITY POWER! Symbol x${multiplier}!`);
        window.SafeSound.play(this, 'bonus');
    }
    
    triggerFreeSpins(scatterCount) {
        let freeSpins = 0;
        
        switch (scatterCount) {
            case 4:
                freeSpins = window.GameConfig.FREE_SPINS.SCATTER_4;
                break;
            case 5:
            default:
                freeSpins = window.GameConfig.FREE_SPINS.SCATTER_5;
                break;
        }
        
        this.stateManager.startFreeSpins(freeSpins);
        this.showMessage(`${freeSpins} FREE SPINS AWARDED!`);
        window.SafeSound.play(this, 'bonus');
        this.updateFreeSpinsDisplay();
    }
    
    updateFreeSpinsDisplay() {
        if (this.stateManager.freeSpinsData.active) {
            this.uiManager.updateFreeSpins(
                this.stateManager.freeSpinsData.count,
                this.stateManager.freeSpinsData.multiplierAccumulator
            );
        } else {
            this.uiManager.updateFreeSpins(0, 1);
        }
    }
    
    showMessage(text) {
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
        
        this.tweens.add({
            targets: message,
            scaleX: 1,
            scaleY: 1,
            duration: 500,
            ease: 'Back.out',
            onComplete: () => {
                this.time.delayedCall(1500, () => {
                    this.tweens.add({
                        targets: message,
                        alpha: 0,
                        y: message.y - 50,
                        duration: 500,
                        onComplete: () => message.destroy()
                    });
                });
            }
        });
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
        
        // Re-enable buttons
        this.setButtonsEnabled(true);
        this.isSpinning = false;
        
        // Handle autoplay
        if (this.stateManager.gameData.autoplayActive) {
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
    
    delay(ms) {
        return new Promise(resolve => {
            this.time.delayedCall(ms, resolve);
        });
    }
} 