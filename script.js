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
let selectedShape = "single";
let autoSaveEnabled = true;

// ===== Constants =====
const LEVELS_PER_WORLD = 10; // 9 normal + 1 boss
const BLOCK_TYPES = ["normal", "explosive", "doubleDamage", "reinforced"];

// Shape definitions: array of [rowOffset, colOffset] relative to anchor (top-left)
const SHAPES = {
    single: { name: "■", cells: [[0,0]], cols: 1, rows: 1 },
    I2H:   { name: "▬ ×2", cells: [[0,0],[0,1]], cols: 2, rows: 1 },
    I3H:   { name: "▬ ×3", cells: [[0,0],[0,1],[0,2]], cols: 3, rows: 1 },
    I4H:   { name: "▬ ×4", cells: [[0,0],[0,1],[0,2],[0,3]], cols: 4, rows: 1 },
    I2V:   { name: "▮ ×2", cells: [[0,0],[1,0]], cols: 1, rows: 2 },
    I3V:   { name: "▮ ×3", cells: [[0,0],[1,0],[2,0]], cols: 1, rows: 3 },
    I4V:   { name: "▮ ×4", cells: [[0,0],[1,0],[2,0],[3,0]], cols: 1, rows: 4 },
    L:     { name: "L",   cells: [[0,0],[1,0],[2,0],[2,1]], cols: 2, rows: 3 },
    J:     { name: "J",   cells: [[0,1],[1,1],[2,0],[2,1]], cols: 2, rows: 3 },
    T:     { name: "T",   cells: [[0,0],[0,1],[0,2],[1,1]], cols: 3, rows: 2 },
    S:     { name: "S",   cells: [[0,1],[0,2],[1,0],[1,1]], cols: 3, rows: 2 },
    Z:     { name: "Z",   cells: [[0,0],[0,1],[1,1],[1,2]], cols: 3, rows: 2 },
    O:     { name: "□",   cells: [[0,0],[0,1],[1,0],[1,1]], cols: 2, rows: 2 },
    // Custom shape — updated live by the builder
    __custom__: { name: "Custom", cells: [[0,0]], cols: 1, rows: 1 },
};

// ===== Custom Shape Builder State =====
let customBuilderRows = 3;
let customBuilderCols = 3;
let customBuilderCells = new Set(); // set of "row,col" strings

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    initializeWorld();
    renderLevelGrid();
    renderWorldSelector();
    updateGridSize();
    renderMissionList();
    updatePreview();
    renderShapeSelector();
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
                blocks: [],
                missionItems: []
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
            blocks: [],
            missionItems: []
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
    renderMissionList();
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

// ===== Shape helpers =====
function generateGuidSimple() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/** Returns the absolute cell positions for the currently selected shape
 *  anchored at (anchorRow, anchorCol). */
function getShapeCells(anchorRow, anchorCol, shapeKey) {
    const shape = SHAPES[shapeKey] || SHAPES.single;
    return shape.cells.map(([dr, dc]) => ({ row: anchorRow + dr, col: anchorCol + dc }));
}

/** Check if all cells of a shape fit within the grid. */
function shapeFitsInGrid(cells, gridWidth, gridHeight) {
    return cells.every(c => c.row >= 0 && c.row < gridHeight && c.col >= 0 && c.col < gridWidth);
}

/** Check if all cells of a shape are free (or occupied by the same shapeId to allow overwrite). */
function shapeCellsFree(cells, blocks, excludeShapeId = null) {
    return cells.every(c => {
        const existing = blocks.find(b => b.row === c.row && b.col === c.col);
        if (!existing) return true;
        if (excludeShapeId && existing.shapeId === excludeShapeId) return true;
        return false;
    });
}

