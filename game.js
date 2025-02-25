// Constants
const SNAKE_UPDATE_FREQUENCY_SEC = .33;
const FOOD_COLOR = 'red';
const FOOD_BORDER_COLOR = 'darkred';
const EIGHT_BIT_FONT_NAME = 'Press Start 2P';
const TOUCH_THRESHOLD = 45;

const GAMEPLAY_GRID_SIZE = 20;

let GAME_SCREEN_WIDTH = 360;
let GAME_SCREEN_HEIGHT = 520;

let HUD_WIDTH = GAME_SCREEN_WIDTH;
let HUD_HEIGHT = 40;

let GAMEBOARD_WIDTH = GAME_SCREEN_WIDTH;
let GAMEBOARD_HEIGHT = GAME_SCREEN_HEIGHT - HUD_HEIGHT;

const MAX_NUM_LEADERBOARD_SCORES = 1000;

// Game State Constants
const STATE_SETUP = 'SETUP';
const STATE_TITLE = 'TITLE';
const STATE_TUTORIAL = 'TUTORIAL';
const STATE_PLAY = 'PLAY';
const STATE_WINDDOWN = "WINDDOWN";
const STATE_GAMEOVER = "GAMEOVER";
const STATE_SUBMITSCORE = "SUBMITSCORE";
const STATE_LEADERBOARD = "LEADERBOARD";

// Variables
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

let tutorialDoneButton = null;
let playGameButton = null;
let viewHSButton = null;

// Game timer
let tickTimer = Date.now();

// Game state
let gameState = STATE_SETUP;

// Image Assets
let buttonImages = {};
let snakeImages = {};
let foodImages = {};
let candyImages = {};
let giftImages = {};
let currencyImages = {};
let playfieldImages = {};
let frontendImages = {};
let snakeDeadImages = {};

let numLoadedImages = 0;
let totalImages = 37;

// Game Play
let gameVariablesSet = false;
let playTimer = 0;
let playerScore = 0;
let gameRound = null;
let snakeUpdateFrequencyScaler = null;
let detectingSwipe = false;
let startTouchMoveX = null;
let startTouchMoveY = null;
let endTouchMoveX = null;
let endTouchMoveY = null;
let snakeRenderPos = null;
let snake = null;
let snakeMovementDirection = null;
let snakeChangingDirection = null;
let snakeDirectionX = null;
let snakeDirectionY = null;
let foodX = null;
let foodY = null;
let foodImageSet = null;
let foodImage = null;
let foodConsumed = null;
let hudRound = null;
let hudScore = null;

// Hack for tiny iPhones
let usingTinyIphone = false;

// Core Methods
// ------------
$( document ).ready(function() {

    // load images into arrays for use on the canvas
    loadImages();

    // start game tick
    setInterval( tick, 33 );
});

