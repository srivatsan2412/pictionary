var socket = io();
var user;
var userSuccessCount = 0;
var counter = 60;
var myTime = $('#timer');
var Interval;
var userPoints = {}

var app = new window.Webex.Application();

function usernameAsk() {
    $('.grey-out').fadeIn(500);
    $('.user').fadeIn(500);
    $('.user').submit(function(){
        event.preventDefault();
        user = $('#username').val().trim();

        if (user == '') {
            return false
        };

        var index = users.indexOf(user);

        if (index > -1) {
            alert(user + ' already exists');
            return false
        };
        
        userPoints[user] = 0;
        socket.emit('join', {username: user, userPoints: userPoints});
        var url = window.location.origin;
        app.setShareUrl(url);
        console.log("url set: " + url);
    
        $('.grey-out').fadeOut(300);
        $('.user').fadeOut(300);
        $('input.guess-input').focus();
    });
};

var context;
var canvas;
var click = false;

var clearScreen = function() {
    context.clearRect(0, 0, canvas[0].width, canvas[0].height);
};

var guesser = function() {
    clearScreen();
    click = false;
    console.log('draw status: ' + click);
    $('.draw').hide();
    $('#guesses').empty();
    console.log('You are a guesser');
    $('#guess').show();
    $('.guess-input').focus();

    $('#guess').on('submit', function() {
        event.preventDefault();
        var guess = $('.guess-input').val();

        if (guess == '') {
            return false
        };

        console.log(user + "'s guess: " + guess);
        socket.emit('guessword', {username: user, guessword: guess});
        $('.guess-input').val('');
    });
};

var showCompleted = function(data){
    $('#guess').hide();
    $('#completed').show();
}

var reverseShowCompleted = function(data){
    $('#guess').show();
    $('#completed').hide();
}

var showGuessWord = function(data){
    $('#guesses').text(data.username + "'s guess: " + data.guessword);
}

var guessword = function(data){
    if(click==true && data.guessword != $('span.word').text())
    {
        socket.emit('show Guess Word', data);
    }
    else if(click == true && data.guessword == $('span.word').text() && userSuccessCount+2<users.length)
    {
        socket.emit('completed user', {from: user, to: data.username});
        userSuccessCount+=1;
        return;
    }
    else if(click == true && data.guessword == $('span.word').text() && userSuccessCount+2==users.length)
    {
        socket.emit('completed all user', {from: user, to: data.username});
        userSuccessCount=0;
    }
    if (click == true && data.guessword == $('span.word').text() ) {
        console.log('guesser: ' + data.username + ' draw-word: ' + $('span.word').text());
        socket.emit('correct answer', {username: data.username, guessword: data.guessword});
        var index = 0;
        for(var i =0 ; i<users.length;i++)
        {
            if(users[i]==user){
                index = (i+1)%users.length;
            }
        }
        clearInterval(Interval);
        resetCounter();
        socket.emit('swap rooms', {from: user, to: users[index]});
        click = false;
    }
};

 function callCountDown(){
    if(click)
    {
        counter-=1;
        console.log(counter);
        $('#timer').html('<p>' + counter + ' Second Remaining!' + '</p>');
        if(counter == 0){
            clearInterval(Interval);
            resetCounter();
            $('#guesses').html('<p>' + 'Correct Answer Is: ' + ' draw-word: ' + $('span.word').text() + '</p>');
            var index = 0;
            socket.emit('completed all user', {from: user});
            userSuccessCount=0;
            for(var i =0 ; i<users.length;i++)
            {
                if(users[i]==user){
                    index = (i+1)%users.length;
                }
            }
            socket.emit('swap rooms', {from: user, to: users[index]});
            click = false;
        }
    }
}

function resetCounter(){
    counter = 60;
    $('#timer').hide();
}

var drawWord = function(word) {
    $('span.word').text(word);
    console.log('Your word to draw is: ' + word);
    $('#timer').show();
    Interval = setInterval(callCountDown,1000);
};

var users = [];

