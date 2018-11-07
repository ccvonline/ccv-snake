// Constants
const GAME_SPEED = 500;
const CANVAS_BORDER_COLOR = 'black';
const CANVAS_BACKGROUND_COLOR = 'white';
const SNAKE_COLOR = 'lightgreen';
const SNAKE_BORDER_COLOR = 'darkgreen';
const FOOD_COLOR = 'red';
const FOOD_BORDER_COLOR = 'darkred';
const EIGHT_BIT_FONT_NAME = 'Press Start 2P';

// Game State Constants
const STATE_SETUP = 'SETUP';
const STATE_TITLE = 'TITLE';
const STATE_COUNTDOWN = 'COUNTDOWN';
const STATE_PLAY = 'PLAY';
const STATE_WINDDOWN = "WINDDOWN";
const STATE_GAMEOVER = "GAMEOVER";
const STATE_SUBMITSCORE = "SUBMITSCORE";
const STATE_LEADERBOARD = "LEADERBOARD";

// Variables
let safeWindowWidth = 0;
let safeWindowHeight = 0;

let menuCanvas = null;
let hudCanvas = null;
let gameCanvas = null;
let menuCTX = null;
let hudCTX = null;
let gameCTX = null;

let mousePos = { x: 0, y: 0 };
let mouseClickEvt = { clicked: false, x: 0, y: 0 };
let submitHSButton = null;
let playAgainButton = null;
let submitHSClicked = false;
let cancelHSClicked = false;
let leaderboardViewingDoneClicked = false;

let playGameButton = null;
let viewHSButton = null;

// Game timer
let tickTimer = Date.now();

// Game state
let gameState = STATE_SETUP;

// Game Play
let gameVariablesSet = false;
let playerScore = null;
let gameRound = null;
let gameSpeed = null;
let foodConsumed = null;
let snake = null;
let snakeMovementDirection = null;
let snakeChangingDirection = null;
let snakeDirectionX = null;
let snakeDirectionY = null;
let foodX = null;
let foodY = null;
let hudRound = null;
let hudScore = null;
let prevTouchMoveX = null;
let prevTouchMoveY = null;

// Core Methods
// ------------
$( document ).ready(function() {
    setInterval( tick, 33 );
});

function tick() {

    // update our core game timer. Delta Time is the time elapsed since the last tick
    let deltaTime = updateTimer();

    switch( gameState ) {
        case STATE_SETUP: tickSetup(deltaTime); break;
        case STATE_TITLE: {
            // ensure menu canvas is displayed and hud and game canvas are hidden
            displayMenu();
            tickTitle(deltaTime); 
            break;
        } 
        case STATE_COUNTDOWN: tickCountdown(deltaTime); break;
        case STATE_PLAY: { 
            // hide menu canvas and display hud and game canvas
            displayGame();
            tickPlay(deltaTime); 
            break;
        }
        case STATE_WINDDOWN: tickWinddown(deltaTime); break;
        case STATE_GAMEOVER: tickGameover(deltaTime); break;
        case STATE_SUBMITSCORE: tickSubmitScore(deltaTime); break;
        case STATE_LEADERBOARD: tickLeaderboard(deltaTime); break;
    }

    // reset all inputs
    resetInputEvents();
}
// ------------


/* STATE: SETUP */
// ------------
function tickSetup(deltaTime) {

    updateSetup(deltaTime);
    renderSetup(deltaTime);
}

