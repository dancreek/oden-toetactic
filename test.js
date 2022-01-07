//GameBoard
const Board = () => {
    //gameState keeps track of the possible positions on the game board and who owns them
    let gameState = {
        boardSquare01: "", 
        boardSquare02: "", 
        boardSquare03: ""
    };

    //calculates the score for the current state of the game.
    function scoreForCurrentState() {
        console.log('GameState as reported from Board: ', this.gameState);
        return 1000; //just for testing
    }

    return {gameState, scoreForCurrentState};
}

//GameEngine
const Game = (() => {

    let board = null;

    function beginGame(player) {
        board = Board();
        let bestMove = findBestMove();
    }

    //Test each possible move and score it.  Then return the best option.
    function findBestMove() {

        let bestScore = 0;
        let bestMove = null;
        
        //search for unclaimed squares
        const availableMoves = Object.keys(board.gameState)
            .filter(gameSquare => board.gameState[gameSquare] === "");

        //iterate through and simulate all available moves
        availableMoves.forEach(move => {
            //copy the current game board to get one we can test a play on
            let newBoard = Board(); //create a new blank board
            newBoard.gameState = {...board.gameState}; //copy the current gameState to the new board
            newBoard.gameState[move] = "player1"; //record the theoretical play

            console.log('GameState as reported from Game: ', newBoard.gameState); //GameState as reported from Game:  {boardSquare01: 'player1', boardSquare02: '', boardSquare03: ''}

            const newScore = newBoard.scoreForCurrentState(); //GameState as reported from Board:  {boardSquare01: '', boardSquare02: '', boardSquare03: ''}

            if (bestScore < newScore) {
                bestScore = newScore;
                bestMove = move;
            }
        });
        
        return bestMove;
    }

    return {
        beginGame,
    }

})();

Game.beginGame();