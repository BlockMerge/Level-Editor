// ===== Global State =====
let gameData = {
    worlds: [
        {
            worldId: 1,
            worldName: "World 1",
            levels: []
        }
    ]
};

let currentWorldIndex = 0;
let currentLevelIndex = 0;
let selectedBlockType = "normal";
let autoSaveEnabled = true;

// ===== Constants =====
const LEVELS_PER_WORLD = 10; // 9 normal + 1 boss
const BLOCK_TYPES = ["normal", "explosive", "doubleDamage", "reinforced"];

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    initializeWorld();
    renderLevelGrid();
    renderWorldSelector();
    updateGridSize();
    updatePreview();
});

// ===== Initialization Functions =====
function initializeWorld() {
    const world = gameData.worlds[currentWorldIndex];

    // Initialize levels if they don't exist
    if (world.levels.length === 0) {
        for (let i = 0; i < LEVELS_PER_WORLD; i++) {
            world.levels.push({
                levelId: i + 1,
                isBossLevel: i === 9, // Level 10 is boss
                gridWidth: 6,
                gridHeight: 8,
                blocks: []
            });
        }
    }

    // Update UI
    document.getElementById('worldName').value = world.worldName;
}

// ===== World Management =====
function addWorld() {
    const newWorldId = gameData.worlds.length + 1;
    const newWorld = {
        worldId: newWorldId,
        worldName: `World ${newWorldId}`,
        levels: []
    };

    // Initialize levels for new world
    for (let i = 0; i < LEVELS_PER_WORLD; i++) {
        newWorld.levels.push({
            levelId: i + 1,
            isBossLevel: i === 9,
            gridWidth: 6,
            gridHeight: 8,
            blocks: []
        });
    }

    gameData.worlds.push(newWorld);
    currentWorldIndex = gameData.worlds.length - 1;

    renderWorldSelector();
    renderLevelGrid();
    updateCurrentLevel();
    saveToLocalStorage();
    showNotification('✅ New world created!', 'success');
}

function deleteWorld() {
    if (gameData.worlds.length === 1) {
        showNotification('❌ Cannot delete the last world!', 'error');
        return;
    }

    // Store world name for notification
    const deletedWorldName = gameData.worlds[currentWorldIndex].worldName;

    gameData.worlds.splice(currentWorldIndex, 1);
    currentWorldIndex = Math.max(0, currentWorldIndex - 1);
    currentLevelIndex = 0;

    // Update world selector first
    renderWorldSelector();

    // Reinitialize the current world
    initializeWorld();

    // Update level grid and current level
    renderLevelGrid();
    updateCurrentLevel();

    saveToLocalStorage();
    showNotification(`🗑️ Deleted "${deletedWorldName}"`, 'info');
}

function switchWorld() {
    currentWorldIndex = parseInt(document.getElementById('worldSelect').value);
    currentLevelIndex = 0;

    const world = gameData.worlds[currentWorldIndex];
    document.getElementById('worldName').value = world.worldName;

    renderLevelGrid();
    updateCurrentLevel();
}

function updateWorldName() {
    const newName = document.getElementById('worldName').value;
    gameData.worlds[currentWorldIndex].worldName = newName;
    renderWorldSelector();
    updateCurrentLevel();
    saveToLocalStorage();
}

function renderWorldSelector() {
    const select = document.getElementById('worldSelect');
    select.innerHTML = '';

    gameData.worlds.forEach((world, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = world.worldName;
        option.selected = index === currentWorldIndex;
        select.appendChild(option);
    });
}

// ===== Level Management =====
function renderLevelGrid() {
    const container = document.getElementById('levelGrid');
    container.innerHTML = '';

    const world = gameData.worlds[currentWorldIndex];

    for (let i = 0; i < LEVELS_PER_WORLD; i++) {
        const levelItem = document.createElement('div');
        levelItem.className = 'level-item';

        if (i === 9) {
            levelItem.classList.add('boss');
        }

        if (i === currentLevelIndex) {
            levelItem.classList.add('active');
        }

        levelItem.onclick = () => switchLevel(i);

        const levelNumber = document.createElement('div');
        levelNumber.className = 'level-number';
        levelNumber.textContent = i + 1;

        const levelLabel = document.createElement('div');
        levelLabel.className = 'level-label';
        levelLabel.textContent = i === 9 ? 'BOSS' : 'Normal';

        levelItem.appendChild(levelNumber);
        levelItem.appendChild(levelLabel);
        container.appendChild(levelItem);
    }
}

function switchLevel(levelIndex) {
    currentLevelIndex = levelIndex;
    renderLevelGrid();
    updateCurrentLevel();
}

function updateCurrentLevel() {
    const world = gameData.worlds[currentWorldIndex];
    const level = world.levels[currentLevelIndex];

    // Update info display
    document.getElementById('currentLevelInfo').textContent =
        `${world.worldName} - Level ${level.levelId}${level.isBossLevel ? ' (BOSS)' : ''}`;

    // Update grid size inputs
    document.getElementById('gridWidth').value = level.gridWidth;
    document.getElementById('gridHeight').value = level.gridHeight;
    document.getElementById('gridSizeInfo').textContent = `Grid: ${level.gridWidth}x${level.gridHeight}`;

    // Render the grid
    renderGrid();
    updatePreview();
}

