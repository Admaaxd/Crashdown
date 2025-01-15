
// Game settings and state variables
const rows = 10, cols = 10, colors = ["red", "blue", "green", "yellow"];
let score = 0, removalCount = 0, gameTime = 0, gameTimer, isGameOver = false, blockRemoveCounter = 0;
const bgMusic = document.getElementById('bg-music');
    
// Initialize the game grid with random colors and special blocks
function createGrid() {
    $('#grid').empty();
    for (let i = 0; i < rows * cols; i++) {
        let chance = Math.random();
        let color;
        if (chance < 0.005) {
            color = 'rainbow';
        } else if (chance < 0.015) {
            color = 'bomb';
        } else {
            color = colors[Math.floor(Math.random() * colors.length)];
        }
        $('#grid').append(`<div class="${color}"></div>`);
    }
    updateCounterDisplay();
}

// Collapses columns, moving blocks downward to fill empty spaces
function collapseColumns() {
    for (let col = 0; col < cols; col++) {
        let column = [];
        for (let row = 0; row < rows; row++) {
            let cell = $('#grid div').eq(col + row * cols);
            if (cell.length) {
                column.push(cell);
            }
        }
        for (let row = 0; row < rows; row++) {
            let cellIndex = col + row * cols;
            if (row < column.length) {
                let cellToMove = column[column.length - 1 - row];
                let oldCell = $('#grid div').eq(cellIndex);
                if (!oldCell.is(cellToMove)) {
                    oldCell.before(cellToMove);
                    cellToMove.css('top', '40px').animate({top: '0px'}, 80);
                }
            } else {
                $('#grid div').eq(cellIndex).remove();
            }
        }
    }
    fillEmptySpaces();
    checkGameOver();
}

// Adds new blocks if there are empty spaces after removing blocks
function fillEmptySpaces() {
    let emptySpaces = rows * cols - $('#grid div').length;
    if (emptySpaces > 0 && removalCount % 5 === 0) {
        let newBlocksToAdd = Math.min(emptySpaces, 20);
        for (let i = 0; i < newBlocksToAdd; i++) {
            let chance = Math.random();
            let color;
            if (chance < 0.02) {
                color = 'bomb';
            } else if (chance < 0.03) {
                color = 'rainbow';
            } else {
                color = colors[Math.floor(Math.random() * colors.length)];
            }
            $('#grid').append(`<div class="${color}"></div>`);
        }
    }
}

// Updates the score display
function updateScore(points) {
    score += points;
    $('#score').text(score);
}

// Resets the game to its initial state
function resetGame() {
    clearInterval(gameTimer);
    gameTime = 0;
    score = 0; 
    isGameOver = false;
    updateTimerDisplay();
    blockRemoveCounter = 0;
    removalCount = 0;
    updateScore(0);
    createGrid();
    $('#reset-button').removeClass('blink');
    startTimer();
}

// Starts the game timer
function startTimer() {
    gameTimer = setInterval(function() {
        gameTime++;
        updateTimerDisplay();
    }, 1000);
 }

// Updates the timer display
function updateTimerDisplay() {
    let minutes = Math.floor(gameTime / 60);
    let seconds = gameTime % 60;
    $('#timer').text(`${padTime(minutes)}:${padTime(seconds)}`);
}

// Pads time values to ensure two digits
function padTime(num) {
    return num.toString().padStart(2, '0');
}

// Triggered when a bomb block is activated, removes nearby blocks
function explodeBomb($bombBlock) {
    let index = $('#grid div').index($bombBlock);
    let col = index % cols;
    let row = Math.floor(index / cols);
    
    let minRow = Math.max(0, row - 2);
    let maxRow = Math.min(rows - 1, row + 2);
    let minCol = Math.max(0, col - 2);
    let maxCol = Math.min(cols - 1, col + 2);
    
    let blocksToRemove = [];
    for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
            blocksToRemove.push($('#grid div').eq(r * cols + c)[0]);
        }
    }
    removeBlocks($(blocksToRemove));
}

// Triggered when a rainbow block is activated, removes all blocks in its row and column
function clearCross($rainbowBlock) {
    let index = $('#grid div').index($rainbowBlock);
    let col = index % cols;
    let row = Math.floor(index / cols);
    
    let blocksToRemove = [];
    for (let c = 0; c < cols; c++) {
        blocksToRemove.push($('#grid div').eq(row * cols + c)[0]);
    }
    for (let r = 0; r < rows; r++) {
        if (r !== row) {
            blocksToRemove.push($('#grid div').eq(r * cols + col)[0]);
        }
    }
    removeBlocks($(blocksToRemove));

    if(checkGameOver()){
        return;
    }
}

