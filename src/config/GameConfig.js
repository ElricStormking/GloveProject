window.GameConfig = {
    // Grid Configuration
    GRID_COLS: 6,
    GRID_ROWS: 5,
    SYMBOL_SIZE: 100,
    GRID_SPACING: 5,
    
    // Game Settings
    MIN_MATCH_COUNT: 8,
    CASCADE_SPEED: 300, // milliseconds
    
    // Bet Configuration
    MIN_BET: 0.20,
    MAX_BET: 200,
    DEFAULT_BET: 1.00,
    BET_LEVELS: [0.20, 0.40, 0.60, 0.80, 1.00, 2.00, 5.00, 10.00, 20.00, 50.00, 100.00, 200.00],
    
    // Game Mechanics
    RTP: 0.96,
    VOLATILITY: 'HIGH',
    MAX_WIN_MULTIPLIER: 5000,
    
    // Symbol Types
    SYMBOLS: {
        SPACE_GEM: { id: 'space_gem', name: 'Space Gem', type: 'low', payout: 2 },
        MIND_GEM: { id: 'mind_gem', name: 'Mind Gem', type: 'low', payout: 2.5 },
        REALITY_GEM: { id: 'reality_gem', name: 'Reality Gem', type: 'low', payout: 3 },
        POWER_GEM: { id: 'power_gem', name: 'Power Gem', type: 'low', payout: 4 },
        TIME_GEM: { id: 'time_gem', name: 'Time Gem', type: 'low', payout: 5 },
        SOUL_GEM: { id: 'soul_gem', name: 'Soul Gem', type: 'low', payout: 6 },
        THANOS: { id: 'thanos', name: 'Thanos', type: 'high', payout: 10 },
        SCARLET_WITCH: { id: 'scarlet_witch', name: 'Scarlet Witch', type: 'high', payout: 25 },
        SCARLET_MAGIC_SPELL: { id: 'scarlet_magic_spell', name: 'Scarlet Magic Spell', type: 'high', payout: 15 },
        INFINITY_GLOVE: { id: 'infinity_glove', name: 'Infinity Glove', type: 'scatter', payout: 0 }
    },
    
    // Multipliers
    RANDOM_MULTIPLIERS: [2, 3, 4, 6, 8, 10, 100, 500],
    
    // Free Spins Configuration
    FREE_SPINS: {
        SCATTER_3: 10,
        SCATTER_4: 15,
        SCATTER_5: 20,
        RETRIGGER_SPINS: 2,
        BUY_FEATURE_MIN: 40,
        BUY_FEATURE_MAX: 100
    },
    
    // Audio Settings
    AUDIO: {
        MASTER_VOLUME: 0.7,
        MUSIC_VOLUME: 0.5,
        SFX_VOLUME: 0.8
    },
    
    // Visual Settings
    ANIMATIONS: {
        SYMBOL_DROP_TIME: 200,
        SYMBOL_DESTROY_TIME: 300,
        WIN_CELEBRATION_TIME: 2000,
        MULTIPLIER_APPEAR_TIME: 500
    }
}; 