function tick() {
    // check if all images have been loaded
    if ( numLoadedImages !== totalImages) {
        // images not loaded, dont proceed
        return;
    }

    // update our core game timer. Delta Time is the time elapsed since the last tick
    let deltaTime = updateTimer();

    switch( gameState ) {
        case STATE_SETUP: tickSetup(deltaTime); break;
        case STATE_TITLE: tickTitle(deltaTime); break;
        case STATE_TUTORIAL: tickTutorial(deltaTime); break;
        case STATE_PLAY: tickPlay(deltaTime); break;
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

    // if we're on an iphone se, just hack baby, hack.
    if( window.innerWidth === 320 && window.innerHeight === 524 ) {
        usingTinyIphone = true;

        GAME_SCREEN_WIDTH = 280;
        GAME_SCREEN_HEIGHT = 420;

        HUD_WIDTH = GAME_SCREEN_WIDTH;
        HUD_HEIGHT = 40;

        GAMEBOARD_WIDTH = GAME_SCREEN_WIDTH;
        GAMEBOARD_HEIGHT = GAME_SCREEN_HEIGHT - HUD_HEIGHT;
    }

    // center the gameboard on the screen
    let canvasDiv = document.getElementById('canvasWrapper');
    canvasDiv.style.left = ((window.innerWidth - GAME_SCREEN_WIDTH) / 2) + "px";
    canvasDiv.style.top = ((window.innerHeight - GAME_SCREEN_HEIGHT) / 2)  + "px";

    // create/setup menu canvas
    menuCanvas = document.getElementById('menuCanvas');
    menuCanvas.width = GAME_SCREEN_WIDTH;
    menuCanvas.height = GAME_SCREEN_HEIGHT;

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
    hudCanvas.width = HUD_WIDTH;
    hudCanvas.height = HUD_HEIGHT;

    hudCTX = hudCanvas.getContext('2d');

    // create/setup game canvas
    gameCanvas = document.getElementById('gameCanvas');

    gameCanvas.width = GAMEBOARD_WIDTH;
    gameCanvas.height = GAMEBOARD_HEIGHT;
    gameCTX = gameCanvas.getContext('2d');

    // event listeners for touch gameplay      
    gameCanvas.addEventListener('touchstart', function(event) {
        event.preventDefault();

        // First check if we are in STATE_PLAY, not already changing direction, and not currently detecting a swipe
        if ( gameState === STATE_PLAY && snakeChangingDirection === false && detectingSwipe === false ) {
            // set our startTouchMove values
            startTouchMoveX = event.touches[0].screenX;
            startTouchMoveY = event.touches[0].screenY;

            // we are now detecting a swipe, set to true so we dont overwrite our startTouchMove values
            detectingSwipe = true;
        }
    });

    gameCanvas.addEventListener('touchend', function(event) {
        event.preventDefault();

        // only process direction change if game state play, not already changing direction, and currently detecting a swipe
        if ( gameState === STATE_PLAY && snakeChangingDirection === false && detectingSwipe === true) {

            // set our endTouchMove values
            endTouchMoveX = event.changedTouches[0].screenX;
            endTouchMoveY = event.changedTouches[0].screenY;

            // check for taps )
            if ( Math.abs( startTouchMoveX - endTouchMoveX ) < Math.abs( TOUCH_THRESHOLD ) && Math.abs( startTouchMoveY - endTouchMoveY ) < Math.abs( TOUCH_THRESHOLD ) ) {
                // reset previous touch X/Y 
                resetTouchMoveXY();               

                // ignore this touch
                return;
            }

            switch ( snakeMovementDirection ) {
                case 'right': {
                    verticalSwipe( );

                    break; 
                } 
                case 'left': { 
                    verticalSwipe( );

                    break;
                }
                case 'up': {
                    horizontalSwipe( );

                    break;
                }
                case 'down': {
                    horizontalSwipe( );

                    break;
                }
            }
        }
    }, false);

    // event listener for keyboard gameplay (for debugging)
    document.addEventListener('keydown', function(e) {   
        // Only act on key if in PLAY state
        if ( gameState === STATE_PLAY) {
            switch(e.keyCode) {
                // left key
                case 37: {
                    // ensure snake is not traveling right
                    if (snakeMovementDirection !== 'right' && snakeMovementDirection !== 'left') {
                        changeDirection('left');
                    }
                    break;
                }
                // right key
                case 39: {
                    // ensure snake is not traveling left
                    if (snakeMovementDirection !== 'left' && snakeMovementDirection !== 'right') {
                        changeDirection('right');
                    }
                    break;
                }
                // up key
                case 38: {
                    // ensure snake is not traveling down
                    if (snakeMovementDirection !== 'up' && snakeMovementDirection !== 'down') {
                        changeDirection('up');
                    }
                    break;
                }
                // down key
                case 40: {
                    // ensure snake is not traveling up
                    if (snakeMovementDirection !== 'down' && snakeMovementDirection !== 'up') {
                        changeDirection('down');
                    }
                    break;
                }
            }
        }
    });

    // create transparent buttons (rendered under the button images so we can capture the click)
    // use button image dimensions to set width, height, and location
    playGameButton = new TransparentButton( menuCTX, ( buttonImages['button-play-game'].width / 2.5 ), (buttonImages['button-play-game'].height / 2.5 ) );
    viewHSButton = new TransparentButton( menuCTX, ( buttonImages['button-view-high-score'].width / 2.5 ), (buttonImages['button-view-high-score'].height / 2.5 ) );
    
    // and now goto the title screen
    gameState = STATE_TITLE;
    displayUI( "#canvasWrapper", true );
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

    // ensure menu canvas is displayed and hud and game canvas are hidden
    $('#menuCanvas').css('display','block');
    $('#hudCanvas').css('display','none');
    $('#gameCanvas').css('display','none');

    // wait for the play game button to be clicked
    if( playGameButton.wasClicked( mouseClickEvt ) ) {
        gameState = STATE_TUTORIAL;

        tutorialDoneButton = new TransparentButton( menuCTX, ( buttonImages['button-play-game'].width / 2.5 ), (buttonImages['button-play-game'].height / 2.5 ) );
    }
    else if ( viewHSButton.wasClicked( mouseClickEvt ) ) {

        // or let them view the leaderboard
        gameState = STATE_LEADERBOARD;

        displayUI( "#leaderboard", true );
        displayUI( "#canvasWrapper", false );
        
        $("#leaderboard-spinner").css("visibility", "visible");
        $("#leaderboard-scores").css("visibility", "hidden");

        getScores( MAX_NUM_LEADERBOARD_SCORES, parseScores );
    }
}

function renderTitle(deltaTime) {
    clearCanvas( menuCTX, menuCanvas );

    let playButtonYOffset = 110;
    playGameButton.x = ( menuCanvas.width - ( buttonImages['button-play-game'].width / 2.5 ) ) / 2;
    playGameButton.y = ( menuCanvas.height / 2 ) + playButtonYOffset;
    playGameButton.render( );
    menuCTX.drawImage( buttonImages['button-play-game'], ( menuCanvas.width - ( buttonImages['button-play-game'].width / 2.5 ) ) / 2, ( menuCanvas.height / 2) + playButtonYOffset, buttonImages['button-play-game'].width / 2.5, buttonImages['button-play-game'].height / 2.5 );

    let hsButtonYOffset = 180;
    viewHSButton.x = ( menuCanvas.width - ( buttonImages['button-view-high-score'].width / 2.5 ) ) / 2;
    viewHSButton.y = ( menuCanvas.height / 2 ) + hsButtonYOffset;
    viewHSButton.render( );
    menuCTX.drawImage( buttonImages['button-view-high-score'], ( menuCanvas.width - ( buttonImages['button-view-high-score'].width / 2.5 ) ) / 2, ( menuCanvas.height / 2 ) + hsButtonYOffset, buttonImages['button-view-high-score'].width / 2.5, buttonImages['button-view-high-score'].height / 2.5 );

    let titleXOffset = (GAMEBOARD_WIDTH - frontendImages['frontend/ccv-snake-title'].width) / 2;
    menuCTX.drawImage( frontendImages['frontend/ccv-snake-title'], titleXOffset, frontendImages['frontend/header'].height, frontendImages['frontend/ccv-snake-title'].width, frontendImages['frontend/ccv-snake-title'].height );

    if( usingTinyIphone === false ) {
        render8bitText( "A THROWBACK TO", 'white', GAMEBOARD_WIDTH / 2, frontendImages['frontend/ccv-snake-title'].height + 140, '16px' );
        render8bitText( "OLD SCHOOL GAMING", 'white', GAMEBOARD_WIDTH / 2, frontendImages['frontend/ccv-snake-title'].height + 160, '16px' );
    }

    menuCTX.drawImage( frontendImages['frontend/header'], 0, 0, frontendImages['frontend/header'].width, frontendImages['frontend/header'].height );

    //renderMenuDebugInfo( );
}
// ------------
/* END STATE TITLE */


/* STATE: TUTORIAL */
// ------------

function tickTutorial(deltaTime) {

    updateTutorial(deltaTime);
    renderTutorial(deltaTime);
}

function updateTutorial(deltaTime) {

    // set game starting values if not already set
    if ( gameVariablesSet !== true ) {
        setDefaultGameVariables();
    }

    // create food if its not created
    if ( !foodX || !foodY ) {
        createFood();
    }
    
    // wait for them to say OK!
    if ( tutorialDoneButton.wasClicked( mouseClickEvt ) ) {
        gameState = STATE_PLAY;
    }
}

function renderTutorial(deltaTime) {

    clearCanvas( menuCTX, menuCanvas );

    // draw the themed header
    menuCTX.drawImage( frontendImages['frontend/header'], 0, 0, frontendImages['frontend/header'].width, frontendImages['frontend/header'].height );

    // tutorial adjustments hack for tiny iphone
    if( usingTinyIphone ) {
        let adjustmentOffset = -10;
        let adjustmentPerc = .85;
        menuCTX.drawImage( frontendImages['frontend/tutorial'], adjustmentOffset, adjustmentOffset, frontendImages['frontend/tutorial'].width * adjustmentPerc, frontendImages['frontend/tutorial'].height * adjustmentPerc);
    }
    else {
        menuCTX.drawImage( frontendImages['frontend/tutorial'], 0, 0, frontendImages['frontend/tutorial'].width, frontendImages['frontend/tutorial'].height );
    }

    let tutorialButtonYOffset = GAMEBOARD_HEIGHT;
    tutorialDoneButton.x = ( menuCanvas.width - ( buttonImages['button-play-game'].width / 2.5 ) ) / 2;
    tutorialDoneButton.y = tutorialButtonYOffset;
    tutorialDoneButton.render( );
    menuCTX.drawImage( buttonImages['button-play-game'], ( menuCanvas.width - ( buttonImages['button-play-game'].width / 2.5 ) ) / 2, tutorialButtonYOffset, buttonImages['button-play-game'].width / 2.5, buttonImages['button-play-game'].height / 2.5 );
    
    //renderMenuDebugInfo( );
}
// ------------
/* END STATE TUTORIAL */


/* STATE: PLAY */
// ------------

function tickPlay(deltaTime) {

    playTimer += deltaTime;

    updatePlay(deltaTime);
    renderPlay(deltaTime);
    

}

function updatePlay(deltaTime) {

    // ensure game canvas and hud are displayed and menu canvas is hid
    $('#hudCanvas').css('display','block');
    $('#gameCanvas').css('display','block');
    $('#menuCanvas').css('display','none');

    if ( playTimer >= ( SNAKE_UPDATE_FREQUENCY_SEC * snakeUpdateFrequencyScaler ) ) {
        advanceSnake();

        // Check for Level Up
        if ( foodConsumed === 2 ) {

            // level up
            levelUp( );

            // reset foodConsumed
            foodConsumed = 0;
        }
        
        // reset playTimer to 0
        playTimer -= ( SNAKE_UPDATE_FREQUENCY_SEC * snakeUpdateFrequencyScaler );
    }

    // only update the snake's RENDER position if he didn't die due to collision
    if ( detectCollision() ) {
        gameState = STATE_WINDDOWN;
        
        snakeDeathAnimRate = .5 / snakeRenderPos.length;
        snakeDeathAnimLength = snakeRenderPos.length;
        snakeDeathAnimTimer = snakeDeathAnimRate + 1.0; //add some extra time in the beginning so the user can see what happened
    } 
    else {
        snakeRenderPos = snake.slice();
    }

    updateHUD();
}

function renderPlay(deltaTime) {

    clearCanvas( hudCTX, hudCanvas );
    clearCanvas( gameCTX, gameCanvas );

    // render the game board - todo: let this change as the level progresses
    let keys = Object.keys(playfieldImages);
    gameCTX.drawImage( playfieldImages[ keys[ 1 ] ], 0, 0 );

    drawSnake(snakeImages['snake-head'], snakeRenderPos.length);
    drawFood();
    drawHUD();
    
    //renderGameDebugInfo( );
}
// ------------
/* END STATE PLAY */


/* STATE: WINDDOWN */
// ------------
let snakeDeathAnimLength = 0;
let snakeDeathAnimTimer = 0;
let snakeDeathAnimRate = 0;

function tickWinddown(deltaTime) {

    updateWinddown(deltaTime);
    renderWinddown(deltaTime);
}

function updateWinddown(deltaTime) {

    // ensure game canvas and hud are displayed and menu canvas is hid
    $('#hudCanvas').css('display','block');
    $('#gameCanvas').css('display','block');
    $('#menuCanvas').css('display','none');
    
    // when the snake death is over, move on
    if( snakeDeathAnimLength < -1 ) {
        gameState = STATE_GAMEOVER;

        // create transparent button to capture clicks
        submitHSButton = new TransparentButton( menuCTX, ( buttonImages['button-submit-score'].width / 2.25 ), (buttonImages['button-submit-score'].height / 2.25 ) );
        submitHSButton.x = ( menuCanvas.width - ( buttonImages['button-submit-score'].width / 2.25 ) ) / 2;
        submitHSButton.y = ( menuCanvas.height / 2 );

        playAgainButton = new TransparentButton( menuCTX, ( buttonImages['button-play-again'].width / 2.25 ), (buttonImages['button-play-again'].height / 2.25 ) );
        playAgainButton.x = ( menuCanvas.width - ( buttonImages['button-play-again'].width / 2.25 ) ) / 2;
        playAgainButton.y = ( menuCanvas.height / 2 ) + 100;
    }

    // animate the snake dying, and then we'll end when we're done
    snakeDeathAnimTimer -= deltaTime;
    if( snakeDeathAnimTimer <= 0.0 ) {
        snakeDeathAnimLength--;

        snakeDeathAnimTimer += snakeDeathAnimRate;
    }
}

function renderWinddown(deltaTime) {

    clearCanvas( hudCTX, hudCanvas );
    clearCanvas( gameCTX, gameCanvas );

    // render the game board - todo: let this change as the level progresses
    let keys = Object.keys(playfieldImages);
    gameCTX.drawImage( playfieldImages[ keys[ 1 ] ], 0, 0 );

    // draw the snake's last position as we decay it
    if( snakeDeathAnimLength >= 0 ) {
        drawSnake(snakeDeadImages['snake-dead-0'], Math.max(0, snakeDeathAnimLength));
    }
    // else {
    //     gameCTX.drawImage(snakeDeadImages['snake-dead-0'], snakeRenderPos[0].x, 
    //                                                        snakeRenderPos[0].y, 
    //                                                        GAMEPLAY_GRID_SIZE, 
    //                                                        GAMEPLAY_GRID_SIZE);
    // }

    // food should not draw

    // render the HUD in grey so we know we're in winddown
    drawHUD( "grey" ); 
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

    // ensure game canvas and hud are displayed and menu canvas is hid
    $('#hudCanvas').css('display','none');
    $('#gameCanvas').css('display','none');
    $('#menuCanvas').css('display','block');

    // wait for one of the two buttons to be clicked
    if( submitHSButton.wasClicked( mouseClickEvt ) ) {
        
        // goto the submit score screen
        displayUI( "#hiscoreSubmit", true );
        displayUI( "#canvasWrapper", false );
        
        $("#playerScore").text(playerScore);
        $('#initialsInput').val('');
        
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

    render8bitText( "YOUR SCORE", 'white', GAMEBOARD_WIDTH / 2, (menuCanvas.height / 2) - 125, '24px' );
    render8bitText( playerScore, 'white', GAMEBOARD_WIDTH / 2, (menuCanvas.height / 2) - 75, '24px' );
    
    submitHSButton.render( );
    playAgainButton.render( );

    if( usingTinyIphone === false ) {
        menuCTX.drawImage( frontendImages['frontend/header'], 0, 0, frontendImages['frontend/header'].width, frontendImages['frontend/header'].height );
    }
    
    menuCTX.drawImage( buttonImages['button-submit-score'], ( menuCanvas.width - ( buttonImages['button-submit-score'].width / 2.25 ) ) / 2, ( menuCanvas.height / 2), buttonImages['button-submit-score'].width / 2.25, buttonImages['button-submit-score'].height / 2.25 );
    menuCTX.drawImage( buttonImages['button-play-again'], ( menuCanvas.width - ( buttonImages['button-play-again'].width / 2.25 ) ) / 2, ( menuCanvas.height / 2) + 100, buttonImages['button-play-again'].width / 2.25, buttonImages['button-play-again'].height / 2.25 );


    //renderMenuDebugInfo( );
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
        let playerInitials = $('#initialsInput').val();
        playerInitials = playerInitials.toUpperCase();

        // if they entered a name
        if ( playerInitials.length > 1 ) {
            
            // grab their campus
            let playerCampus = $("#playerCampus").val( );
            playerCampus = playerCampus.toUpperCase();

            // hide the submit screen
            displayUI( "#hiscoreSubmit", false );
            displayUI( "#canvasWrapper", true );

            // post it with their score (if their score is more than 0)
            if( playerScore > 0 ) {
                postScore( playerInitials, playerScore, playerCampus, function() {} );
            }

            // clear game variables
            clearGameVariables();

            // go back to the title screen
            gameState = STATE_TITLE;
        }
    }
    else if ( cancelHSClicked ) {

        displayUI( "#hiscoreSubmit", false );
        displayUI( "#canvasWrapper", true );

        // clear game variables
        clearGameVariables();

        gameState = STATE_TITLE;
    }
}

function renderSubmitScore( deltaTime ) {
    
    //renderMenuDebugInfo( );
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

        displayUI( "#leaderboard", false );
        displayUI( "#canvasWrapper", true );

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
    
}

function renderMenuDebugInfo( ) {

    menuCTX.fillStyle = 'black';
    menuCTX.fillRect( 0, menuCanvas.height - 50, menuCanvas.width, 50 );

    // backup curr values
    let currFillStyle = menuCTX.fillStyle;
    let currFont = menuCTX.font;
    let currAllign = menuCTX.textAlign;

    menuCTX.fillStyle = 'white';
    menuCTX.font = "12px Arial";
    menuCTX.textAlign = 'left';

    menuCTX.fillText( "Debug Info -", 0, menuCanvas.height - 40 );
    menuCTX.fillText( "State: " + gameState, 80, menuCanvas.height - 40 );

    // restore previous values
    menuCTX.fillStyle = currFillStyle;
    menuCTX.font = currFont;
    menuCTX.textAlign = currAllign;
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

function render8bitText( renderText, color, posX, posY, fontSize = '20px' ) {

    // backup curr values
    let currFillStyle = menuCTX.fillStyle;
    let currFont = menuCTX.font;

    menuCTX.fillStyle = color;
    menuCTX.font = `${fontSize} "${EIGHT_BIT_FONT_NAME}"`;
    menuCTX.fillText( renderText, posX, posY );

    // restore previous values
    menuCTX.fillStyle = currFillStyle;
    menuCTX.font = currFont;
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
    playTimer = 0;
    gameRound = 1;
    snakeUpdateFrequencyScaler = .7;
    startTouchMoveX = null;
    startTouchMoveY = null;
    endTouchMoveX = null; 
    endTouchMoveY = null;
    detectingSwipe = false;
    snake = [
        {x: 140, y: 140},
        {x: 120, y: 140},
        {x: 100, y: 140},
        {x: 80, y: 140},
        {x: 60, y: 140},
    ];
    snakeRenderPos = snake.slice();
    snakeMovementDirection = 'right';
    snakeChangingDirection = false;
    snakeDirectionX =  GAMEPLAY_GRID_SIZE;
    snakeDirectionY = 0;
    foodX = null;
    foodY = null;
    foodConsumed = 0;
    foodImage = null;
    foodImageSet = foodImages;
    hudRound = null;
    hudScore = null;

    gameVariablesSet = true;
}

// clear game variables
function clearGameVariables() {
    // Game Play
    gameVariablesSet = false;
    playTimer = 0;
    playerScore = 0;
    gameRound = null;
    snakeUpdateFrequencyScaler = null;
    startTouchMoveX = null;
    startTouchMoveY = null;
    endTouchMoveX = null; 
    endTouchMoveY = null;
    detectingSwipe = false;
    snake = null;
    snakeMovementDirection = null;
    snakeChangingDirection = null;
    snakeDirectionX = null;
    snakeDirectionY = null;
    foodX = null;
    foodY = null;
    foodConsumed = null;
    foodImageSet = null;
    foodImage = null;
    hudRound = null;
    hudScore = null;
}

// Level Up
function levelUp( ) {
    // select a new food image set
    if ( foodImageSet === foodImages ) {
        foodImageSet = candyImages;
    } else if ( foodImageSet === candyImages ) {
        foodImageSet = giftImages;
    } else if ( foodImageSet === giftImages ) {
        foodImageSet = currencyImages;
    } else if ( foodImageSet === currencyImages ) {
        foodImageSet = foodImages;
    }

    // increase gameRound
    gameRound++;

    // increase snake speed
    snakeUpdateFrequencyScaler -= .025;
}


// Update HUD data
function updateHUD() {

    hudRound = gameRound;
    hudScore = playerScore;
}

// Create Food
function createFood() {

    // Generate food coordinates (inside playing field)
    foodX = returnRandom( 0, gameCanvas.width, GAMEPLAY_GRID_SIZE );
    foodY = returnRandom( 0, gameCanvas.height, GAMEPLAY_GRID_SIZE );

    // select a random image 
    foodImage = returnRandomImage(foodImageSet);

    // Check if food was created where the snake is, if so try the creation again
    snake.forEach(function isFoodOnSnake(part) {
        const foodIsOnSnake = part.x == foodX && part.y == foodY;

        // recreate the food if it was created on the snake
        if (foodIsOnSnake) {
            createFood();
        }
    });
}

function drawHUD( fillColor = "gold" ) {

    // draw hud bg-color
    hudCTX.fillStyle = fillColor;
    hudCTX.fillRect( 0, 0, hudCanvas.width, hudCanvas.height );


    // draw hud text
    hudCTX.fillStyle = "white";
    hudCTX.font = `20px "${EIGHT_BIT_FONT_NAME}"`;
    hudCTX.textAlign = "left";
    hudCTX.fillText( "ROUND:" + hudRound, 10, 27) ;
    hudCTX.textAlign = "right";
    hudCTX.fillText( hudScore, hudCanvas.width - 10, 27);
}

// Draw snake
function drawSnake( snakeHeadImage, numParts ) {

    for (i = 0; i < numParts; i++) {
        if ( i === 0 ) {
            drawSnakeHead( snakeHeadImage, snakeRenderPos[i] );
        } else if ( i % 2 == 0) {
            drawSnakeBodyPart( snakeRenderPos[i], false );
        } else {
            drawSnakeBodyPart( snakeRenderPos[i], true );
        }
    }
//    snake.forEach(drawSnakePart);
}

// Draw snake head
function drawSnakeHead(snakeHeadImage, snakePart) {

    gameCTX.drawImage(snakeHeadImage, snakePart.x, snakePart.y, GAMEPLAY_GRID_SIZE, GAMEPLAY_GRID_SIZE);

}

// Draw snake part
function drawSnakeBodyPart(snakePart, alternate) {

    if ( !alternate ) {
        gameCTX.drawImage(snakeImages['snake-body-a'], snakePart.x, snakePart.y, GAMEPLAY_GRID_SIZE, GAMEPLAY_GRID_SIZE);
    } else {
        gameCTX.drawImage(snakeImages['snake-body-b'], snakePart.x, snakePart.y, GAMEPLAY_GRID_SIZE, GAMEPLAY_GRID_SIZE);
    }
}

// Draw food
function drawFood() {

    // draw an image of food, otherwise draw a blank square 
    // TODO: do we need this kind of backup or is drawing an image good enough?
    if (foodImage) {
        gameCTX.drawImage(foodImage, foodX, foodY, GAMEPLAY_GRID_SIZE, GAMEPLAY_GRID_SIZE);
    } else {
        gameCTX.fillStyle = FOOD_COLOR;
        gameCTX.strokeStyle = FOOD_BORDER_COLOR;
        gameCTX.fillRect(foodX, foodY, GAMEPLAY_GRID_SIZE, GAMEPLAY_GRID_SIZE);
        gameCTX.strokeRect(foodX, foodY, GAMEPLAY_GRID_SIZE, GAMEPLAY_GRID_SIZE);
    }

}

// Advance the snake forward
function advanceSnake() {

    // set new location of snake head
    const head = {x: snake[0].x + snakeDirectionX, y: snake[0].y + snakeDirectionY};

    // Direction change complete, allow input for next change
    snakeChangingDirection = false;

    // add new head location to front of snake array
    snake.unshift( head );

    if ( detectFoodEaten() ) {

        // food consumed, increase count
        foodConsumed++;

        // ate food, increase score, create new food, and do NOT remove last part of snake
        playerScore += 100;

        createFood();
    } else {
        // did not eat food, remove last part of snake to keep it the same length
        snake.pop();
    }
}

// check if the snake head is on food
function detectFoodEaten() {

    return ( snake[0].x === foodX && snake[0].y === foodY );
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

    return hitLeftWall || hitRightWall || hitTopWall || hitBottomWall;
}

// Change direction of snake movement
function changeDirection(direction) {

    // check if we have already changed direction this game tick
    if ( !snakeChangingDirection ) {
        // Set so that we dont change direction twice during update 
        snakeChangingDirection = true;

        // Perform direction change
        switch(direction) {
            case 'left': {
                snakeMovementDirection = 'left';
                snakeDirectionX = -GAMEPLAY_GRID_SIZE;
                snakeDirectionY = 0;
                break;
            }
            case 'right': {
                snakeMovementDirection = 'right';
                snakeDirectionX = GAMEPLAY_GRID_SIZE;
                snakeDirectionY = 0;
                break;
            }
            case 'up': {
                snakeMovementDirection = 'up';
                snakeDirectionX = 0;
                snakeDirectionY = -GAMEPLAY_GRID_SIZE; 
                break;
            }
            case 'down': {
                snakeMovementDirection = 'down';
                snakeDirectionX = 0;
                snakeDirectionY = GAMEPLAY_GRID_SIZE;
                break;
            }
            default: {
                break;
            }
        }
    }
}

// Generate a random number by intervals
// wasnt sure if using name random() would cause issues with some default function I dont know about
function returnRandom(min, max, interval) {

    return min + ( interval * Math.floor(Math.random() * ( max-min ) / interval ) );
}

// return a random image from image associative array
function returnRandomImage( object ) {

    let keys = Object.keys(object);

    return object[keys[Math.floor(keys.length * Math.random())]];
}

// Load game asset images into image arrays
function loadImages() {
    // buttons
    loadImage( buttonImages, 'button-play-game');
    loadImage( buttonImages, 'button-play-again');
    loadImage( buttonImages, 'button-submit-score');
    loadImage( buttonImages, 'button-view-high-score');

    // snake
    loadImage( snakeImages, 'snake-head');
    loadImage( snakeImages, 'snake-body-a');
    loadImage( snakeImages, 'snake-body-b');

    // food
    loadImage( foodImages, 'food-apple-green');
    loadImage( foodImages, 'food-apple-red');
    loadImage( foodImages, 'food-cherry');
    loadImage( foodImages, 'food-cookie');
    loadImage( foodImages, 'food-lemon');
    loadImage( foodImages, 'food-meat');
    loadImage( foodImages, 'food-strawberry');

    // candy
    loadImage( candyImages, 'candy-cane-blue');
    loadImage( candyImages, 'candy-cane-green');
    loadImage( candyImages, 'candy-cane-grinch');
    loadImage( candyImages, 'candy-cane-orange');
    loadImage( candyImages, 'candy-cane-pink');
    loadImage( candyImages, 'candy-cane-purple');
    loadImage( candyImages, 'candy-cane-red');

    // gift
    loadImage( giftImages, 'gift-green');
    loadImage( giftImages, 'gift-purple');
    loadImage( giftImages, 'gift-red');
    loadImage( giftImages, 'gift-yellow');
    
    // currency
    loadImage( currencyImages, 'currency-coin-gold');
    loadImage( currencyImages, 'currency-coin-silver');
    loadImage( currencyImages, 'currency-ruby-blue');
    loadImage( currencyImages, 'currency-ruby-green');
    loadImage( currencyImages, 'currency-ruby-orange');
    loadImage( currencyImages, 'currency-ruby-red');

    // gameplay fields
    loadImage( playfieldImages, 'playfields/playfield-0', '.jpg');
    loadImage( playfieldImages, 'playfields/playfield-1', '.jpg');

    // frontend images
    loadImage( frontendImages, 'frontend/header' );
    loadImage( frontendImages, 'frontend/tutorial', '.jpg');
    loadImage( frontendImages, 'frontend/ccv-snake-title' );

    loadImage( snakeDeadImages, 'snake-dead-0' );
}

// load image into imageArray
function loadImage( imageArray, name, ext = ".png" ) {

    imageArray[name] = new Image();
    imageArray[name].onload = function() {
        // once image loads, increase loaded count
        numLoadedImages++;
    };

    imageArray[name].src = "./assets/images/" + name + ext;
}

// Debug info while playing the game
function renderGameDebugInfo( ) {

    gameCTX.fillStyle = 'black';
    gameCTX.fillRect( 0, gameCanvas.height - 50, gameCanvas.width, 50 );

    // backup curr values
    let currFillStyle = gameCTX.fillStyle;
    let currFont = gameCTX.font;
    let currAllign = gameCTX.textAlign;

    gameCTX.fillStyle = 'white';
    gameCTX.font = "12px Arial";
    gameCTX.textAlign = 'left';

    gameCTX.fillText( "Debug Info -", 0, gameCanvas.height - 40 );
    gameCTX.fillText( "State: " + gameState, 80, gameCanvas.height - 40 );
    gameCTX.fillText( "snakeX: " +snake[0].x, 0, gameCanvas.height -10)
    gameCTX.fillText( "snakeY: " +snake[0].y, 80, gameCanvas.height -10)

    // restore previous values
    gameCTX.fillStyle = currFillStyle;
    gameCTX.font = currFont;
    gameCTX.textAlign = currAllign;
}

function horizontalSwipe( ) {
    if ( swipeRight() ) {

        changeDirection( 'right' );
        
        resetTouchMoveXY( );
    } else if ( swipeLeft() ) {

        changeDirection( 'left' );
    
        resetTouchMoveXY( );
    }
}

function verticalSwipe( ) {
    if ( swipeUp() ) {

        changeDirection( 'up' );

        resetTouchMoveXY( );
    } else if ( swipeDown() ) {

        changeDirection( 'down' );

        resetTouchMoveXY( );
    }
}

// check for right swipe
function swipeRight( ) {
    return ( endTouchMoveX >= startTouchMoveX && Math.abs( endTouchMoveX - startTouchMoveX ) > TOUCH_THRESHOLD ) ;
}

// check for left swipe
function swipeLeft( ) {
    return ( endTouchMoveX <= startTouchMoveX && Math.abs( endTouchMoveX - startTouchMoveX ) > TOUCH_THRESHOLD );
}

// check for down swipe
function swipeDown( ) {
    return ( endTouchMoveY >= startTouchMoveY && Math.abs( endTouchMoveY - startTouchMoveY ) > TOUCH_THRESHOLD );
}

// check for up swipe
function swipeUp( ) {
    return (endTouchMoveY <= startTouchMoveY && Math.abs( endTouchMoveY - startTouchMoveY ) > TOUCH_THRESHOLD );
}

// reset touchMove values
function resetTouchMoveXY( ) {
    startTouchMoveX = null;
    startTouchMoveY = null;
    endTouchMoveX = null; 
    endTouchMoveY = null;

    detectingSwipe = false;
}

function displayUI( uiPanelId, visible) {

    if( visible === true ) {
        $(uiPanelId).css({visibility:"visible", opacity: 0.0}).animate({opacity: 1.0},200);
    } 
    else {
        $(uiPanelId).animate({opacity: 0.0}, 200, function( ) { 
                    $(uiPanelId).css({visibility:"hidden"}) 
        });
    }
}

// ------------
/*END GAME UTILITY*/