import { useState, useCallback } from 'react';

export const useTableDragDrop = (originalTable) => {
  const [dragState, setDragState] = useState({
    draggedCell: null,
    draggedFromRow: null,
    draggedFromColumn: null,
    draggedFromPalette: false
  });

  const [tableState, setTableState] = useState({
    currentGrid: [],
    availableCells: [],
    cellsPlaced: 0
  });

  // Initialize table state
  const initializeTable = useCallback((tableData) => {
    if (!tableData) return;

    const rows = tableData.rows;
    const columns = tableData.columns;

    // Create empty grid structure
    const grid = Array(rows).fill(null).map(() => Array(columns).fill(null));

    // Place header cells in fixed positions
    const headerCells = tableData.cells.filter(cell => cell.isHeader);
    headerCells.forEach(header => {
      grid[header.row][header.column] = { ...header, isFixed: true };
    });

    // Get content cells for the palette (including empty cells)
    const contentCells = tableData.cells.filter(cell => !cell.isHeader);
    const shuffledContentCells = [...contentCells].sort(() => Math.random() - 0.5);

    setTableState({
      currentGrid: grid,
      availableCells: shuffledContentCells,
      cellsPlaced: 0
    });
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((cell) => {
    // Find if cell is currently placed in the grid
    let fromRow = null;
    let fromColumn = null;
    let fromPalette = true;

    for (let row = 0; row < tableState.currentGrid.length; row++) {
      for (let col = 0; col < tableState.currentGrid[row].length; col++) {
        const gridCell = tableState.currentGrid[row][col];
        if (gridCell && !gridCell.isFixed &&
            gridCell.row === cell.row &&
            gridCell.column === cell.column &&
            gridCell.text === cell.text) {
          fromRow = row;
          fromColumn = col;
          fromPalette = false;
          break;
        }
      }
      if (!fromPalette) break;
    }

    setDragState({
      draggedCell: cell,
      draggedFromRow: fromRow,
      draggedFromColumn: fromColumn,
      draggedFromPalette: fromPalette
    });
  }, [tableState.currentGrid]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDragState({
      draggedCell: null,
      draggedFromRow: null,
      draggedFromColumn: null,
      draggedFromPalette: false
    });
  }, []);

  // Handle cell drop
  const handleCellDrop = useCallback((targetRow, targetColumn, cell) => {
    setTableState(prev => {
      const newGrid = prev.currentGrid.map(row => [...row]);
      const newAvailable = [...prev.availableCells];

      // If dropping from palette, remove from available
      if (dragState.draggedFromPalette) {
        const cellIndex = newAvailable.findIndex(c =>
          c.row === cell.row && c.column === cell.column && c.text === cell.text
        );
        if (cellIndex !== -1) {
          newAvailable.splice(cellIndex, 1);
        }
      } else if (dragState.draggedFromRow !== null && dragState.draggedFromColumn !== null) {
        // If dropping from another position in grid, clear the old position
        newGrid[dragState.draggedFromRow][dragState.draggedFromColumn] = null;
      }

      // If target position is occupied by a non-header cell, return it to palette
      const targetCell = newGrid[targetRow][targetColumn];
      if (targetCell && !targetCell.isFixed) {
        newAvailable.push(targetCell);
      }

      // Place new cell in target position
      newGrid[targetRow][targetColumn] = { ...cell };

      // Calculate cells placed
      let cellsPlaced = 0;
      for (let row = 0; row < newGrid.length; row++) {
        for (let col = 0; col < newGrid[row].length; col++) {
          const gridCell = newGrid[row][col];
          if (gridCell && !gridCell.isFixed) {
            cellsPlaced++;
          }
        }
      }

      return {
        currentGrid: newGrid,
        availableCells: newAvailable,
        cellsPlaced
      };
    });

    // Clear drag state
    handleDragEnd();
  }, [dragState, handleDragEnd]);

  // Handle cell removal (click to remove)
  const handleCellRemove = useCallback((row, column) => {
    setTableState(prev => {
      const cell = prev.currentGrid[row][column];
      if (!cell || cell.isFixed) return prev;

      const newGrid = prev.currentGrid.map(gridRow => [...gridRow]);
      const newAvailable = [...prev.availableCells];

      // Remove cell from grid
      newGrid[row][column] = null;

      // Add cell back to palette
      newAvailable.push(cell);

      // Recalculate cells placed
      let cellsPlaced = 0;
      for (let gridRow = 0; gridRow < newGrid.length; gridRow++) {
        for (let col = 0; col < newGrid[gridRow].length; col++) {
          const gridCell = newGrid[gridRow][col];
          if (gridCell && !gridCell.isFixed) {
            cellsPlaced++;
          }
        }
      }

      return {
        currentGrid: newGrid,
        availableCells: newAvailable,
        cellsPlaced
      };
    });
  }, []);

  // Check if all content cells are placed
  const isTableComplete = useCallback(() => {
    return tableState.availableCells.length === 0;
  }, [tableState.availableCells.length]);

  // Get total content cells count
  const getTotalContentCells = useCallback(() => {
    if (!originalTable) return 0;
    return originalTable.cells.filter(cell => !cell.isHeader).length;
  }, [originalTable]);

  return {
    dragState,
    tableState,
    initializeTable,
    handleDragStart,
    handleDragEnd,
    handleCellDrop,
    handleCellRemove,
    isTableComplete,
    getTotalContentCells
  };
};