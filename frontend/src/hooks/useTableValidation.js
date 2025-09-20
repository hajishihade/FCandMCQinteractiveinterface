import { useCallback } from 'react';

export const useTableValidation = () => {
  // Validate table placement against correct answers
  const validateTablePlacement = useCallback((userGrid, correctTable) => {
    const results = {
      correctPlacements: 0,
      totalCells: 0,
      wrongPlacements: [],
      accuracy: 0,
      correctGrid: [] // For visual feedback
    };

    if (!userGrid || !correctTable) return results;

    // Production validation - no debug logging

    // Initialize correct grid for visual feedback
    results.correctGrid = userGrid.map(() => []);

    // Validate each position in the user's grid - FIXED COORDINATE MAPPING
    userGrid.forEach((row, rowIndex) => {
      results.correctGrid[rowIndex] = [];
      row.forEach((userCell, colIndex) => {
        // Skip header cells
        if (userCell?.isFixed) {
          results.correctGrid[rowIndex][colIndex] = true;
          return;
        }

        // FIXED: Use the cell's original coordinates, not grid indices
        if (userCell && !userCell.isFixed) {
          results.totalCells++;

          // Find what should be at this GRID position [rowIndex, colIndex]
          const correctCellAtPosition = correctTable.cells.find(cell =>
            !cell.isHeader && cell.row === rowIndex && cell.column === colIndex
          );

          const correctText = correctCellAtPosition ? (correctCellAtPosition.text || '') : '';
          const userText = userCell?.text || '';

          const isCorrect = userText === correctText;
          results.correctGrid[rowIndex][colIndex] = isCorrect;

          if (isCorrect) {
            results.correctPlacements++;
          } else {
            // Find where this cell should actually go
            const correctPosition = correctTable.cells.find(cell =>
              !cell.isHeader && (cell.text || '') === userText
            );

            results.wrongPlacements.push({
              cellText: userText || 'EMPTY',
              placedAtRow: rowIndex,
              placedAtColumn: colIndex,
              correctRow: correctPosition?.row ?? rowIndex,
              correctColumn: correctPosition?.column ?? colIndex,
              correctCellText: correctText || 'EMPTY'
            });
          }
        }
      });
    });

    // Calculate accuracy
    results.accuracy = results.totalCells > 0
      ? Math.round((results.correctPlacements / results.totalCells) * 100)
      : 0;

    return results;
  }, []);

  // Create shuffled content cells for the palette
  const createCellPalette = useCallback((tableData) => {
    if (!tableData) return [];

    const contentCells = tableData.cells.filter(cell => !cell.isHeader);

    // Process cells to handle empty cells properly
    const processedCells = contentCells.map(cell => ({
      ...cell,
      displayText: cell.text || 'EMPTY',
      originalText: cell.text,
      cellType: cell.text ? 'content' : 'empty'
    }));

    // Shuffle the cells
    return [...processedCells].sort(() => Math.random() - 0.5);
  }, []);

  // Create initial grid structure with headers placed
  const createInitialGrid = useCallback((tableData) => {
    if (!tableData) return [];

    const { rows, columns, cells } = tableData;

    // Create empty grid
    const grid = Array(rows).fill(null).map(() => Array(columns).fill(null));

    // Place header cells in fixed positions
    cells.filter(cell => cell.isHeader).forEach(header => {
      grid[header.row][header.column] = {
        ...header,
        isFixed: true,
        cellType: 'header'
      };
    });

    return grid;
  }, []);

  // Check if a position is droppable (not a header)
  const isDroppablePosition = useCallback((grid, row, column) => {
    if (!grid[row] || !grid[row][column]) return true;
    return !grid[row][column].isFixed;
  }, []);

  // Get statistics for session summary
  const calculateSessionStats = useCallback((sessionResults) => {
    if (!sessionResults || sessionResults.length === 0) {
      return {
        totalTables: 0,
        totalCells: 0,
        totalCorrectCells: 0,
        overallAccuracy: 0,
        averageTimePerTable: 0,
        perfectTables: 0,
        strongPerformance: [],
        needsImprovement: []
      };
    }

    const totalTables = sessionResults.length;
    const totalCells = sessionResults.reduce((sum, result) => sum + result.totalCells, 0);
    const totalCorrectCells = sessionResults.reduce((sum, result) => sum + result.correctPlacements, 0);
    const overallAccuracy = totalCells > 0 ? Math.round((totalCorrectCells / totalCells) * 100) : 0;
    const totalTime = sessionResults.reduce((sum, result) => sum + result.timeSpent, 0);
    const averageTimePerTable = totalTables > 0 ? totalTime / totalTables : 0;
    const perfectTables = sessionResults.filter(result => result.accuracy === 100).length;

    // Performance insights
    const strongPerformance = [];
    const needsImprovement = [];

    if (perfectTables > totalTables * 0.5) {
      strongPerformance.push(`${perfectTables} perfect tables - excellent spatial memory!`);
    }
    if (overallAccuracy >= 80) {
      strongPerformance.push('High overall accuracy - great pattern recognition');
    }
    if (averageTimePerTable < 60) {
      strongPerformance.push('Fast completion times - efficient processing');
    }

    if (overallAccuracy < 60) {
      needsImprovement.push('Focus on understanding table relationships');
    }
    if (perfectTables === 0) {
      needsImprovement.push('Practice complete table reconstruction');
    }
    if (averageTimePerTable > 120) {
      needsImprovement.push('Work on faster pattern recognition');
    }

    return {
      totalTables,
      totalCells,
      totalCorrectCells,
      overallAccuracy,
      averageTimePerTable,
      perfectTables,
      strongPerformance,
      needsImprovement
    };
  }, []);

  return {
    validateTablePlacement,
    createCellPalette,
    createInitialGrid,
    isDroppablePosition,
    calculateSessionStats
  };
};