// ===== Grid Rendering =====
function renderGrid() {
    const world = gameData.worlds[currentWorldIndex];
    const level = world.levels[currentLevelIndex];

    const container = document.getElementById('gridContainer');
    container.innerHTML = '';

    const grid = document.createElement('div');
    grid.className = 'grid';
    grid.style.gridTemplateColumns = `repeat(${level.gridWidth}, 50px)`;
    grid.style.gridTemplateRows = `repeat(${level.gridHeight}, 50px)`;

    // Build a quick lookup map for shape adjacency
    const blockMap = {};
    level.blocks.forEach(b => {
        blockMap[`${b.row},${b.col}`] = b;
    });

    // Greedy 3-coloring so adjacent shapes always have distinct tints.
    // Build adjacency between shapes.
    const shapeIds = [...new Set(level.blocks.filter(b => b.shapeId).map(b => b.shapeId))];
    const adjSet = {};
    shapeIds.forEach(id => { adjSet[id] = new Set(); });
    level.blocks.forEach(b => {
        if (!b.shapeId) return;
        [
            blockMap[`${b.row},${b.col+1}`],
            blockMap[`${b.row},${b.col-1}`],
            blockMap[`${b.row+1},${b.col}`],
            blockMap[`${b.row-1},${b.col}`],
        ].forEach(nb => {
            if (nb && nb.shapeId && nb.shapeId !== b.shapeId)
                adjSet[b.shapeId].add(nb.shapeId);
        });
    });
    // Sort shapes by top-left position (row-major) so greedy order is stable.
    const shapeTopLeft = {};
    level.blocks.forEach(b => {
        if (!b.shapeId) return;
        const prev = shapeTopLeft[b.shapeId];
        if (!prev || b.row < prev.row || (b.row === prev.row && b.col < prev.col))
            shapeTopLeft[b.shapeId] = { row: b.row, col: b.col };
    });
    const sortedShapeIds = shapeIds.slice().sort((a, b) => {
        const pa = shapeTopLeft[a] || {row:0,col:0};
        const pb = shapeTopLeft[b] || {row:0,col:0};
        return pa.row !== pb.row ? pa.row - pb.row : pa.col - pb.col;
    });
    // Greedy assign: pick lowest color (0,1,2) not used by any already-colored neighbour.
    const shapeTintIndex = {};
    sortedShapeIds.forEach(id => {
        const usedColors = new Set([...adjSet[id]]
            .filter(nid => shapeTintIndex[nid] !== undefined)
            .map(nid => shapeTintIndex[nid]));
        for (let c = 0; c <= 3; c++) {
            if (!usedColors.has(c)) { shapeTintIndex[id] = c; break; }
        }
    });

    for (let row = 0; row < level.gridHeight; row++) {
        for (let col = 0; col < level.gridWidth; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            const block = blockMap[`${row},${col}`];
            if (block) {
                cell.classList.add('has-block', `block-${block.blockType}`);
                cell.dataset.shapeId = block.shapeId || '';

                // Greedy 3-tint: 0=normal, 1=dim, 2=dimmer — adjacent shapes always differ.
                const tint = block.shapeId ? shapeTintIndex[block.shapeId] : 0;
                if (tint === 1) cell.classList.add('block-tint-alt');
                if (tint === 2) cell.classList.add('block-tint-alt2');

                // Add connection classes: suppress borders between adjacent same-shape cells
                if (block.shapeId) {
                    const right  = blockMap[`${row},${col+1}`];
                    const left   = blockMap[`${row},${col-1}`];
                    const bottom = blockMap[`${row+1},${col}`];
                    const top    = blockMap[`${row-1},${col}`];

                    if (right  && right.shapeId  === block.shapeId) cell.classList.add('conn-right');
                    if (left   && left.shapeId   === block.shapeId) cell.classList.add('conn-left');
                    if (bottom && bottom.shapeId === block.shapeId) cell.classList.add('conn-bottom');
                    if (top    && top.shapeId    === block.shapeId) cell.classList.add('conn-top');
                }
            }

            cell.addEventListener('click', () => toggleBlock(row, col));
            cell.addEventListener('mouseenter', () => showShapePreview(row, col));
            cell.addEventListener('mouseleave', clearShapePreview);
            grid.appendChild(cell);
        }
    }

    container.appendChild(grid);
}

// ===== Hover Preview =====
function showShapePreview(anchorRow, anchorCol) {
    const world = gameData.worlds[currentWorldIndex];
    const level = world.levels[currentLevelIndex];

    clearShapePreview();

    if (selectedBlockType === 'empty') return;

    const cells = getShapeCells(anchorRow, anchorCol, selectedShape);

    cells.forEach(c => {
        const cell = document.querySelector(`.grid-cell[data-row="${c.row}"][data-col="${c.col}"]`);
        if (cell) {
            const fits = c.row >= 0 && c.row < level.gridHeight && c.col >= 0 && c.col < level.gridWidth;
            if (fits) {
                cell.classList.add('shape-preview', `preview-${selectedBlockType}`);
            }
        }
    });
}

