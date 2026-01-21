# BlockMerge Level Editor

A web-based level editor for creating BlockMerge game levels. Design worlds with 9 normal levels and 1 boss level each, then export to JSON for Unity integration.

## Features

- 🌍 **World Management**: Create multiple worlds with custom names
- 📋 **Level Organization**: 9 normal levels + 1 boss level per world
- 🎨 **Visual Grid Editor**: Customizable dimensions (3x3 to 20x20)
- 🧱 **Block Types**: Normal, Explosive, Double Damage, Reinforced
- 💾 **Auto-save**: Automatic browser localStorage backup
- 📤 **Export/Import**: JSON format for Unity integration

## Quick Start

1. Open `index.html` in your web browser
2. Design your levels using the visual grid editor
3. Click "💾 Export JSON" to download level data
4. Import the JSON file into your Unity project

## Usage

### Creating Levels

1. Select a world from the dropdown (or create a new one)
2. Click a level number (1-10) to edit
3. Set grid dimensions and click "Update Grid"
4. Select a block type from the palette
5. Click grid cells to place blocks
6. Repeat for all levels in the world

### Block Types

- **Normal** (Blue): Standard blocks
- **Explosive** (Red): Explodes when destroyed
- **Double Damage** (Orange): Takes double damage
- **Reinforced** (Purple): Special reinforced blocks
- **Eraser**: Remove blocks from grid

### Exporting for Unity

The exported JSON contains:
- World data (ID, name)
- Level data (ID, boss flag, dimensions)
- Block positions and types

Health values are NOT included - Unity handles these based on world progression.

## JSON Structure

```json
{
  "worlds": [
    {
      "worldId": 1,
      "worldName": "World 1",
      "levels": [
        {
          "levelId": 1,
          "isBossLevel": false,
          "gridWidth": 6,
          "gridHeight": 8,
          "blocks": [
            { "row": 0, "col": 0, "blockType": "normal" }
          ]
        }
      ]
    }
  ]
}
```

## Files

- `index.html` - Main application
- `styles.css` - Dark theme styling
- `script.js` - Core functionality

## Browser Compatibility

Works in all modern browsers (Chrome, Firefox, Edge, Safari)

## Local Storage

The editor automatically saves your work to browser localStorage. Your levels persist between sessions unless you clear browser data.

---

**Created for BlockMerge Unity Game Development**