function checkForFifthRemoval() {
    if (blockRemoveCounter >= 5) {
        blockRemoveCounter = 0;
    }
    updateCounterDisplay();
}

// Updates the display for the block removal counter
function updateCounterDisplay() {
    $('#counter').text(5 - blockRemoveCounter);
}

// Finds blocks adjacent to a given block
function findAdjacent($block, color, list) {
    let index = $('#grid div').index($block);
    let neighbors = [
        index - 1, index + 1,
        index - cols, index + cols
      ].filter(i => i >= 0 && i < rows * cols);

    neighbors.forEach(function(i) {
        let $neighbor = $('#grid div').eq(i);
        if ($neighbor.hasClass(color) && !list.includes($neighbor[0]) && Math.abs(index % cols - i % cols) <= 1) {
            list.push($neighbor[0]);
            findAdjacent($neighbor, color, list);
        }
    });

    return list;
}

// Checks if the game is over
function checkGameOver() {
    if ($('#grid div').length === 0 && !isGameOver) {
        isGameOver = true;
        clearInterval(gameTimer);
        $('#reset-button').addClass('blink');
        alert(`Congratulations! You won! Time: ${$('#timer').text()}, Score: ${score}`);
        return true;
    }
    
    if (!checkPossibleMoves() && !isGameOver) {
        if ($('#grid div').length > 1) {
            addRandomBlocks(3);
            shuffleGrid();
        } else {
            addRandomBlocks(5);
            shuffleGrid();
        }
    }
    return false;
}

// Shuffles the grid when no moves are available
function shuffleGrid() {
    let elements = $('#grid div').get();
    do {
        elements.sort(() => 0.5 - Math.random());
        $('#grid').empty().append(elements);
    } while (!checkPossibleMoves());
}

// Checks for possible moves within the grid
function checkPossibleMoves() {
    for (let i = 0; i < $('#grid div').length; i++) {
        let $block = $('#grid div').eq(i);
        let color = $block.attr('class');
        let blocks = findAdjacent($block, color, [$block[0]]);
        if (blocks.length > 1) {
            return true;
        }
    }
    return false;
}

// Adds random blocks to the grid
function addRandomBlocks(count) {
    for (let i = 0; i < count; i++) {
        let newColor = colors[Math.floor(Math.random() * colors.length)];
        $('#grid').append(`<div class="${newColor}"></div>`);
    }
}

// Plays a popping sound effect when blocks are removed
function playPopSound() {
    var popSound = document.getElementById('pop-sound');
    popSound.volume = 0.2;
    popSound.play();
}

// Removes blocks and updates the game state
function removeBlocks($blocks) {
    $blocks.each(function() {
        $(this).remove();
    });
    updateScore($blocks.length);
    removalCount++;
    blockRemoveCounter++;
    playPopSound();
    collapseColumns();
    checkGameOver();
    checkForFifthRemoval();
}

// Event handler for clicking on blocks
$('#grid').on('click', 'div', function() {
    let color = $(this).attr('class');
    if (color === 'rainbow') {
        clearCross($(this));
    } else if (color === 'bomb') {
        explodeBomb($(this));
    } else {
        let blocksToRemove = findAdjacent($(this), color, [this]);
        if (blocksToRemove.length > 1) {
            removeBlocks($(blocksToRemove));
        }
    }
});

// Event handler for the reset button
$('#reset-button').click(function() {
    resetGame();
});

$(document).ready(function () {
    $('#audio-control').click(function () {
        const bgMusic = document.getElementById('bg-music');
        bgMusic.volume = 0.2;
        if (bgMusic.paused) {
            bgMusic.play();
            $(this).text('⏸');
        } else {
            bgMusic.pause();
            $(this).text('▶️');
        }
    });
    
    $('#reset-button').click(function () {
        resetGame();
    });
    
    createGrid();
    startTimer();
});

module.exports = {
    createGrid,
    collapseColumns,
    fillEmptySpaces,
    updateScore,
    resetGame,
    startTimer,
    padTime,
    explodeBomb,
    clearCross,
    findAdjacent,
    checkGameOver,
    addRandomBlocks,
    rows,
    cols,
    colors,
};