// ===== Grid Management =====
function updateGridSize() {
    const width = parseInt(document.getElementById('gridWidth').value);
    const height = parseInt(document.getElementById('gridHeight').value);

    const world = gameData.worlds[currentWorldIndex];
    const level = world.levels[currentLevelIndex];

    level.gridWidth = width;
    level.gridHeight = height;

    // Remove blocks that are out of bounds
    level.blocks = level.blocks.filter(block =>
        block.row < height && block.col < width
    );

    document.getElementById('gridSizeInfo').textContent = `Grid: ${width}x${height}`;

    renderGrid();
    saveToLocalStorage();
}

function renderGrid() {
    const world = gameData.worlds[currentWorldIndex];
    const level = world.levels[currentLevelIndex];

    const container = document.getElementById('gridContainer');
    container.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'grid';
    grid.style.gridTemplateColumns = `repeat(${level.gridWidth}, 50px)`;
    grid.style.gridTemplateRows = `repeat(${level.gridHeight}, 50px)`;

    for (let row = 0; row < level.gridHeight; row++) {
        for (let col = 0; col < level.gridWidth; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            // Check if there's a block at this position
            const block = level.blocks.find(b => b.row === row && b.col === col);
            if (block) {
                cell.classList.add('has-block', `block-${block.blockType}`);
            }

            cell.onclick = () => toggleBlock(row, col);
            grid.appendChild(cell);
        }
    }

    container.appendChild(grid);
}

function toggleBlock(row, col) {
    const world = gameData.worlds[currentWorldIndex];
    const level = world.levels[currentLevelIndex];

    // Find existing block at this position
    const blockIndex = level.blocks.findIndex(b => b.row === row && b.col === col);

    if (selectedBlockType === 'empty') {
        // Remove block if it exists
        if (blockIndex !== -1) {
            level.blocks.splice(blockIndex, 1);
        }
    } else {
        // Add or update block
        if (blockIndex !== -1) {
            // Update existing block type
            level.blocks[blockIndex].blockType = selectedBlockType;
        } else {
            // Add new block
            level.blocks.push({
                row: row,
                col: col,
                blockType: selectedBlockType
            });
        }
    }

    renderGrid();
    updatePreview();
    saveToLocalStorage();
}

function clearGrid() {
    if (!confirm('Are you sure you want to clear this level?')) {
        return;
    }

    const world = gameData.worlds[currentWorldIndex];
    const level = world.levels[currentLevelIndex];
    level.blocks = [];

    renderGrid();
    updatePreview();
    saveToLocalStorage();
    showNotification('🗑️ Grid cleared', 'info');
}

// ===== Block Type Selection =====
function selectBlockType(type) {
    selectedBlockType = type;

    // Update palette UI
    document.querySelectorAll('.palette-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.type === type) {
            item.classList.add('active');
        }
    });
}

// ===== JSON Preview & Export =====
function updatePreview() {
    const preview = document.getElementById('jsonContent');
    const currentWorld = gameData.worlds[currentWorldIndex];
    const currentLevel = currentWorld.levels[currentLevelIndex];
    preview.textContent = JSON.stringify(currentLevel, null, 2);
}

function exportJSON() {
    const exportScope = document.getElementById('exportScope').value;
    const currentWorld = gameData.worlds[currentWorldIndex];
    const currentLevel = currentWorld.levels[currentLevelIndex];

    let dataToExport;
    let filename;
    let successMessage;

    switch (exportScope) {
        case 'level':
            // Export only the current level
            dataToExport = currentLevel;
            filename = `level_w${currentWorld.worldId}_l${currentLevel.levelId}.json`;
            successMessage = `✅ Level ${currentLevel.levelId} exported successfully!`;
            break;

        case 'world':
            // Export the entire current world (all levels)
            dataToExport = currentWorld;
            filename = `world_${currentWorld.worldId}_${currentWorld.worldName.replace(/\s+/g, '_')}.json`;
            successMessage = `✅ World "${currentWorld.worldName}" exported successfully!`;
            break;

        case 'all':
            // Export all worlds
            dataToExport = gameData;
            filename = `blockmerge_all_worlds.json`;
            successMessage = `✅ All worlds exported successfully!`;
            break;

        default:
            dataToExport = currentLevel;
            filename = `level_w${currentWorld.worldId}_l${currentLevel.levelId}.json`;
            successMessage = `✅ Level ${currentLevel.levelId} exported successfully!`;
    }

    const json = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification(successMessage, 'success');
}

function importJSON() {
    document.getElementById('fileInput').click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);

            // Validate the imported data
            if (!imported.worlds || !Array.isArray(imported.worlds)) {
                throw new Error('Invalid data format: missing worlds array');
            }

            // Update game data
            gameData = imported;
            currentWorldIndex = 0;
            currentLevelIndex = 0;

            // Update UI
            renderWorldSelector();
            renderLevelGrid();
            updateCurrentLevel();
            saveToLocalStorage();

            showNotification('✅ JSON imported successfully!', 'success');
        } catch (error) {
            showNotification('❌ Error importing JSON: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
}

// ===== Local Storage =====
function saveToLocalStorage() {
    if (!autoSaveEnabled) return;

    try {
        localStorage.setItem('blockmerge_level_data', JSON.stringify(gameData));
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('blockmerge_level_data');
        if (saved) {
            gameData = JSON.parse(saved);
            showNotification('📂 Loaded saved data from browser', 'info');
        }
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
    }
}

function toggleAutoSave() {
    autoSaveEnabled = document.getElementById('autoSave').checked;
    if (autoSaveEnabled) {
        saveToLocalStorage();
        showNotification('✅ Auto-save enabled', 'success');
    } else {
        showNotification('⚠️ Auto-save disabled', 'warning');
    }
}

// ===== Notifications =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== Animation Styles =====
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