function updateSetup(deltaTime) {

    // setup the bounds and legal position for the game canvases
    let canvasSafeZoneWidth = window.innerWidth * .05;
    let canvasSafeZoneHeight = window.innerHeight * .05;

    safeWindowWidth = window.innerWidth - canvasSafeZoneWidth;
    safeWindowHeight = window.innerHeight - canvasSafeZoneHeight;

    let canvasDiv = document.getElementById('canvasWrapper');
    canvasDiv.style.left = (canvasSafeZoneWidth / 2) + "px";
    canvasDiv.style.top = (canvasSafeZoneHeight / 2) + "px";


    // create/setup menu canvas
    menuCanvas = document.getElementById('menuCanvas');
    menuCanvas.width = safeWindowWidth;
    menuCanvas.height = safeWindowHeight;

    menuCTX = menuCanvas.getContext('2d');
    menuCTX.textAlign = 'center';

    // setup input event handlers that will constantly provide updated input values to menu canvas
    menuCanvas.addEventListener('mousemove', function(evt) {
        mousePos = getMousePos(menuCanvas, evt);
    }, false);

    menuCanvas.addEventListener('click', function(evt) {
        mouseClickEvt.clicked = true;

        let mousePos = getMousePos(menuCanvas, evt);
        mouseClickEvt.x = mousePos.x;
        mouseClickEvt.y = mousePos.y;
    }, false);

    // create/setup hud canvas
    hudCanvas = document.getElementById('hudCanvas');
    hudCanvas.width = safeWindowWidth;
    hudCanvas.height = 30;

    hudCTX = hudCanvas.getContext('2d');

    // create/setup game canvas
    gameCanvas = document.getElementById('gameCanvas');
    gameCanvas.width = safeWindowWidth;
    gameCanvas.height = safeWindowHeight - 30;
    gameCTX = gameCanvas.getContext('2d');

    // event listener for touch gameplay      
    gameCanvas.addEventListener('touchmove', function(event) {
        // only process direction change if game state play and snake is not already changing direction
        if ( gameState === STATE_PLAY && snakeChangingDirection === false) {
            event.preventDefault();

            // get the x/y of current touch event
            const currTouchMoveX = event.changedTouches[0].screenX;
            const currTouchMoveY = event.changedTouches[0].screenY;

            // threshold is used to control responsiveness
            // lower number triggers moves faster (if too low, moves will be triggered unintentionally by gamer
            // higher number triggers moves slower
            const threshold =  25;

            // set prevTouchMove X/Y if not set
            if (!prevTouchMoveX) {
                prevTouchMoveX = currTouchMoveX;
            }
            if (!prevTouchMoveY) {
                prevTouchMoveY = currTouchMoveY;
            }

            // check if currTouchMove is less than or greater than prevTouchMove + or - threshold (this implies movement direction)
            // check is done for both X and Y
            if (currTouchMoveX >= prevTouchMoveX + threshold) {
                // move snake right if snake is not already moving right or left
                if (snakeMovementDirection !== 'left' || snakeMovementDirection !== 'right') {
                    changeDirection('right');
                }
                
                // reset prevTouchMoveX / Y (so we dont trigger movement in another direction sooner than expected)
                prevTouchMoveX = currTouchMoveX;
                prevTouchMoveY = currTouchMoveY;
            } else if (currTouchMoveX <= prevTouchMoveX - threshold) {
                // move snake left if snake is not already moving left or right
                if (snakeMovementDirection !== 'right' || snakeMovementDirection !== 'left') {
                    changeDirection('left');
                }
                
                // reset prevTouchMoveX / Y (so we dont trigger movement in another direction sooner than expected)
                prevTouchMoveX = currTouchMoveX;
                prevTouchMoveY = currTouchMoveY;
            }

            if (currTouchMoveY >= prevTouchMoveY + threshold) {
                // move snake down if snake is not already moving down or up
                if (snakeMovementDirection !== 'up' || snakeMovementDirection !== 'down') {
                    changeDirection('down');
                }
                
                // reset prevTouchMoveX / Y (so we dont trigger movement in another direction sooner than expected)
                prevTouchMoveY = currTouchMoveY;
                prevTouchMoveX = currTouchMoveX;
            } else if (currTouchMoveY <= prevTouchMoveY - threshold) {
                // move snake up if snake is not already moving up or down
                if (snakeMovementDirection !== 'down' || snakeMovementDirection !== 'up') {
                    changeDirection('up');
                }
                
                // reset prevTouchMoveX / Y (so we dont trigger movement in another direction sooner than expected)
                prevTouchMoveY = currTouchMoveY;
                prevTouchMoveX = currTouchMoveX;
            }
        }
    }, false);

    // event listener for keyboard gameplay 
    // TODO: remove after debugging is done?
    document.addEventListener('keydown', function(e) {   
        // Only act on key if in PLAY state
        if ( gameState === STATE_PLAY) {
            switch(e.keyCode) {
                // left key
                case 37: {
                    // ensure snake is not traveling right
                    if (snakeMovementDirection !== 'right') {
                        changeDirection('left');
                    }
                    break;
                }
                // right key
                case 39: {
                    // ensure snake is not traveling left
                    if (snakeMovementDirection !== 'left') {
                        changeDirection('right');
                    }
                    break;
                }
                // up key
                case 38: {
                    // ensure snake is not traveling down
                    if (snakeMovementDirection !== 'down') {
                        changeDirection('up');
                    }
                    break;
                }
                // down key
                case 40: {
                    // ensure snake is not traveling up
                    if (snakeMovementDirection !== 'up') {
                        changeDirection('down');
                    }
                    break;
                }
            }
        }
    });

    // create buttons for start game & view high scores
    playGameButton = new Button( menuCTX, "black", 5, "green", "PLAY GAME", `"${EIGHT_BIT_FONT_NAME}"`, "18px", "red" );
    playGameButton.x = (safeWindowWidth - playGameButton.width) / 2;
    playGameButton.y = 200;

    viewHSButton = new Button( menuCTX, "black", 5, "green", "VIEW HI-SCORES", `"${EIGHT_BIT_FONT_NAME}"`, "18px", "red" );
    viewHSButton.x = (safeWindowWidth - viewHSButton.width) / 2;
    viewHSButton.y = 400;
    
    // and now goto the title screen
    gameState = STATE_TITLE;
}

