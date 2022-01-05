//Player
const Player = (id, name, markerFile, isAi) => {
    return {id, name, markerFile, isAi};
}

//Board
const Board = (size) => {

    let state = [];
    let winningPlayerId = null;
    const UNPLAYED = -1;
    const TIE = -1;

    const possibleWins = [
        ['0-0','0-1','0-2'],
        ['1-0','1-1','1-2'],
        ['2-0','2-1','2-2'],
        ['0-0','1-0','2-0'],
        ['0-1','1-1','2-1'],
        ['0-2','1-2','2-2'],
        ['0-0','1-1','2-2'],
        ['0-2','1-1','2-0'],
    ];

    function findWinner() {
        let winningPlayer = null;
        possibleWins.every(solution => {
            let possibleWinnerIndex = null;
            for(const squareID of solution) {
                const ownerID = state[squareID];
                if(possibleWinnerIndex == null) possibleWinnerIndex = ownerID; //set on first check
                if(possibleWinnerIndex !== ownerID || ownerID === UNPLAYED) {
                    return true; //should continue looking === true
                }
            }
            winningPlayer = possibleWinnerIndex;
            return false; //stop looking
        });
        
        //Check for tie
        if (winningPlayer == null && availableSquares().length === 0) winningPlayer = TIE; 
        return winningPlayer;
    }

    function recordPlay(play, playerId) {
        state[play] = playerId;
        winningPlayerId = findWinner();
        return winningPlayerId;
    }

    function availableSquares() {
        let availableSquares = [];
        for(const squareID in state) {
            if (state[squareID] != -1) availableSquares.push(squareID);
        }
        return availableSquares;
    }

    return {state, recordPlay, TIE, availableSquares};
}

//GameEngine
const Game = (() => {
    let players = [];
    let currentPlayerIndex = null;
    let board = Board();

    function _advancePlayer() {
        let nextIndex = (currentPlayerIndex >= (players.length - 1)) ? 0 : currentPlayerIndex + 1;
        currentPlayerIndex = nextIndex;
        if (currentPlayer().isAi) aiPlay(currentPlayer());
    }

    function play(play) {
        const winnerIndex = board.recordPlay(play, currentPlayerIndex);
        if (winnerIndex == null) _advancePlayer();
        if (winnerIndex >= 0 ) declareWinner(players[winner]);
    }

    function aiPlay(player) {
        const bestPlay = findPlay(player, null, board, 0, false);
        if (!bestPlay) return; //something went wrong
        play(bestPlay.play);
    }

    function findPlay(playerId, opponentId, board, depth, minimizing) {
        const availablePlays = board.availableSquares();
        const bestResult = null;
        availablePlays.forEach(squareId => {
            const newBoard  = {...board}; //copy the board
            const winnerId = newBoard.recordPlay(squareId, playerId);
            const result = {play: squareId, score: 0};
            if(winnerId != Board.TIE && winnerId != null) {
                result.score = (minimizing) ? -100 + depth : 100 - depth;
            } else if(winnerId == null) {
                //continue through tree
                result = findPlay(opponentId, playerId, newBoard , depth + 1, !minimizing);
            }
            bestResult = (!bestResult || bestResult.score < result.score) ? result : bestResult;
        });
    
        return bestResult;
    }

    function currentPlayer() {
        return players[currentPlayerIndex];
    }

    function registerGameSquare(square) {
        board.state[square.id] = -1;
    }

    function beginGame(player) {
        let newPlayers = 
            [Player(0, 'X', 'images/x.png', false),
            Player(1, 'O', 'images/o.png', true)];
        players = newPlayers;
        currentPlayerIndex = 0;
        for(const gameSquare in board.state) {
            board.state[gameSquare] = -1;
        }
        console.log(board.state);
        console.log(players);
    }

    return {
        play,
        currentPlayer,
        registerGameSquare,
        beginGame,
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
    for (let i = 0; i < 3; i++) {
        const gameRow = document.createElement('div');
        gameRow.classList.add('gameRow');

        for (let j = 0; j < 3; j++) {
            const gameSquare = document.createElement('div');
            gameSquare.classList.add('gameSquare');
            gameSquare.id = (`${i}-${j}`);
            gameSquare.addEventListener('click', gameSquareClicked);

            const marker = document.createElement('img');
            marker.classList.add('marker');
            marker.classList.add('hidden');
            marker.src = "images/x.png";

            gameSquare.appendChild(marker);
            gameRow.appendChild(gameSquare);

            Game.registerGameSquare(gameSquare);
        }
        gameBoard.appendChild(gameRow);
    }
}

function declareWinner(winner) {
    if (!winner) return;
    let winningMessage = (winner === Board.tie) ? 'Its a tie' : `Player ${winner.name} Wins!`;
    freezeBoard();
    alert(winningMessage);
}

function freezeBoard() {
    document.querySelectorAll('.gameSquare').forEach(square => {
        square.classList.add('inactive');
    });
}

function gameSquareClicked(e) {
    if(this.classList.contains('inactive')) return;
    console.log('click on ' + this.id);
    const marker = this.querySelector('.marker');
    marker.src = Game.currentPlayer().markerFile;
    marker.classList.remove('hidden');
    this.classList.add('inactive');
    Game.play(null, this.id);
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