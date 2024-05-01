function* uniqueNumberGenerator(): Generator<number, void, undefined> {
    // Initialize an array with numbers 1 to 9
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    // Shuffle the array using the Fisher-Yates algorithm
    for (let i = numbers.length - 1; i > 0; i--) {
        // Pick a random index from 0 to i
        const j = Math.floor(Math.random() * (i + 1));
        // Swap elements at indices i and j
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    // Yield each number one by one
    for (const number of numbers) {
        yield number;
    }
}

function isValid(board: number[][], row: number, col: number, num: number): boolean {
    for (let i = 0; i < 9; i++) {
        // Check row, column, and 3x3 block
        const blockRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
        const blockCol = 3 * Math.floor(col / 3) + i % 3;
        if (board[row][i] === num || board[i][col] === num || board[blockRow][blockCol] === num) {
            return false;
        }
    }
    return true;
}

function solveSudoku(board: number[][], row = 0, col = 0): boolean {
    if (row === 9) return true; // If reached the end of rows, puzzle is solved
    if (col === 9) return solveSudoku(board, row + 1, 0); // Move to next row
    if (board[row][col] !== 0) return solveSudoku(board, row, col + 1); // Skip filled cells

    for (const num of uniqueNumberGenerator()) {
        if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board, row, col + 1)) return true;
            board[row][col] = 0; // Reset on backtrack
        }
    }

    return false; // Trigger backtracking
}

export function createBoard(percentSolved: number): number[] {
    const board = Array.from({ length: 9 }, () => Array(9).fill(0));
    solveSudoku(board);
    return board.flat().map(v => {
            if (Math.random() < percentSolved) {
                return v
            }
            return 0
        })
}