function renderSetup(deltaTime) {
    clearCanvas( menuCTX, menuCanvas );
}
// ------------
/* END STATE SETUP */


/* STATE: TITLE */
// ------------
function tickTitle(deltaTime) {

    updateTitle(deltaTime);
    renderTitle(deltaTime);
}

function updateTitle(deltaTime) {

    // wait for the play game button to be clicked
    if( playGameButton.wasClicked( mouseClickEvt ) ) {
        gameState = STATE_COUNTDOWN;
    }
    else if ( viewHSButton.wasClicked( mouseClickEvt ) ) {

        // or let them view the leaderboard
        gameState = STATE_LEADERBOARD;

        $("#leaderboard").css("visibility", "visible");
        $("#leaderboard-spinner").css("display", "inline-block");

        $("#canvasWrapper").css("visibility", "hidden");
        
        getScores( parseScores );
    }
}

function renderTitle(deltaTime) {
    clearCanvas( menuCTX, menuCanvas );

    // render title
    render8bitText( "CCV Snake!", 'black', safeWindowWidth / 2 , 50 );

    playGameButton.render( );
    viewHSButton.render( );

    renderDebugInfo( menuCTX );
}
// ------------
/* END STATE TITLE */


/* STATE: COUNTDOWN */
// ------------
let countdownTimer = 3;
let elapsedTimer = 0;

function tickCountdown(deltaTime) {

    updateCountdown(deltaTime);
    renderCountdown(deltaTime);
}

function updateCountdown(deltaTime) {

    // set game starting values if not already set
    if (gameVariablesSet !== true) {
        setDefaultGameVariables();
    }

    // create food if its not created
    if (!foodX || !foodY) {
        createFood();
    }

    // do the 3...2...1 thang
    countdownTimer -= deltaTime;
    if( countdownTimer <= 0 ) {
        gameState = STATE_PLAY;

        // reset the countdown for the next playthru
        countdownTimer += 3.0;
    }
}

