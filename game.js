//Player
const Player = (id, name, markerFile, isAi) => {
    return {id, name, markerFile, isAi};
}

//Board
const Board = (boardState) => {
    const UNPLAYED = '';
    const TIE = -1;
    let state = boardState || newState(3);
    let winningPlayerId = null;

    const possibleWins = [
        ['GS0-0','GS0-1','GS0-2'],
        ['GS1-0','GS1-1','GS1-2'],
        ['GS2-0','GS2-1','GS2-2'],
        ['GS0-0','GS1-0','GS2-0'],
        ['GS0-1','GS1-1','GS2-1'],
        ['GS0-2','GS1-2','GS2-2'],
        ['GS0-0','GS1-1','GS2-2'],
        ['GS0-2','GS1-1','GS2-0'],
    ];

    function newState(size) {
        let newState = {};
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                newState[('GS' + x + '-' + y)] = UNPLAYED; //The 'GS' is necessary because CSS id's cant start with numbers
            }
        }
        return newState;
    }

    function findWinner() {
        possibleWins.every(solution => {
            let possibleWinnerId = null;
            for(const squareID of solution) {
                const ownerID = state[squareID];
                if(possibleWinnerId == null) possibleWinnerId = ownerID; //set on first check
                if(possibleWinnerId !== ownerID || ownerID === UNPLAYED) {
                    return true; //should continue looking === true
                }
            }
            winningPlayerId = possibleWinnerId;
            return false; //stop looking
        });
        
        //Check for tie
        if (winningPlayerId == null && availableSquares().length === 0) winningPlayerId = TIE; 
        return winningPlayerId;
    }

    function recordPlay(play, playerId) {
        this.state[play] = playerId;
        return findWinner();
    }

    function availableSquares() {
        const availableSquares = Object.keys(state)
            .filter(gameSquare => state[gameSquare] === UNPLAYED);
        return availableSquares;
    }

    return {state, TIE, winningPlayerId, recordPlay, availableSquares};
}

//GameEngine
const Game = (() => {
    let players = [];
    let currentPlayerIndex = null;
    let board = null;

    const GAME_SIZE = 3;

    function _advancePlayer() {
        let nextIndex = (currentPlayerIndex >= (players.length - 1)) ? 0 : currentPlayerIndex + 1;
        currentPlayerIndex = nextIndex;
        if (currentPlayer().isAi) aiPlay(currentPlayer());
    }

    function play(squareId) {
        showPlay(squareId, currentPlayer());
        const winnerId = board.recordPlay(squareId, currentPlayer().id);
        if (winnerId) declareWinner(playerWithId(winnerId));
        else _advancePlayer();
    }

    function aiPlay(player) {
        const bestPlay = findPlay(player.id, 'X', board, 0, false);
        if (!bestPlay) return; //something went wrong
        play(bestPlay.play);
    }

    function findPlay(playerId, opponentId, board, depth, minimizing) {
        let bestResult = (minimizing) ? {play: '', score: 1000} : {play: '', score: -1000}; //start with the lowest possible score
        board.availableSquares().forEach(squareId => {
            const newBoard = Board({...board.state});
            const winnerId = newBoard.recordPlay(squareId, playerId);

            let result = {play: squareId, score: -100};
            if(winnerId == null) {
                //no winner, continue through tree
                result = findPlay(opponentId, playerId, newBoard, depth + 1, !minimizing);
            } else if(winnerId === newBoard.TIE) {
                result.score = 0;
            } else {
                result.score = (minimizing) ? -100 + depth : 100 - depth;
            }
            bestResult.play = squareId;
            bestResult.score = (minimizing) ? Math.min(bestResult.score, result.score) : Math.max(bestResult.score, result.score);
        });

        
        return bestResult;
    }

    function  minimax(board, depth, maximizingPlayer) {
        if (depth === 0 || board.winningPlayerId) //or node is a terminal node 
            //then score the play
            return; //the heuristic value of node
        if (maximizingPlayer) {
            let score = -1000; 
            const availablePlays = board.availableSquares();
            availablePlays.forEach(squareId => {
                const newBoard = Board({...board.state});
                newBoard.recordPlay(squareId, 'O');
                score = Math.max(score, minimax(newBoard, depth - 1, false));
            });
            return score;
        }
        let score = 1000; 
        const availablePlays = board.availableSquares();
        availablePlays.forEach(squareId => {
            const newBoard = Board({...board.state});
            newBoard.recordPlay(squareId, 'X');
            score = Math.min(score, minimax(newBoard, depth - 1, true));
        });
        return score;
    }

    function currentPlayer() {
        return players[currentPlayerIndex];
    }

    function playerWithId(id) {
        return players.find(player => player.id === id);
    }

    function beginGame(player) {
        let newPlayers = 
            [Player('X', 'X', 'images/x.png', false),
            Player('O', 'O', 'images/o.png', true)];
        players = newPlayers;
        currentPlayerIndex = 0;
        board = Board();
    }

    return {
        play,
        currentPlayer,
        beginGame,
        GAME_SIZE,
    }

})();