function clearShapePreview() {
    document.querySelectorAll('.grid-cell.shape-preview').forEach(cell => {
        cell.classList.remove('shape-preview',
            'preview-normal', 'preview-explosive',
            'preview-doubleDamage', 'preview-reinforced');
    });
}

// ===== Block Placement =====
function toggleBlock(row, col) {
    const world = gameData.worlds[currentWorldIndex];
    const level = world.levels[currentLevelIndex];

    clearShapePreview();

    if (selectedBlockType === 'empty') {
        // Erase: find the block and remove all cells of its shape
        const block = level.blocks.find(b => b.row === row && b.col === col);
        if (block) {
            if (block.shapeId) {
                // Remove all cells with same shapeId
                level.blocks = level.blocks.filter(b => b.shapeId !== block.shapeId);
            } else {
                level.blocks = level.blocks.filter(b => !(b.row === row && b.col === col));
            }
        }
    } else {
        // Clicking on an existing block: figure out what shapeId is there
        const existingAtClick = level.blocks.find(b => b.row === row && b.col === col);
        const existingShapeId = existingAtClick ? existingAtClick.shapeId : null;

        // The new cells this placement would occupy
        const cells = getShapeCells(row, col, selectedShape);

        // Validation: must fit in grid
        if (!shapeFitsInGrid(cells, level.gridWidth, level.gridHeight)) {
            showNotification('⚠️ Shape doesn\'t fit here!', 'warning');
            return;
        }

        // Remove any existing shape that was at the clicked cell (replace behaviour)
        if (existingShapeId) {
            level.blocks = level.blocks.filter(b => b.shapeId !== existingShapeId);
        }

        // Check if remaining cells are free
        if (!shapeCellsFree(cells, level.blocks)) {
            showNotification('⚠️ Some cells are occupied!', 'warning');
            // Restore removed shape
            if (existingShapeId) {
                // We already removed it – need to re-render to restore. Easiest: just re-render
                renderGrid();
                updatePreview();
                return;
            }
            return;
        }

        // Place all cells with shared shapeId
        const newShapeId = generateGuidSimple();
        cells.forEach(c => {
            level.blocks.push({
                row: c.row,
                col: c.col,
                blockType: selectedBlockType,
                shapeId: newShapeId,
                shapeType: selectedShape
            });
        });
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

// ===== Shape Selector =====
function selectShape(key) {
    selectedShape = key;

    document.querySelectorAll('.shape-item').forEach(item => {
        item.classList.toggle('active', item.dataset.shape === key);
    });

    // If switching away from custom, hide builder tab indicator
    if (key !== '__custom__') {
        document.querySelectorAll('.shape-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === 'presets');
        });
        document.getElementById('shapeTabPresets').style.display = '';
        document.getElementById('shapeTabCustom').style.display = 'none';
    }
}

function renderShapeSelector() {
    const container = document.getElementById('shapeSelector');
    if (!container) return;
    container.innerHTML = '';

    // ---- Tab bar ----
    const tabBar = document.createElement('div');
    tabBar.className = 'shape-tab-bar';

    const tabPresetBtn = document.createElement('button');
    tabPresetBtn.className = 'shape-tab-btn active';
    tabPresetBtn.dataset.tab = 'presets';
    tabPresetBtn.textContent = 'Presets';

    const tabCustomBtn = document.createElement('button');
    tabCustomBtn.className = 'shape-tab-btn';
    tabCustomBtn.dataset.tab = 'custom';
    tabCustomBtn.textContent = '✏️ Draw';

    tabBar.appendChild(tabPresetBtn);
    tabBar.appendChild(tabCustomBtn);
    container.appendChild(tabBar);

    // ---- Presets tab ----
    const presetsPanel = document.createElement('div');
    presetsPanel.id = 'shapeTabPresets';
    presetsPanel.className = 'shape-presets-grid';

    Object.entries(SHAPES).forEach(([key, shape]) => {
        if (key === '__custom__') return; // skip — shown in draw tab

        const item = document.createElement('div');
        item.className = 'shape-item' + (key === selectedShape ? ' active' : '');
        item.dataset.shape = key;
        item.title = shape.name;
        item.onclick = () => selectShape(key);

        const miniGrid = document.createElement('div');
        miniGrid.className = 'shape-mini-grid';
        miniGrid.style.gridTemplateColumns = `repeat(${shape.cols}, 1fr)`;
        miniGrid.style.gridTemplateRows = `repeat(${shape.rows}, 1fr)`;

        const filledSet = new Set(shape.cells.map(([r, c]) => `${r},${c}`));
        for (let r = 0; r < shape.rows; r++) {
            for (let c = 0; c < shape.cols; c++) {
                const miniCell = document.createElement('div');
                miniCell.className = filledSet.has(`${r},${c}`) ? 'shape-mini-cell filled' : 'shape-mini-cell empty';
                miniGrid.appendChild(miniCell);
            }
        }

        const label = document.createElement('span');
        label.textContent = shape.name;

        item.appendChild(miniGrid);
        item.appendChild(label);
        presetsPanel.appendChild(item);
    });
    container.appendChild(presetsPanel);

    // ---- Custom / Draw tab ----
    const customPanel = document.createElement('div');
    customPanel.id = 'shapeTabCustom';
    customPanel.className = 'shape-custom-panel';
    customPanel.style.display = 'none';
    container.appendChild(customPanel);

    renderCustomBuilder(customPanel);

    // ---- Tab switching logic ----
    tabPresetBtn.onclick = () => {
        tabPresetBtn.classList.add('active');
        tabCustomBtn.classList.remove('active');
        presetsPanel.style.display = '';
        customPanel.style.display = 'none';
    };
    tabCustomBtn.onclick = () => {
        tabCustomBtn.classList.add('active');
        tabPresetBtn.classList.remove('active');
        presetsPanel.style.display = 'none';
        customPanel.style.display = '';
    };

    // If custom is already selected, show draw tab
    if (selectedShape === '__custom__') {
        tabCustomBtn.click();
    }
}

// ===== Custom Shape Builder =====
function renderCustomBuilder(panel) {
    // Size controls
    const sizeRow = document.createElement('div');
    sizeRow.className = 'custom-size-row';
    sizeRow.innerHTML = `
        <label>Cols <input id="custCols" type="number" min="1" max="6" value="${customBuilderCols}"></label>
        <label>Rows <input id="custRows" type="number" min="1" max="6" value="${customBuilderRows}"></label>
        <button class="btn btn-secondary btn-sm" id="custClearBtn">🗑 Clear</button>
    `;
    panel.appendChild(sizeRow);

    // Canvas
    const canvas = document.createElement('div');
    canvas.className = 'custom-builder-canvas';
    canvas.id = 'customBuilderCanvas';
    panel.appendChild(canvas);

    // Use button
    const useBtn = document.createElement('button');
    useBtn.className = 'btn btn-primary btn-sm';
    useBtn.textContent = '✅ Use this shape';
    useBtn.style.marginTop = '0.5rem';
    useBtn.onclick = applyCustomShape;
    panel.appendChild(useBtn);

    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = 'Click cells to draw, then press Use.';
    panel.appendChild(hint);

    // Wire size inputs
    panel.querySelector('#custCols').addEventListener('change', e => {
        customBuilderCols = Math.max(1, Math.min(6, parseInt(e.target.value) || 1));
        e.target.value = customBuilderCols;
        // Prune cells outside new size
        customBuilderCells = new Set([...customBuilderCells].filter(k => {
            const [r, c] = k.split(',').map(Number);
            return r < customBuilderRows && c < customBuilderCols;
        }));
        refreshCustomCanvas();
    });
    panel.querySelector('#custRows').addEventListener('change', e => {
        customBuilderRows = Math.max(1, Math.min(6, parseInt(e.target.value) || 1));
        e.target.value = customBuilderRows;
        customBuilderCells = new Set([...customBuilderCells].filter(k => {
            const [r, c] = k.split(',').map(Number);
            return r < customBuilderRows && c < customBuilderCols;
        }));
        refreshCustomCanvas();
    });
    panel.querySelector('#custClearBtn').addEventListener('click', () => {
        customBuilderCells.clear();
        refreshCustomCanvas();
    });

    refreshCustomCanvas();
}

function refreshCustomCanvas() {
    const canvas = document.getElementById('customBuilderCanvas');
    if (!canvas) return;
    canvas.innerHTML = '';
    canvas.style.gridTemplateColumns = `repeat(${customBuilderCols}, 1fr)`;
    canvas.style.gridTemplateRows = `repeat(${customBuilderRows}, 1fr)`;

    for (let r = 0; r < customBuilderRows; r++) {
        for (let c = 0; c < customBuilderCols; c++) {
            const cell = document.createElement('div');
            const key = `${r},${c}`;
            cell.className = 'custom-builder-cell' + (customBuilderCells.has(key) ? ' filled' : '');
            cell.addEventListener('click', () => {
                if (customBuilderCells.has(key)) {
                    customBuilderCells.delete(key);
                } else {
                    customBuilderCells.add(key);
                }
                refreshCustomCanvas();
            });
            canvas.appendChild(cell);
        }
    }
}

function applyCustomShape() {
    if (customBuilderCells.size === 0) {
        showNotification('⚠️ Draw at least one cell!', 'warning');
        return;
    }

    // Normalise: shift so min row = 0, min col = 0
    const parsed = [...customBuilderCells].map(k => k.split(',').map(Number));
    const minR = Math.min(...parsed.map(([r]) => r));
    const minC = Math.min(...parsed.map(([, c]) => c));
    const normalised = parsed.map(([r, c]) => [r - minR, c - minC]);

    const maxR = Math.max(...normalised.map(([r]) => r));
    const maxC = Math.max(...normalised.map(([, c]) => c));

    SHAPES['__custom__'] = {
        name: 'Custom',
        cells: normalised,
        rows: maxR + 1,
        cols: maxC + 1,
    };

    selectedShape = '__custom__';
    showNotification('✅ Custom shape applied!', 'success');
}

// ===== Export Transform =====
/**
 * Converts a level's flat cell-block array into grouped pieces.
 * Each piece = one shape (same shapeId) with its full list of cells.
 * Single-cell blocks without a shapeId are each their own piece.
 * Returns a plain object safe to JSON-stringify.
 */
function buildExportLevel(level) {
    const pieceMap = {}; // shapeId -> piece object

    level.blocks.forEach(b => {
        const key = b.shapeId || `__solo__${b.row}_${b.col}`;
        if (!pieceMap[key]) {
            pieceMap[key] = {
                id: b.shapeId || key,
                blockType: b.blockType,
                shapeType: b.shapeType || 'single',
                cells: []
            };
        }
        pieceMap[key].cells.push({ row: b.row, col: b.col });
    });

    return {
        levelId:    level.levelId,
        isBossLevel: level.isBossLevel,
        gridWidth:  level.gridWidth,
        gridHeight: level.gridHeight,
        blocks: Object.values(pieceMap),
        missionItems: level.missionItems || []
    };
}

function buildExportWorld(world) {
    return {
        worldId:   world.worldId,
        worldName: world.worldName,
        levels: world.levels.map(buildExportLevel)
    };
}

function buildExportAll() {
    return { worlds: gameData.worlds.map(buildExportWorld) };
}

// ===== JSON Preview & Export =====
function updatePreview() {
    const preview = document.getElementById('jsonContent');
    const currentWorld = gameData.worlds[currentWorldIndex];
    const currentLevel = currentWorld.levels[currentLevelIndex];
    preview.textContent = JSON.stringify(buildExportLevel(currentLevel), null, 2);
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
            dataToExport = buildExportLevel(currentLevel);
            filename = `level_w${currentWorld.worldId}_l${currentLevel.levelId}.json`;
            successMessage = `✅ Level ${currentLevel.levelId} exported successfully!`;
            break;

        case 'world':
            dataToExport = buildExportWorld(currentWorld);
            filename = `world_${currentWorld.worldId}_${currentWorld.worldName.replace(/\s+/g, '_')}.json`;
            successMessage = `✅ World "${currentWorld.worldName}" exported successfully!`;
            break;

        case 'all':
            dataToExport = buildExportAll();
            filename = `blockmerge_all_worlds.json`;
            successMessage = `✅ All worlds exported successfully!`;
            break;

        default:
            dataToExport = buildExportLevel(currentLevel);
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

// ===== Mission Management =====
function generateGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function renderMissionList() {
    const world = gameData.worlds[currentWorldIndex];
    const level = world.levels[currentLevelIndex];
    const container = document.getElementById('missionList');

    if (!level.missionItems) {
        level.missionItems = [];
    }

    if (level.missionItems.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center;">No missions yet. Click "Add Mission" to create one.</p>';
        return;
    }

    container.innerHTML = '';

    level.missionItems.forEach((mission, index) => {
        const missionDiv = document.createElement('div');
        missionDiv.className = 'mission-item';

        missionDiv.innerHTML = `
            <div class="mission-header">
                <span class="mission-type-badge ${mission.type.toLowerCase()}">${mission.type}</span>
                <button class="mission-delete-btn" onclick="deleteMission(${index})" title="Delete Mission">🗑️</button>
            </div>
            <div class="mission-fields">
                <div>
                    <div class="mission-field-label">Mission Type</div>
                    <select onchange="updateMission(${index}, 'type', this.value)">
                        <option value="Hit" ${mission.type === 'Hit' ? 'selected' : ''}>Hit</option>
                        <option value="Destroy" ${mission.type === 'Destroy' ? 'selected' : ''}>Destroy</option>
                        <option value="Combo" ${mission.type === 'Combo' ? 'selected' : ''}>Combo</option>
                    </select>
                </div>
                <div>
                    <div class="mission-field-label">Name</div>
                    <input type="text" value="${mission.name || ''}" 
                           onchange="updateMission(${index}, 'name', this.value)"
                           placeholder="Mission name">
                </div>
                <div>
                    <div class="mission-field-label">Description</div>
                    <textarea onchange="updateMission(${index}, 'description', this.value)"
                              placeholder="Mission description">${mission.description || ''}</textarea>
                </div>
                <div class="mission-field-row">
                    <div>
                        <div class="mission-field-label">Min Value</div>
                        <input type="number" value="${mission.minValue || 1}" min="1"
                               onchange="updateMission(${index}, 'minValue', parseInt(this.value))">
                    </div>
                    <div>
                        <div class="mission-field-label">Max Value</div>
                        <input type="number" value="${mission.maxValue || 10}" min="1"
                               onchange="updateMission(${index}, 'maxValue', parseInt(this.value))">
                    </div>
                </div>
                <div>
                    <div class="mission-field-label">Level Factor (multiplier per level)</div>
                    <input type="number" value="${mission.multLevelFactor || 1}" step="0.1" min="0"
                           onchange="updateMission(${index}, 'multLevelFactor', parseFloat(this.value))">
                </div>
            </div>
        `;

        container.appendChild(missionDiv);
    });
}

function addMission() {
    const world = gameData.worlds[currentWorldIndex];
    const level = world.levels[currentLevelIndex];

    if (!level.missionItems) {
        level.missionItems = [];
    }

    const newMission = {
        guid: generateGuid(),
        type: 'Hit',
        name: 'New Mission',
        description: 'Complete this mission',
        minValue: 5,
        maxValue: 10,
        multLevelFactor: 1.0
    };

    level.missionItems.push(newMission);
    renderMissionList();
    updatePreview();
    saveToLocalStorage();
    showNotification('✅ Mission added!', 'success');
}

function deleteMission(index) {
    if (!confirm('Are you sure you want to delete this mission?')) {
        return;
    }

    const world = gameData.worlds[currentWorldIndex];
    const level = world.levels[currentLevelIndex];

    level.missionItems.splice(index, 1);
    renderMissionList();
    updatePreview();
    saveToLocalStorage();
    showNotification('🗑️ Mission deleted', 'info');
}

function updateMission(index, field, value) {
    const world = gameData.worlds[currentWorldIndex];
    const level = world.levels[currentLevelIndex];

    level.missionItems[index][field] = value;

    // Re-render to update the badge if type changed
    if (field === 'type') {
        renderMissionList();
    }

    updatePreview();
    saveToLocalStorage();
}
