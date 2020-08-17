'use strict';

// dialogflow response

const response = (queryResult) => {
    const displayName = queryResult.intent.displayName;

    switch (displayName) {
        case 'Game':
            const gameName = queryResult.parameters.game;

            switch (gameName) {
                case 'おみくじ':
                    const kuji = omikuji();
                    return `${kuji}を引きました！`;

                default:
                    return `なんのゲームか分かりませんでした...`;
            }

        default:
            return `APIサーバ「${queryResult.queryText} 」`;
    }
}
exports.response = response;

const kujis = ['大吉', '中吉', '小吉', '吉'];
const omikuji = () => {
    const kuji = kujis[Math.floor(Math.random() * kujis.length)];
    return kuji;
}
