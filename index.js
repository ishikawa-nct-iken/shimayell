'use strict';

// shimayell

// .envファイルの値を環境変数として使えるようにする
require('dotenv').config();

// Webアプリケーションを作成するためのすごいもの
const express = require('express');
const app = express();
// publicフォルダを静的ファイルとする
app.use(express.static('public'));

// HTMLのformに入力された値を受け取れるようにするもの
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true,
}));
app.use(bodyParser.json());

// ファイルの操作をするもの
const fs = require('fs');

// DialogflowからのWebhookのレスポンス
const dialogflowResponse = require('./dialogflowResponse');

// Dialogflowへのリクエスト
const dialogflowRequest = require('./dialogflowRequest');

// テキストを音声にしてくれるAPI
const VoiceText = require('./voicetext');
const voicetext = new VoiceText(process.env.VOICE_TEXT_API_KEY);

// ベーシック認証
const auth = require('./auth');

// ポート
const PORT = process.env.PORT;

// index.jsを表示
app.get('/', async (req, res) => {
    res.render('index.ejs');
});

// '/dialogflow-webhook'にベーシック認証を追加する
app.use('/dialogflow-webhook', auth);
// DialogflowからのWebhookを受け取る
app.post('/dialogflow-webhook', async (req, res) => {
    // 解析結果
    const queryResult = req.body.queryResult;

    let data = {
        'fulfillmentText': dialogflowResponse.response(queryResult),
    };

    res.status(200).send(JSON.stringify(data));
});

// シマエーるのページ
app.get('/shimayell', async (req, res) => {
    res.render('shimayell.ejs');
});

// ブラウザ版シマエーるからDialogflowへ構文解析リクエストする
app.post('/shimayell/send-text', async (req, res) => {
    // 解析依頼をするメッセージ
    const query = req.body.message;

    // メッセージの応答
    const fulfillmentText = (await dialogflowRequest.executeQuery(query)).fulfillmentText;

    console.log(fulfillmentText);

    res.status(200).send(fulfillmentText);
});

// テキストを音声し，そのパスを返す
app.post('/shimayell/get-voice', (req, res) => {
    // 喋るメッセージ
    const voiceMessage = req.body.message;
    console.log(`voiceMessage = ${voiceMessage}`);
    // 喋る人の名
    const voiceSpeaker = req.body.speaker;
    console.log(`voiceSpeaker = ${voiceSpeaker}`);

    // ファイルの名前
    const voicename = `${voiceSpeaker}_${voiceMessage}.wav`;
    // ファイルのパス
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

// ページが存在しないとき
app.use(async (req, res, next) => {
    res.status(404);
    res.render('err404.ejs');
});

// サーバエラー
app.use(async (err, req, res, next) => {
    res.status(500);
    res.render('err500.ejs');
    console.log(err);
});

// サーバの起動
app.listen(PORT, async (req, res) => {
    console.log('Server is up!');

    // Dialogflowへのリクエスト用のKeyFileを作成する
    dialogflowRequest.makeKeyJsonFile();
});
