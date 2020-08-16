
const xhr = new XMLHttpRequest();

const rec = new webkitSpeechRecognition();
rec.continuous = false;
rec.interimResults = false;
rec.lang = 'ja-JP';

let useSpeechRecognition = false;

rec.onresult = (e) => {
    console.log('on result');
    rec.stop();

    for (var i = e.resultIndex; i < e.results.length; i++) {
        if (!e.results[i].isFinal) continue;

        const { transcript } = e.results[i][0];
        console.log(`Recognised: ${transcript}`);
        sendMessageToDialogflow(transcript);
    }
};

rec.onstart = () => { console.log('on start'); };
rec.onend = () => {
    console.log('on end');
    if (useSpeechRecognition)
        rec.start();
};

rec.onspeechstart = () => { console.log('on speech start'); };
rec.onspeechend = () => { rec.stop(); console.log('on speech end'); };

rec.onosundstart = () => { console.log('on sound start'); };
rec.onsoundend = () => { console.log('on sound end'); };

rec.onaudiostart = () => { console.log('on audio start'); };
rec.onaudioend = () => { console.log('on audio end'); };

//rec.start();

window.onload = () => {
    document
        .getElementById('changingUseSpeechRecognitionButton')
        .addEventListener('click', changeUseSpeechRecognition);
};

const changeUseSpeechRecognition = () => {
    useSpeechRecognition ^= true;

    if (useSpeechRecognition) {
        rec.start();
        document
            .getElementById('changingUseSpeechRecognitionButton')
            .value = "音声認識 OFF にする";
    } else {
        rec.abort();
        document
            .getElementById('changingUseSpeechRecognitionButton')
            .value = "音声認識 ON にする";
    }
}

const Speech = (message) => {
    //const uttr = new SpeechSynthesisUtterance(message);
    //speechSynthesis.speak(uttr);

    const speakerForm = document.getElementById('speakerInputedForm');
    const speakerNumber = speakerForm.selectedIndex;
    const speakerValue = speakerForm.options[speakerNumber].value;

    const data = {
        message: message,
        speaker: speakerValue,
    };

    xhr.open('POST', '/shimayell/get-voice', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(EncodeHTMLForm(data));

    xhr.onload = () => {
        const audio = new Audio();
        audio.src = xhr.response;
        audio.play();
    };
}

const sendMessageToDialogflow = (message) => {
    //const message = document.getElementById('messageInputedForm').value;
    const data = {
        message: message,
    };

    const to = document.createElement('p');
    to.innerHTML = `client : ${message}`;
    document.getElementById('talks').appendChild(to);

    console.log(data);

    xhr.open('POST', '/shimayell/send-text', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(EncodeHTMLForm(data));

    const commentEl = document.getElementById('comment');

    xhr.onload = () => {
        commentEl.innerHTML = `Loaded: ${xhr.status} ${xhr.response}`;

        const from = document.createElement('p');
        from.innerHTML = `server : ${xhr.response}`;
        document.getElementById('talks').appendChild(from);

        Speech(xhr.response);
    };

    xhr.onerror = () => { // リクエストがまったく送信できなかったときにだけトリガーされます。
        commentEl.innerHTML = `Network Error`;
    };

    xhr.onprogress = (event) => { // 定期的にトリガーされます
        // event.loaded - ダウンロードされたバイト
        // event.lengthComputable = サーバが Content-Length ヘッダを送信した場合は true
        // event.total - トータルのバイト数(lengthComputable が true の場合)
        commentEl.innerHTML = `Received ${event.loaded} of ${event.total}`;
    };
};

const EncodeHTMLForm = (data) => {
    const params = [];

    for (const name in data) {
        const value = data[name];
        const param = encodeURIComponent(name) + '=' + encodeURIComponent(value);

        params.push(param);
    }

    return params.join('&').replace(/%20/g, '+');
}
