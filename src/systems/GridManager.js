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
        if (Math.random() < 0.05) { // 5% chance for scatter
            return 'infinity_glove';
        }
        
        // Regular symbols with weighted probability
        const weights = {
            'space_gem': 20,
            'mind_gem': 20,
            'reality_gem': 18,
            'power_gem': 15,
            'time_gem': 12,
            'thanos': 8,
            'scarlet_witch': 7
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
        const visited = Array(this.cols).fill(null).map(() => Array(this.rows).fill(false));
        
        // Check each cell
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                if (!visited[col][row] && this.grid[col][row]) {
                    const match = this.floodFill(col, row, visited);
                    if (match.length >= window.GameConfig.MIN_MATCH_COUNT) {
                        matches.push(match);
                    }
                }
            }
        }
        
        return matches;
    }
    
    floodFill(startCol, startRow, visited) {
        const symbol = this.grid[startCol][startRow];
        if (!symbol) return [];
        
        const symbolType = symbol.symbolType;
        const match = [];
        const stack = [[startCol, startRow]];
        
        while (stack.length > 0) {
            const [col, row] = stack.pop();
            
            if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) continue;
            if (visited[col][row]) continue;
            if (!this.grid[col][row] || this.grid[col][row].symbolType !== symbolType) continue;
            
            visited[col][row] = true;
            match.push({ col, row, symbol: this.grid[col][row] });
            
            // Check all 4 directions
            stack.push([col + 1, row]);
            stack.push([col - 1, row]);
            stack.push([col, row + 1]);
            stack.push([col, row - 1]);
        }
        
        return match;
    }
    
    removeMatches(matches) {
        const removedSymbols = [];
        
        for (const match of matches) {
            for (const { col, row, symbol } of match) {
                if (symbol) {
                    removedSymbols.push(symbol);
                    this.grid[col][row] = null;
                    
                    // Use Symbol's destroy method which handles animation
                    // Don't add to pool as Symbol.destroy() will fully destroy it
                    symbol.destroy();
                }
            }
        }
        
        return removedSymbols;
    }
    
    async cascadeSymbols() {
        this.isCascading = true;
        const promises = [];
        
        // For each column, drop symbols down
        for (let col = 0; col < this.cols; col++) {
            let emptyRow = -1;
            
            // Find empty spaces from bottom to top
            for (let row = this.rows - 1; row >= 0; row--) {
                if (!this.grid[col][row] && emptyRow === -1) {
                    emptyRow = row;
                } else if (this.grid[col][row] && emptyRow !== -1) {
                    // Move symbol down
                    const symbol = this.grid[col][row];
                    this.grid[col][emptyRow] = symbol;
                    this.grid[col][row] = null;
                    
                    symbol.setGridPosition(col, emptyRow);
                    const newPos = this.getSymbolPosition(col, emptyRow);
                    symbol.updatePosition(newPos.x, symbol.y);
                    
                    // Use Symbol's fall method
                    const promise = symbol.fall(newPos.y);
                    promises.push(promise);
                    emptyRow--;
                }
            }
        }
        
        // Wait for all drops to complete
        await Promise.all(promises);
        
        // Fill empty spaces with new symbols
        await this.fillEmptySpaces();
        
        this.isCascading = false;
        this.cascadeCount++;
        
        return true;
    }
    
    async fillEmptySpaces() {
        const promises = [];
        
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                if (!this.grid[col][row]) {
                    const randomType = this.getRandomSymbolType();
                    const symbol = this.createSymbol(randomType, col, row);
                    
                    // Start above the grid
                    const startY = this.gridY - this.symbolSize * 2;
                    symbol.setPosition(symbol.x, startY);
                    
                    this.grid[col][row] = symbol;
                    
                    const targetPos = this.getSymbolPosition(col, row);
                    
                    const promise = new Promise(resolve => {
                        this.scene.tweens.add({
                            targets: symbol,
                            y: targetPos.y,
                            duration: GameConfig.CASCADE_SPEED,
                            ease: 'Bounce.out',
                            delay: row * 50, // Stagger the drops
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
        const gemTypes = ['space_gem', 'mind_gem', 'reality_gem', 'power_gem', 'time_gem'];
        const foundGems = new Set();
        
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                const symbol = this.grid[col][row];
                if (symbol && gemTypes.includes(symbol.symbolType)) {
                    foundGems.add(symbol.symbolType);
                }
            }
        }
        
        return foundGems.size === gemTypes.length;
    }
    
    countScatters() {
        let count = 0;
        
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                const symbol = this.grid[col][row];
                if (symbol && symbol.symbolType === 'infinity_glove') {
                    count++;
                }
            }
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
            
            // Visual effect - make the symbol glow and pulse
            this.scene.tweens.add({
                targets: symbol,
                scaleX: 1.4,
                scaleY: 1.4,
                duration: 300,
                yoyo: true,
                repeat: 3,
                ease: 'Power2'
            });
            
            // Add glowing effect
            symbol.setTint(0xFFD700); // Golden glow
            
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
            
            // Animate multiplier text
            this.scene.tweens.add({
                targets: multText,
                scaleX: 1,
                scaleY: 1,
                duration: 300,
                ease: 'Back.out',
                onComplete: () => {
                    // Keep the multiplier text visible during the spin
                    this.scene.time.delayedCall(2000, () => {
                        this.scene.tweens.add({
                            targets: multText,
                            alpha: 0,
                            y: multText.y - 20,
                            duration: 500,
                            onComplete: () => multText.destroy()
                        });
                    });
                }
            });
            
            console.log(`Infinity Power applied: Symbol at (${col},${row}) now has x${multiplier} multiplier`);
        }
    }
} 