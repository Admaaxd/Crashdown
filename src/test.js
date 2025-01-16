const { JSDOM } = require('jsdom');
const jQuery = require('jquery');

const { window } = new JSDOM('<!DOCTYPE html><html><body><div id="grid"></div><div id="score"></div><div id="counter"></div></body></html>');
global.window = window;
global.document = window.document;
global.$ = jQuery(window);

const {
    createGrid,
    collapseColumns,
    fillEmptySpaces,
    updateScore,
    padTime,
    explodeBomb,
    clearCross,
    findAdjacent,
    checkGameOver,
    addRandomBlocks,
    rows,
    cols,
} = require('./script');

// Mock the DOM
beforeEach(() => {
    document.body.innerHTML = `
        <div id="grid"></div>
        <div id="score"></div>
        <div id="counter"></div>
        <audio id="pop-sound"></audio>
    `;
    global.alert = jest.fn(); // Mock alert

    global.HTMLMediaElement = class {
        play = jest.fn();
        pause = jest.fn();
    };

    // Mock the specific audio element methods
    const mockAudioElement = {
        play: jest.fn(),
        pause: jest.fn(),
        volume: 0,
    };

    document.getElementById = jest.fn().mockImplementation((id) => {
        if (id === 'pop-sound') return mockAudioElement;
        return document.querySelector(`#${id}`);
    });
});

// Test for createGrid
test('createGrid generates a grid of correct size', () => {
    createGrid();
    const gridBlocks = document.querySelectorAll('#grid div');
    expect(gridBlocks.length).toBe(rows * cols);
});

// Test for padTime
test('padTime returns correctly padded numbers', () => {
    expect(padTime(5)).toBe('05');
    expect(padTime(15)).toBe('15');
});

// Test for updateScore
test('updateScore updates the score correctly', () => {
    document.getElementById('score').textContent = '0';
    updateScore(10);
    const scoreDisplay = document.getElementById('score').textContent;
    expect(scoreDisplay).toBe('10');
});

// Test for addRandomBlocks
test('addRandomBlocks adds the correct number of blocks', () => {
    createGrid();
    const initialCount = document.querySelectorAll('#grid div').length;
    addRandomBlocks(5);
    const newCount = document.querySelectorAll('#grid div').length;
    expect(newCount - initialCount).toBe(5);
});

// Test for findAdjacent
test('findAdjacent finds blocks of the same color', () => {
    document.getElementById('grid').innerHTML = `
        <div class="red"></div><div class="red"></div>
        <div class="red"></div><div class="red"></div>
        <div class="blue"></div><div class="blue"></div>
        <div class="blue"></div><div class="blue"></div>
        <div class="blue"></div>
    `;
    const $block = $('#grid div').eq(0);
    const adjacentBlocks = findAdjacent($block, 'red', [$block[0]]);
    expect(adjacentBlocks.length).toBe(4);
});

// Test for checkGameOver
test('checkGameOver detects game over when no blocks remain', () => {
    document.getElementById('grid').innerHTML = '';
    const isGameOver = checkGameOver();
    expect(isGameOver).toBe(true);
    expect(alert).toHaveBeenCalledWith(expect.stringContaining('Congratulations!'));
});

// Test for clearCross
test('clearCross removes all blocks in the same row and column', () => {
    document.getElementById('grid').innerHTML = `
        <div class="red"></div><div class="blue"></div><div class="green"></div>
        <div class="yellow"></div><div class="rainbow"></div><div class="blue"></div>
        <div class="red"></div><div class="green"></div><div class="yellow"></div>
    `;
    const $rainbowBlock = $('#grid div').eq(4);
    clearCross($rainbowBlock);
    const remainingBlocks = document.querySelectorAll('#grid div');
    expect(remainingBlocks.length).toBe(0);
});

// Test for explodeBomb
test('explodeBomb removes surrounding blocks', () => {
    document.getElementById('grid').innerHTML = `
        <div class="red"></div><div class="blue"></div><div class="green"></div>
        <div class="yellow"></div><div class="bomb"></div><div class="blue"></div>
        <div class="red"></div><div class="green"></div><div class="yellow"></div>
    `;
    const $bombBlock = $('#grid div').eq(4);
    explodeBomb($bombBlock);
    const remainingBlocks = document.querySelectorAll('#grid div:not(.bomb)');
    expect(remainingBlocks.length).toBe(0);
});

// Test for fillEmptySpaces
test('fillEmptySpaces fills empty spaces with new blocks', () => {
    removalCount = 5; // Ensure condition is met
    document.getElementById('grid').innerHTML = '<div></div>'.repeat(rows * cols - 5);
    fillEmptySpaces();
    const gridBlocks = document.querySelectorAll('#grid div');
    expect(gridBlocks.length).toBe(rows * cols);
});

// Test for collapseColumns
test('collapseColumns shifts blocks downward to fill gaps', () => {
    document.getElementById('grid').innerHTML = `
        <div class="red"></div><div></div><div class="blue"></div>
        <div></div><div class="green"></div><div></div>
        <div class="yellow"></div><div></div><div></div>
    `;
    collapseColumns();
    const lastRow = Array.from(document.querySelectorAll('#grid div')).slice(6);
    expect(lastRow.every(block => block.className !== '')).toBe(true);
});