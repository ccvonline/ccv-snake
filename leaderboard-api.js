
const SERVER_URL = "https://ddu8l1tm81.execute-api.us-west-1.amazonaws.com/default/snakeScores";
const API_KEY = "gWY9qCh3sq1mW8J5tfzGo3e3KAbAZ1nW3LxfzKsn";

var gLeaderboardScores = null;

function getScores( onComplete ) {
    $.ajax({
        url: SERVER_URL,
        cache: false,
        headers: {
            "x-api-key": API_KEY,
        },
        crossDomain: true,
        timeout: 10000, //10 seconds, then we try again
        error: function() {
            onComplete(false);
        }
    })
    .done( function( scores ) {
        gLeaderboardScores = scores.data.items;
        onComplete(true);
    });
}

function postScore( name, score, campus, onComplete ) {
    $.ajax({
        url: SERVER_URL,
        method: "POST",
        contentType: 'application/json',
        cache: false,
        headers: {
            "x-api-key": API_KEY,
        },
        crossDomain: true,
        data: JSON.stringify( { "name": name, "score": score, "campus": campus } )
    })
    .done( function( ) {
        onComplete();
    });
}