function renderCountdown(deltaTime) {

    clearCanvas( menuCTX, menuCanvas );

    // first round the timer UP to the next whole number
    let roundedTimer = Math.ceil( countdownTimer );

    // now clamp to no less than 1, so that we don't show "0" for a tic
    roundedTimer = Math.max( 1, roundedTimer );

    // render countdown
    render8bitText( roundedTimer, 'black', safeWindowWidth / 2, safeWindowHeight / 2 );
    
    renderDebugInfo( menuCTX );
}
// ------------
/* END STATE COUNTDOWN */


/* STATE: PLAY */
// ------------
let playTimer = 0;

function tickPlay(deltaTime) {

    playTimer += deltaTime;

    // use playTimer to control speed of game.  
    //TODO: Better way?
    if ( playTimer >= 33 / gameSpeed) {
        updatePlay(deltaTime);
        renderPlay(deltaTime);
    
        // reset playTimer to 0
        playTimer -= 33 / gameSpeed;
    }
}

function updatePlay(deltaTime) {

    advanceSnake();

    if ( detectCollision() ) {
        gameState = STATE_WINDDOWN;
    }   

    updateHUD();

    // TODO: 
    // CHECK FOR DEATH - same as collision?
}

function renderPlay(deltaTime) {

    clearCanvas( hudCTX, hudCanvas );
    clearCanvas( gameCTX, gameCanvas );
    drawSnake();
    drawFood();
    drawHUD();
    
    //renderDebugInfo( gameCanvas );
}
// ------------
/* END STATE PLAY */


/* STATE: WINDDOWN */
// ------------
let winddownTimer = 0;

function tickWinddown(deltaTime) {

    updateWinddown(deltaTime);
    renderWinddown(deltaTime);
}

function updateWinddown(deltaTime) {

    // example seperation of game logic and rendering.

    // we will update values here in Update(), but render the value in Render().
    
    // first, demonstrate that by adding up deltaTime we can create timers.
    // exampleTimer started at 0 and is climbing by .33 seconds each tick
    winddownTimer += deltaTime;

    // when it gets to or past 5 seconds, change states
    if( winddownTimer >= 5.00 ) {
        gameState = STATE_GAMEOVER;

        submitHSButton = new Button( menuCTX, "black", 5, "green", "SUBMIT SCORE", `"${EIGHT_BIT_FONT_NAME}"`, "18px", "red" );
        submitHSButton.x = (safeWindowWidth - submitHSButton.width) / 2;
        submitHSButton.y = 200;

         playAgainButton = new Button( menuCTX, "black", 5, "green", "PLAY AGAIN", `"${EIGHT_BIT_FONT_NAME}"`, "18px", "red" );
         playAgainButton.x = (safeWindowWidth - playAgainButton.width) / 2;
         playAgainButton.y = 400;

        // reset the timer so that the next time this state is run, the timer is 0 again.
        winddownTimer -= 5.00;
    }
}

function renderWinddown(deltaTime) {

    // wait 2s before rendering winddown (so player sees where they failed at)
    if (winddownTimer >= 2.00) {

        displayMenu();

        clearCanvas( menuCTX, menuCanvas );

        render8bitText( "Dead.", 'black', safeWindowWidth / 2, 50 );
        render8bitText( "Score", 'black', safeWindowWidth / 2, 100 );
        render8bitText( playerScore, 'black', safeWindowWidth / 2, 150 );    
    }
    
    renderDebugInfo( menuCTX );
}
// ------------
/* END STATE WINDDOWN */


/* STATE: GAMEOVER */
// ------------
function tickGameover(deltaTime) {

    updateGameover(deltaTime);
    renderGameover(deltaTime);
}

