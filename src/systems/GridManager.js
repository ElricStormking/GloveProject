// GameConfig and Symbol are loaded globally

window.GridManager = class GridManager {
    constructor(scene) {
        this.scene = scene;
        this.cols = window.GameConfig.GRID_COLS;
        this.rows = window.GameConfig.GRID_ROWS;
        this.symbolSize = window.GameConfig.SYMBOL_SIZE;
        this.spacing = window.GameConfig.GRID_SPACING;
        
        // Grid array to store symbols
        this.grid = [];
        
        // Symbol pool for recycling
        this.symbolPool = [];
        
        // Grid position
        this.gridX = 0;
        this.gridY = 0;
        
        // Cascade state
        this.isCascading = false;
        this.cascadeCount = 0;
        
        // Symbol types
        this.symbolTypes = Object.keys(window.GameConfig.SYMBOLS).filter(key => 
            key !== 'INFINITY_GLOVE' // Scatter appears separately
        );
        
        this.initializeGrid();
    }
    
    initializeGrid() {
        // Create empty grid
        for (let col = 0; col < this.cols; col++) {
            this.grid[col] = [];
            for (let row = 0; row < this.rows; row++) {
                this.grid[col][row] = null;
            }
        }
    }
    
    setPosition(x, y) {
        this.gridX = x;
        this.gridY = y;
    }
    
    getGridWidth() {
        return this.cols * (this.symbolSize + this.spacing) - this.spacing;
    }
    
    getGridHeight() {
        return this.rows * (this.symbolSize + this.spacing) - this.spacing;
    }
    
    getSymbolPosition(col, row) {
        return {
            x: this.gridX + col * (this.symbolSize + this.spacing),
            y: this.gridY + row * (this.symbolSize + this.spacing)
        };
    }
    
    createSymbol(type, col, row) {
        let symbol;
        
        // Try to get from pool first
        if (this.symbolPool.length > 0) {
            symbol = this.symbolPool.pop();
            symbol.setTexture(type);
            symbol.setVisible(true);
            symbol.setActive(true);
            symbol.reset();
        } else {
            // Create new symbol
            const pos = this.getSymbolPosition(col, row);
            symbol = new window.Symbol(this.scene, pos.x, pos.y, type);
            this.scene.add.existing(symbol);
        }
        
        // Set symbol properties
        symbol.symbolType = type;
        symbol.setGridPosition(col, row);
        
        // Position symbol
        const pos = this.getSymbolPosition(col, row);
        symbol.updatePosition(pos.x, pos.y);
        
        // Add appearance animation
        symbol.appear();
        
        return symbol;
    }
    
    fillGrid() {
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                if (!this.grid[col][row]) {
                    const randomType = this.getRandomSymbolType();
                    const symbol = this.createSymbol(randomType, col, row);
                    this.grid[col][row] = symbol;
                }
            }
        }
    }
    
    getRandomSymbolType() {
        // Add scatter chance
        if (Math.random() < 0.04) { // 5% chance for scatter
            return 'infinity_glove';
        }
        
        // Regular symbols with weighted probability
        const weights = {
            'space_gem': 18,
            'mind_gem': 18,
            'reality_gem': 16,
            'power_gem': 14,
            'time_gem': 12,
            'soul_gem': 10,
            'thanos': 8,
            'scarlet_witch': 6,
            'scarlet_magic_spell': 5
        };
        
        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (const [type, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) {
                return type;
            }
        }
        
        return 'space_gem'; // fallback
    }
    
    findMatches() {
        const matches = [];
        const symbolCounts = {};
        
        // Count all symbols on the grid
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                const symbol = this.grid[col][row];
                if (symbol && symbol.symbolType !== 'infinity_glove') { // Exclude scatter symbols
                    if (!symbolCounts[symbol.symbolType]) {
                        symbolCounts[symbol.symbolType] = [];
                    }
                    symbolCounts[symbol.symbolType].push({ col, row, symbol });
                }
            }
        }
        
        // Check which symbol types have 8+ instances
        for (const [symbolType, positions] of Object.entries(symbolCounts)) {
            if (positions.length >= window.GameConfig.MIN_MATCH_COUNT) {
                matches.push(positions);
            }
        }
        
        return matches;
    }
    

    
    removeMatches(matches) {
        const removedSymbols = [];
        
        for (const match of matches) {
            for (const { col, row, symbol } of match) {
                if (symbol) {
                    removedSymbols.push(symbol);
                    this.grid[col][row] = null;
                    
                    // Stop any existing tweens on this symbol first
                    this.scene.tweens.killTweensOf(symbol);
                    
                    // Use Symbol's destroy method which handles animation
                    // Don't add to pool as Symbol.destroy() will fully destroy it
                    symbol.destroy();
                }
            }
        }
        
        return removedSymbols;
    }
    
    stopAllSymbolAnimations() {
        // Stop all tweens and idle animations for all symbols on the grid
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                const symbol = this.grid[col][row];
                if (symbol) {
                    this.scene.tweens.killTweensOf(symbol);
                    if (symbol.stopIdleAnimation) {
                        symbol.stopIdleAnimation();
                    }
                }
            }
        }
    }
    
    async cascadeSymbols() {
        this.isCascading = true;
        
        // Stop all existing animations first to prevent conflicts
        this.stopAllIdleAnimations();
        this.scene.tweens.killTweensOf(this.scene.children.list.filter(child => child.symbolType));
        
        const promises = [];
        
        // For each column, drop symbols down
        for (let col = 0; col < this.cols; col++) {
            let writeRow = this.rows - 1; // Start from bottom
            
            // Collect all existing symbols in this column (from bottom to top)
            const existingSymbols = [];
            for (let row = this.rows - 1; row >= 0; row--) {
                if (this.grid[col][row]) {
                    existingSymbols.push({
                        symbol: this.grid[col][row],
                        originalRow: row
                    });
                    this.grid[col][row] = null; // Clear the grid position
                }
            }
            
            // Place symbols back from bottom up
            for (let i = 0; i < existingSymbols.length; i++) {
                const { symbol } = existingSymbols[i];
                const targetRow = writeRow - i;
                
                if (targetRow >= 0) {
                    this.grid[col][targetRow] = symbol;
                    symbol.setGridPosition(col, targetRow);
                    
                    const targetPos = this.getSymbolPosition(col, targetRow);
                    
                    // Only animate if the symbol is moving down
                    if (symbol.y < targetPos.y) {
                        const promise = new Promise(resolve => {
                            this.scene.tweens.add({
                                targets: symbol,
                                x: targetPos.x,
                                y: targetPos.y,
                                duration: window.GameConfig.CASCADE_SPEED,
                                ease: 'Bounce.out',
                                onComplete: resolve
                            });
                        });
                        promises.push(promise);
                    } else {
                        // Symbol is already in correct position
                        symbol.setPosition(targetPos.x, targetPos.y);
                    }
                }
            }
        }
        
        // Wait for all drops to complete
        await Promise.all(promises);
        
        // Fill empty spaces with new symbols
        await this.fillEmptySpaces();
        
        this.isCascading = false;
        this.cascadeCount++;
        
        // Start idle animations for all symbols after cascading is complete
        this.startAllIdleAnimations();
        
        return true;
    }
    
    startAllIdleAnimations() {
        // Start idle animations for all symbols on the grid
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                const symbol = this.grid[col][row];
                if (symbol && symbol.startIdleAnimation) {
                    // Add a small delay to stagger the idle animations
                    this.scene.time.delayedCall((col + row) * 100, () => {
                        symbol.startIdleAnimation();
                    });
                }
            }
        }
    }
    
    stopAllIdleAnimations() {
        // Stop idle animations for all symbols on the grid
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                const symbol = this.grid[col][row];
                if (symbol && symbol.stopIdleAnimation) {
                    symbol.stopIdleAnimation();
                }
            }
        }
    }
    
    async fillEmptySpaces() {
        const promises = [];
        
        // Fill from top to bottom to ensure proper cascading
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.grid[col][row]) {
                    const randomType = this.getRandomSymbolType();
                    const symbol = this.createSymbol(randomType, col, row);
                    
                    // Calculate how many empty rows are above this position
                    let emptyRowsAbove = 0;
                    for (let checkRow = row - 1; checkRow >= 0; checkRow--) {
                        if (!this.grid[col][checkRow]) {
                            emptyRowsAbove++;
                        } else {
                            break;
                        }
                    }
                    
                    // Start above the grid, accounting for empty rows
                    const startY = this.gridY - this.symbolSize * (2 + emptyRowsAbove);
                    const targetPos = this.getSymbolPosition(col, row);
                    
                    symbol.setPosition(targetPos.x, startY);
                    this.grid[col][row] = symbol;
                    
                    const promise = new Promise(resolve => {
                        this.scene.tweens.add({
                            targets: symbol,
                            y: targetPos.y,
                            duration: window.GameConfig.CASCADE_SPEED + (emptyRowsAbove * 100),
                            ease: 'Bounce.out',
                            delay: col * 50, // Stagger by column instead of row
                            onComplete: resolve
                        });
                    });
                    
                    promises.push(promise);
                }
            }
        }
        
        await Promise.all(promises);
    }
    
    highlightMatches(matches) {
        for (const match of matches) {
            for (const { symbol } of match) {
                if (symbol) {
                    // Use Symbol's showMatched method
                    symbol.showMatched();
                }
            }
        }
    }
    
    checkForInfinityPower() {
        const requiredSymbols = ['space_gem', 'mind_gem', 'reality_gem', 'power_gem', 'time_gem', 'soul_gem', 'thanos'];
        const foundSymbols = new Set();
        
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                const symbol = this.grid[col][row];
                if (symbol && requiredSymbols.includes(symbol.symbolType)) {
                    foundSymbols.add(symbol.symbolType);
                }
            }
        }
        
        return foundSymbols.size === requiredSymbols.length;
    }
    
    countScatters() {
        let count = 0;
        const scatterPositions = [];
        
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                const symbol = this.grid[col][row];
                if (symbol && symbol.symbolType === 'infinity_glove') {
                    count++;
                    scatterPositions.push(`(${col},${row})`);
                }
            }
        }
        
        if (count > 0) {
            console.log(`Found ${count} scatter symbols at positions: ${scatterPositions.join(', ')}`);
        }
        
        return count;
    }
    
    clearGrid() {
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                if (this.grid[col][row]) {
                    const symbol = this.grid[col][row];
                    symbol.destroy();
                    this.grid[col][row] = null;
                }
            }
        }
        
        // Clear symbol pool
        for (const symbol of this.symbolPool) {
            symbol.destroy();
        }
        this.symbolPool = [];
    }
    
    applyMultiplierToSymbol(col, row, multiplier) {
        const symbol = this.grid[col][row];
        if (symbol) {
            // Apply multiplier to the symbol
            symbol.multiplier = multiplier;
            
            // Visual effect - make the symbol glow and pulse initially
            this.scene.tweens.add({
                targets: symbol,
                scaleX: 1.4,
                scaleY: 1.4,
                duration: 300,
                yoyo: true,
                repeat: 3,
                ease: 'Power2'
            });
            
            // Add persistent glowing effect
            symbol.setTint(0xFFD700); // Golden glow - stays until symbol is destroyed
            
            // Add multiplier text above the symbol
            const multText = this.scene.add.text(
                symbol.x, 
                symbol.y - 30, 
                `x${multiplier}`, 
                {
                    fontSize: '28px',
                    fontFamily: 'Arial Black',
                    color: '#FFD700',
                    stroke: '#FFFFFF',
                    strokeThickness: 4
                }
            );
            multText.setOrigin(0.5);
            multText.setScale(0);
            
            // Store reference to multiplier text on the symbol so it persists
            symbol.multiplierText = multText;
            
            // Animate multiplier text appearance
            this.scene.tweens.add({
                targets: multText,
                scaleX: 1,
                scaleY: 1,
                duration: 300,
                ease: 'Back.out'
                // Removed the auto-destroy - text will stay until symbol is destroyed
            });
            
            // Add subtle pulsing effect to keep it visually active
            this.scene.tweens.add({
                targets: [symbol, multText],
                alpha: 0.8,
                duration: 800,
                yoyo: true,
                repeat: -1, // Infinite repeat
                ease: 'Sine.easeInOut'
            });
            
            console.log(`Infinity Power applied: Symbol at (${col},${row}) now has x${multiplier} multiplier`);
        }
    }
} 