require('dotenv').config();

import Twit from "twit";

async function test() {
    const twit = new Twit({
        consumer_key: process.env.API_KEY as string,
        consumer_secret: process.env.API_KEY_SECRET as string,
        access_token: process.env.ACCESS_TOKEN as string,
        access_token_secret: process.env.ACCESS_TOKEN_SECRET as string,
    });

    await twit.post("statuses/update", {
        status: "test"
    });
};

test();