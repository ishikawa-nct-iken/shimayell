'use strict';

// shimayell

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');

const dialogflowResponse = require('./dialogflowResponse');
const dialogflowRequest = require('./dialogflowRequest');
const VoiceText = require('./voicetext');
const auth = require('./auth');

app.use(bodyParser.urlencoded({
    extended: true,
}));
app.use(bodyParser.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 8000;

const voicetext = new VoiceText(process.env.VOICE_TEXT_API_KEY);

app.get('/', async (req, res) => {
    res.render('index.ejs');
});

app.use('/dialogflow-webhook', auth);
app.post('/dialogflow-webhook', async (req, res) => {
    const queryResult = req.body.queryResult;

    let data = {
        'fulfillmentText': dialogflowResponse.response(queryResult),
    };

    res.status(200).send(JSON.stringify(data));
});

app.get('/shimayell', async (req, res) => {
    res.render('shimayell.ejs');
});

app.post('/shimayell/send-text', async (req, res) => {
    const query = req.body.message;

    const fulfillmentText = (await dialogflowRequest.executeQuery(query)).fulfillmentText;

    console.log(fulfillmentText);

    res.status(200).send(fulfillmentText);
});

app.post('/shimayell/get-voice', (req, res) => {
    const voiceMessage = req.body.message;
    console.log(`voiceMessage = ${voiceMessage}`);
    const voiceSpeaker = req.body.speaker;
    console.log(`voiceSpeaker = ${voiceSpeaker}`);

    //const voiceid = uuid.v4();
    const voicename = `${voiceSpeaker}_${voiceMessage}.wav`;
    const voicepath = `voices/${voicename}`;

    fs.stat(`./public/${voicepath}`, (err) => {
        if (err) {

            voicetext
                .speaker(voiceSpeaker)
                .speak(voiceMessage, (e, buf) => {

                    if (e) {
                        console.error(e);
                        res.status(500).end();
                    } else {
                        fs.writeFile(`./public/${voicepath}`, buf, 'binary', (e) => {
                            if (e) {
                                console.error(e);
                                res.status(500).end();
                            } else {
                                console.log(`Maked ${voicepath}`);
                                res.status(200).send(voicepath).end();
                            }
                        });
                    }

                });

        } else {
            res.status(200).send(voicepath).end();
        }
    });
});

app.use(async (req, res, next) => {
    res.status(404);
    res.render('err404.ejs');
});

app.use(async (err, req, res, next) => {
    res.status(500);
    res.render('err500.ejs');
    console.log(err);
});

app.listen(PORT, async (req, res) => {
    console.log('Server is up!');

    dialogflowRequest.makeKeyJsonFile();
});
