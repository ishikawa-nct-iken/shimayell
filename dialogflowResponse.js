'use strict';

// dialogflow response

const response = (queryResult) => {
    const displayName = queryResult.intent.displayName;

    switch (displayName) {
        default:
            return `APIサーバ「${queryResult.queryText} 」`;
    }
}
exports.response = response;
