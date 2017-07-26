var Bandwidth = require("node-bandwidth");
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var http = require("http").Server(app);
//makes an express server

//saves cridentials but cant access 
var client = new Bandwidth({
    // uses my environment variables 
    userId    : process.env.BANDWIDTH_USER_ID, // <-- note, this is not the same as the username you used to login to the portal
    apiToken  : process.env.BANDWIDTH_API_TOKEN,
    apiSecret : process.env.BANDWIDTH_API_SECRET
});

app.use(bodyParser.json());
//use a json body parser
app.set('port', (process.env.PORT || 3000));
//set port to an environment variable port or 3000

//assign function to path 
app.get("/", function (req, res) {
    console.log(req); 
    res.send("Hello World");
    //res.send(can be a website);
});
//if post then immediately respond with a 200 request 
app.post("/message-callback", function(req, res){
    var body= req.body; 
    //let the other know you got the request and we will process it 
    res.sendStatus(200);
    if(body.direction === "in"){
        var numbers={
            to: body.from, 
            from: body.to
        }
        sendMessage(numbers);
    }

});

app.post("/call-callback", function(req, res){
    var body = req.body;
    res.sendStatus(200);
    if(body.eventType === "answer"){
        client.Call.speakSentence(body.callId, "Kitty Cats are Kitty Cats")
        .then(function () {
            console.log("speak sentence sent");
        })
        .catch(function(err){
            console.log(err); //swallowing the error so bad practice
        });

    }
    //hangs up call after sentence
    else if(body.eventType === "speak" && body.state === "PLAYBACK_STOP"){
       client.Call.hangup(body.callId)
       .then(function () {
        console.log("Hanging up call"); 
       })
       .catch(function(err){
         console.log("Error hangign up the call, it was probs already over");
         console.log(err);
       });

    }
    else{
        console.log(body);
    }
})

var messagePrinter= function (message){
    console.log('Using the message printer');
    console.log(message);
}

var sendMessage = function(params){
    client.Message.send({
        //retuns a promse 
        from : "+17204407441",
        to   : "+13035659555",
        text : "Who, me?",
        media: "https://img.memesuper.com/ce20eb4f1da26e98771cd1c17a2a5641_who-me-who-me-memes_632-651.png"
    })
    .then(function(message){
        messagePrinter(message);
        return client.Message.get(message.id)
        //access ID from json can also get to and from
    })
    .then(messagePrinter)
    // .then(function(myMessage){

    // })
    .catch(function(err){
        console.log(err)
    });
}

// var numbers = {
//     to: "+13035659555",
//     from: "+17204407441"
// };
// sendMessage(numbers);

http.listen(app.get('port'), function(){
    //once done loadin then do this (callback)
    console.log('listening on *:' + app.get('port'));
});


