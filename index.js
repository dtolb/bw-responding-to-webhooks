/* Requirements */
const Bandwidth  = require('node-bandwidth');
const express    = require('express');
const bodyParser = require('body-parser');
let app          = express();
const http       = require('http').Server(app);
const urlJoin    = require('url-join');
let io = require('socket.io')(http);

/* Paths */
const INCOMING_CALL    = '/incoming-call-endpoint';
const INCOMING_MESSAGE = '/incoming-message-endpoint';
const ANSWERED_CALL    = '/answered-call-endpoint';
const OUTGOING_CALL    = '/outbound-call-endpoint';
const OUTGOING_MESSAGE = '/outbound-message-endpoint';

const bw = new Bandwidth({
    // uses my environment variables
    userId    : process.env.BANDWIDTH_USER_ID,
    apiToken  : process.env.BANDWIDTH_API_TOKEN,
    apiSecret : process.env.BANDWIDTH_API_SECRET
});

/* Event Handlers */
const handleIncomingCall    = (req, res) => {
    /**
     * Everything is async, so we just reply with something. So long
     * as it's 2**. Once we reply to the callback, we can't then update
     * that call to answer or reject it the call.
     */
    res.sendStatus(200);
    const event = req.body;
    const callbackUrl = `http://${req.hostname}${ANSWERED_CALL}`;
    print('Incoming Call', event);
    const answerCallPayload = {
        state       : 'active',
        callbackUrl : callbackUrl
    }
    bw.Call.update(event.callId, answerCallPayload)
    .then( res => {
        print('Sent Call Answer Payload', res)
    })
    .catch( err => {
        print('Error Updating Call', err);
    });


};

const handleAnsweredCall    = (req, res) => {};


const handleIncomingMessage = async (req, res) => {
    res.sendStatus(200);
    const payload = req.body;
    io.emit('inboundEvent', JSON.stringify(payload));
    print('incoming message',payload);
    const baseUrl = `http://${req.hostname}`; // same as doing 'http://' + req.hostname
    const messagePayload = {
        to               : payload.from,
        from             : payload.to,
        text             : 'More callbacks forever 👍',
        receiptRequested : 'all',
        callbackUrl      : urlJoin(baseUrl,OUTGOING_MESSAGE)
    }
    try {
        const myMessage = await bw.Message.send(messagePayload);
        console.log(`Sent new message with id: ${myMessage.id}`)
    }
    catch (e) {
        console.log('Error sending message');
        console.log(e);
    }
};

const handleOutboundCall    = (req, res) => {};
const handleOutboundMessage = (req, res) => {
    res.sendStatus(200);
    const payload = req.body;
    print('Outbound message status update', payload);
    io.emit('outboundEvent', JSON.stringify(payload));
};

const print = (title, data) => {
    console.log(`----------------------<${title}>----------------------`);
    console.log(data);
    console.log(`----------------------</${title}>---------------------`);
}

/* Express Setup */
app.use(bodyParser.json());
app.set('port', (process.env.PORT || 3000));

app.use('/', express.static('public'))
app.post(INCOMING_CALL,    handleIncomingCall);
app.post(ANSWERED_CALL,    handleAnsweredCall);
app.post(OUTGOING_CALL,    handleOutboundCall);
app.post(INCOMING_MESSAGE, handleIncomingMessage);
app.post(OUTGOING_MESSAGE, handleOutboundMessage);


http.listen(app.get('port'), function(){
    //once done loadin then do this (callback)
    console.log('listening on *:' + app.get('port'));
});