var userlist = function(data) {
    users = data.names;
    if(data.names){
        var html = '<p class="chatbox-header">' + 'Players' + '</p>';
        for (var i = 0; i < data.names.length; i++) {
            html += '<li>' + data.names[i] + '</li>';
        };
        $('ul').html(html);
        
        userPoints = data.userPoints;
        var leaderHtml = ' <h3> ' + 'Leader Board' + '</h3>' ; 
        leaderHtml+= '<table> <tr> <th>'+  'Player' + '</th> <th>' + 'Score' + '</th> </tr>'
        for (var i = 0; i < data.names.length; i++) {
            leaderHtml += '<tr> <td>' + data.names[i] + ' </td> <td>' + userPoints[data.names[i]] + '</td> </tr>';
        };
        leaderHtml += '</table>'
        $('#leaderboard').html(leaderHtml)
        $('#leaderboard table').attr('id', 'players');

    }
    
};

var newDrawer = function() {
    socket.emit('new drawer', user);
    clearScreen();
    $('#guesses').empty();
};

var correctAnswer = function(data) {
    $('#guesses').html('<p>' + data.username + ' guessed correctly!' + '</p>');

    var sortedUsers = Object.entries(data.userPoints).sort((a,b)=> b[1]-a[1]);
    var leaderHtml = ' <h3> ' + 'Leader Board' + '</h3>' ; 
    leaderHtml+= '<table > <tr> <th>'+  'Player' + '</th> <th>' + 'Score' + '</th> </tr>'
   
    for (var i = 0; i < sortedUsers.length; i++) {
        leaderHtml += '<tr> <td>' + sortedUsers[i][0] + ' </td> <td>' + sortedUsers[i][1] + '</td> </tr>';
    };
    leaderHtml += '</table>'
    $('#leaderboard').html(leaderHtml)
    $('#leaderboard > table').attr('id', 'players');
};

var reset = function(name) {
    clearScreen();
    $('#guesses').empty();
    console.log('New drawer: ' + name);
    $('#guesses').html('<p>' + name + ' is the new drawer' + '</p>');
};

var draw = function(obj) {
    context.fillStyle = obj.color;
    context.beginPath();
    context.arc(obj.position.x, obj.position.y,
                     3, 0, 2 * Math.PI);
    context.fill();
};

var pictionary = function() {
    clearScreen();
    click = true;
    console.log('draw status: ' + click);
    $('#guess').hide();
    $('#guesses').empty();
    $('.draw').show();

    var drawing;
    var color;
    var obj = {};

    $('.draw-buttons').on('click', 'button', function(){
        obj.color = $(this).attr('value');
        console.log(obj.color);

        if (obj.color === '0') {
            socket.emit('clear screen', user);
            context.fillStyle = 'white';
            return;
        };
    });

    console.log('You are the drawer');

    $('.users').on('dblclick', 'li', function() {
        if (click == true) {
            clearInterval(Interval);
            resetCounter();
            var target = $(this).text();
            socket.emit('swap rooms', {from: user, to: target});
        };
    });

    canvas.on('mousedown', function(event) { 
        drawing = true;   
    });
    canvas.on('mouseup', function(event) {
        drawing = false;
    });

    canvas.on('mousemove', function(event) {
        var offset = canvas.offset();
        obj.position = {x: event.pageX - offset.left,
                        y: event.pageY - offset.top};
        
        if (drawing == true && click == true) {
            draw(obj);
            socket.emit('draw', obj);
        };
    });

};

$(document).ready(function() {

    canvas = $('#canvas');
    context = canvas[0].getContext('2d');
    canvas[0].width = canvas[0].offsetWidth;
    canvas[0].height = canvas[0].offsetHeight;

    usernameAsk();

    socket.on('userlist', userlist);
    socket.on('guesser', guesser);
    socket.on('guessword', guessword);
    socket.on('draw', draw);
    socket.on('draw word', drawWord);
    socket.on('drawer', pictionary);
    socket.on('new drawer', newDrawer);
    socket.on('correct answer', correctAnswer);
    socket.on('reset', reset);
    socket.on('clear screen', clearScreen);
    socket.on('show Completed', showCompleted);
    socket.on('reverse show Completed', reverseShowCompleted);
    socket.on('show guesses', showGuessWord);

});