function updateGameover(deltaTime) {

    // wait for one of the two buttons to be clicked
    if( submitHSButton.wasClicked( mouseClickEvt ) ) {
        
        // goto the submit score screen
        $("#hiscoreSubmit").css("visibility", "visible");
        $("#canvasWrapper").css("visibility", "hidden");
        $("#playerScore").text(playerScore);
        
        gameState = STATE_SUBMITSCORE;
    }
    else if ( playAgainButton.wasClicked( mouseClickEvt ) ) {
        // clear game variables
        clearGameVariables();

        // just go back to the title
        gameState = STATE_TITLE;
    }
}

function renderGameover(deltaTime) {

    clearCanvas( menuCTX, menuCanvas );

    render8bitText( "Game Over", 'black', safeWindowWidth / 2, 50 );
    render8bitText( "Your Score: " + playerScore, 'black', safeWindowWidth / 2, 100 );
    
    submitHSButton.render(menuCTX);
    playAgainButton.render(menuCTX);

    renderDebugInfo( menuCTX );
}
// ------------
/* END STATE GAMEOVER */


/* STATE: SUBMIT SCORE */
// ------------
function tickSubmitScore(deltaTime) {

    updateSubmitScore(deltaTime);
    renderSubmitScore(deltaTime);
}

function updateSubmitScore(deltaTime) {
    
    // wait for the submit or cancel button to be clicked
    if( submitHSClicked ) {
        let firstInitial = $('#initialOne').val();
        let secondInitial = $('#initialTwo').val();
        let thirdInitial = $('#initialThree').val();

        let playerInitials = firstInitial + secondInitial + thirdInitial;

        // if they entered a name
        if ( playerInitials.length > 0 ) {
            
            // grab their campus
            let playerCampus = $("#playerCampus").val( );

            // hide the submit screen
            $("#hiscoreSubmit").css("visibility", "hidden");
            $("#canvasWrapper").css("visibility", "visible");

            // post it with their score
            postScore( playerInitials, playerScore, playerCampus, function() {} );

            // clear game variables
            clearGameVariables();

            // go back to the title screen
            gameState = STATE_TITLE;
        }
    }
    else if ( cancelHSClicked ) {

        $("#hiscoreSubmit").css("visibility", "hidden");
        $("#canvasWrapper").css("visibility", "visible");
        // clear game variables
        clearGameVariables();

        gameState = STATE_TITLE;
    }
}

function renderSubmitScore( deltaTime ) {
    
    renderDebugInfo( menuCTX );
}
// ------------
/* END STATE SUBMIT SCORE */

/* STATE: LEADERBOARD */
// ------------
function tickLeaderboard(deltaTime) {

    updateLeaderboard(deltaTime);
    renderLeaderboard(deltaTime);
}

function updateLeaderboard(deltaTime) {

    // wait for them to finish viewing
    if( leaderboardViewingDoneClicked ) {
        // clear game variables
        clearGameVariables();

        gameState = STATE_TITLE;

        $("#leaderboard").css("visibility", "hidden");
        $("#canvasWrapper").css("visibility", "visible");

        // reset the leaderboard by removing any row with a .score class
        $(".score").remove( );
    }
}

function renderLeaderboard(deltaTime) {
    
    // let the html view do the rendering
}
// ------------
/* END STATE LEADERBOARD */