//DOM Elements
const header = document.querySelector('#header');
const gameBoard = document.querySelector('#gameBoard');
const scoreboard = document.querySelector('#scoreboard');
const footer = document.querySelector('#footer');
const resetButton = document.querySelector('#resetButton');

configureInterface()

function configureInterface() {
    buildBoard();
    resetButton.addEventListener('click', resetButtonClicked);
    Game.beginGame();
}

function buildBoard() {
    for (let i = 0; i < Game.GAME_SIZE; i++) {
        const gameRow = document.createElement('div');
        gameRow.classList.add('gameRow');

        for (let j = 0; j < Game.GAME_SIZE; j++) {
            const gameSquare = document.createElement('div');
            gameSquare.classList.add('gameSquare');
            gameSquare.id = (`GS${i}-${j}`);
            gameSquare.addEventListener('click', gameSquareClicked);

            const marker = document.createElement('img');
            marker.classList.add('marker');
            marker.classList.add('hidden');
            marker.src = "images/x.png";

            gameSquare.appendChild(marker);
            gameRow.appendChild(gameSquare);
        }
        gameBoard.appendChild(gameRow);
    }
}

function declareWinner(winner) {
    let winningMessage = (!winner) ? 'Its a tie' : `Player ${winner.name} Wins!`;
    freezeBoard();
    alert(winningMessage);
}

function freezeBoard() {
    document.querySelectorAll('.gameSquare').forEach(square => {
        square.classList.add('inactive');
    });
}

function showPlay(squareID, player) {
    const gameSquare = document.querySelector('#' + squareID);
    const marker = gameSquare.querySelector('.marker');
    marker.src = player.markerFile;
    marker.classList.remove('hidden');
    gameSquare.classList.add('inactive');
}

function gameSquareClicked(e) {
    if(this.classList.contains('inactive')) return;
    console.log('click on ' + this.id);
    Game.play(this.id);
}

function resetButtonClicked(e) {
    console.log('Reset');
    window.document.querySelectorAll('.gameSquare .marker')
        .forEach(image => {
            image.classList.add('hidden');
        });
        window.document.querySelectorAll('.gameSquare')
        .forEach(square => {
            square.classList.remove('inactive');
        });
    Game.beginGame();
}




// Create game board with squares each able to show an image and event listener for click.
// every square needs a connection to data

// function buildBoard {
//     for 3 rows {
//         for 3 columns {
//             create a square 
//             give it a class
//             give it an id
//             add an eventListener
//             add an image with class
//             append to gameBoard
//         }
//     }
// }

// player selects a square - triggering click
//     check availability
//     set square image
//     mark as unavailabe
//     mark owner
// game is evaluated for a win
// if a win, show winner, show reset button & disable further interaction
// if not a win game switches to other player

// evaluating strength of a play
// number of available paths you get
// an available path has all open squares or your squares
// each step on a path increases the desirability of that path
// you must stop any move that gives your opponent a win.
// you must prioritize a play that blocks your opponents play giving 2 paths to a 1 play win.

// 8 possible paths

// Player Object


//Game AI
/*
object to keep board state

find all available squares
copy the board and play a square and evaluate for a win
return the value of that win

//Should return a single play and score
function findPlay(player, opponent, board, depth, minimizing) {
    const availableMoves = search board.state for unplayed squares
    const bestResult = empty object;
    availablePlays.forEach(play => {
        const newBoard = copy of board.state
        newBoard[play] = player
        search for a win
        const result {}
        if (win) {
            score = player that won - depth
            result = {play, score}
        } else {
            //run again
            result = findPlay(opponent, player, newBoard, depth + 1, !minimizing)
        }
        compare result to bestResult and keep if better
    })

    return bestResult;
}

*/