/*UTILITY*/
// ------------
function clearCanvas( ctx, canvas ) {

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 0;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function renderDebugInfo( ctx ) {

    ctx.fillStyle = 'black';
    ctx.fillRect( 0, gameCanvas.height - 50, gameCanvas.width, 50 );

    // backup curr values
    let currFillStyle = ctx.fillStyle;
    let currFont = ctx.font;
    let currAllign = ctx.textAlign;

    ctx.fillStyle = 'white';
    ctx.font = "12px Arial";
    ctx.textAlign = 'left';

    ctx.fillText( "Debug Info -", 0, gameCanvas.height - 40 );
    ctx.fillText( "State: " + gameState, 80, gameCanvas.height - 40 );

    // restore previous values
    ctx.fillStyle = currFillStyle;
    ctx.font = currFont;
    ctx.textAlign = currAllign;
}

function getMousePos(menuCanvas, evt) {
    let rect = menuCanvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}

function updateTimer() {
    // this will return the amount of time, in seconds, since the last time this function was called.
    // since we call this once per tick, it's how long our game took to tick.

    // take the time since the last tick
    let deltaTime = Date.now() - tickTimer;

    // stamp the time so we know how long this next tick is going to take
    tickTimer = Date.now();

    // convert to seconds
    return deltaTime / 1000;
}

function resetInputEvents() {
    mouseClickEvt.clicked = false;
    submitHSClicked = false;
    cancelHSClicked = false;
    leaderboardViewingDoneClicked = false;
}

function render8bitText( renderText, color, posX, posY ) {

    // backup curr values
    let currFillStyle = menuCTX.fillStyle;
    let currFont = menuCTX.font;

    menuCTX.fillStyle = color;
    menuCTX.font = `20px "${EIGHT_BIT_FONT_NAME}"`;
    menuCTX.fillText( renderText, posX, posY );

    // restore previous values
    menuCTX.fillStyle = currFillStyle;
    menuCTX.font = currFont;
}

function displayMenu() {

    // display menu
    $('#menuCanvas').css('display','block');
    // hide hud and game canvas
    $('#hudCanvas').css('display','none');
    $('#gameCanvas').css('display','none');
}

function displayGame() {

    // hide menu canvas
    $('#menuCanvas').css('display','none');
    // display hud and game canvas
    $('#hudCanvas').css('display','block');
    $('#gameCanvas').css('display','block');
}

function onSubmitHiscore() {
    submitHSClicked = true;
}

function onCancelHiscore() {
    cancelHSClicked = true;
}

function onLeaderboardViewingDone() {
    leaderboardViewingDoneClicked = true;
}
// ------------
/*END UTILITY*/

/*GAME UTILITY*/
// TODO: Should these just be in utility?
// ------------

// Set default values of game variables
function setDefaultGameVariables() {
    playerScore = 0;
    gameRound = 1;
    gameSpeed = GAME_SPEED
    foodConsumed = 0;
    snake = [
        {x: 150, y: 150},
        {x: 140, y: 150},
        {x: 130, y: 150},
        {x: 120, y: 150},
        {x: 110, y: 150},
    ];
    snakeMovementDirection = 'right';
    snakeChangingDirection = false;
    snakeDirectionX = 10;
    snakeDirectionY = 0;
    foodX = null;
    foodY = null;
    hudRound = null;
    hudScore = null;
    prevTouchMoveX = null;
    prevTouchMoveY = null;

    gameVariablesSet = true;
}

// clear game variables
function clearGameVariables() {
    // Game Play
    gameVariablesSet = false;
    playerScore = null;
    gameRound = null;
    gameSpeed = null;
    foodConsumed = null;
    snake = null;
    snakeMovementDirection = null;
    snakeChangingDirection = null;
    snakeDirectionX = null;
    snakeDirectionY = null;
    foodX = null;
    foodY = null;
    hudRound = null;
    hudScore = null;
    prevTouchMoveX = null;
    prevTouchMoveY = null;
}

// Update HUD data
function updateHUD() {

    hudRound = gameRound;
    hudScore = playerScore;
}

// Create Food
function createFood() {

    // Generate food (inside playing field)
    foodX = randomTen(0, gameCanvas.width);
    foodY = randomTen(0, gameCanvas.height);

    // Check if food was created where the snake is, if so try the creation
    snake.forEach(function isFoodOnSnake(part) {
        const foodIsOnSnake = part.x == foodX && part.y == foodY;

        // recreate the food if it was created on the snake
        if (foodIsOnSnake) {
            createFood();
        }
    });
}

function drawHUD() {

    // draw hud text
    hudCTX.fillStyle = "black";
    hudCTX.font = `14px "${EIGHT_BIT_FONT_NAME}"`;
    hudCTX.textAlign = "left";
    hudCTX.fillText( "Round: " + hudRound, 10, 20);
    hudCTX.textAlign = "right";
    hudCTX.fillText( "Score: " + hudScore, safeWindowWidth - 10, 20);
}

// Draw snake
function drawSnake() {

    snake.forEach(drawSnakePart);
}

// Draw snake part
function drawSnakePart(snakePart) {

    gameCTX.fillStyle = SNAKE_COLOR;
    gameCTX.strokeStyle = SNAKE_BORDER_COLOR;

    gameCTX.fillRect(snakePart.x, snakePart.y, 10, 10);
    gameCTX.strokeRect(snakePart.x, snakePart.y, 10, 10);
}

// Draw food
function drawFood() {

    gameCTX.fillStyle = FOOD_COLOR;
    gameCTX.strokeStyle = FOOD_BORDER_COLOR;
    gameCTX.fillRect(foodX, foodY, 10, 10);
    gameCTX.strokeRect(foodX, foodY, 10, 10);
}

// Advance the snake forward
function advanceSnake() {

    // set new location of snake head
    const head = {x: snake[0].x + snakeDirectionX, y: snake[0].y + snakeDirectionY};

    // Direction change complete, allow input for next change
    snakeChangingDirection = false;

    // add new head location to snake
    snake.unshift(head);

    if (checkFoodEaten()) {
        // ate food, increase score, create new food, and do NOT remove last part of snake
        playerScore += 10;

        createFood();
    } else {
        // did not eat food, remove last part of snake to keep it the same length
        snake.pop();
    }
}

// check if the snake head is on food
function checkFoodEaten() {

    if ( snake[0].x === foodX && snake[0].y === foodY ) {
        // food consumed, increase count
        foodConsumed++;

        // increase round if 5 food consumed
        if (foodConsumed === 5) {
            // increase gameRound
            gameRound++;
            // increase gameSpeed
            gameSpeed += 100;

            // reset foodConsumed
            foodConsumed = 0;
        }
        return true;
    }

    // food not consumed
    return false;
}

// Detect collision
function detectCollision() {

    // Check if snake has run into itself
    for (let i = 4; i < snake.length; i++) {
        if ( snake[i].x === snake[0].x && snake[i].y === snake[0].y ) {
            return true;
        }
    }

    // Check if snake has hit a wall
    const hitLeftWall = snake[0].x < 0;
    const hitRightWall = snake[0].x + 10 > gameCanvas.width;
    const hitTopWall = snake[0].y < 0;
    const hitBottomWall = snake[0].y + 10 > gameCanvas.height;

    return hitLeftWall || hitRightWall || hitTopWall || hitBottomWall
}

// Change direction of snake movement
function changeDirection(direction) {

    // check if we have already changed direction this game tick
    if (!snakeChangingDirection) {
        // Set so that we dont change direction twice during update 
        snakeChangingDirection = true;

        // Perform direction change
        switch(direction) {
            case 'left': {
                snakeMovementDirection = 'left';
                snakeDirectionX = -10;
                snakeDirectionY = 0;
                break;
            }
            case 'right': {
                snakeMovementDirection = 'right';
                snakeDirectionX = 10;
                snakeDirectionY = 0;
                break;
            }
            case 'up': {
                snakeMovementDirection = 'up';
                snakeDirectionX = 0;
                snakeDirectionY = -10; 
                break;
            }
            case 'down': {
                snakeMovementDirection = 'down';
                snakeDirectionX = 0;
                snakeDirectionY = 10;
                break;
            }
            default: {
                break;
            }
        }
    }
}

// Generate a random number
function randomTen(min, max) {

    return Math.round((Math.random() * (max-min) + min) /10) * 10;
}
// ------------
/*END GAME UTILITY*/