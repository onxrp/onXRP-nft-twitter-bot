import Twit from "twit";
import { Client, SubscribeRequest } from "xrpl";

import { tokenCreateOfferHandler } from "./handlers/tokenCreateOfferHandler";
import { tokenMintHandler } from "./handlers/tokenMintHandler";
import { tokenAcceptOfferHandler } from "./handlers/tokenAcceptOfferHandler";
import { AccessToken, AccessTokenSecret, ApiKey, ApiKeySecret, XrpServer } from "./configuration";
import { log } from "./utils/logger";
import { ValidTransactions } from "./constants";

export async function runApplication() {
    log("Started listening for XRP transactions!");

    const twit = new Twit({
        consumer_key: ApiKey,
        consumer_secret: ApiKeySecret,
        access_token: AccessToken,
        access_token_secret: AccessTokenSecret,
    });

    const client = new Client(XrpServer);
    await client.connect();

    log(`Successfully connected to XRP server ${XrpServer}!`);

    const subscribe: SubscribeRequest = {
        id: "Check all transactions in XRP",
        command: "subscribe",
        streams: ["transactions"],
    }

    await client.request(subscribe);

    log("Subscribed for updates from XRP!");

    client.on("transaction", async tx => {
        const transactionType = tx?.transaction?.TransactionType;
        if (transactionType != null && ValidTransactions.indexOf(transactionType) >= 0) {
            log(`Received update for transaction ${transactionType}`);

            switch (transactionType) {
                case "NFTokenMint":
                    await tokenMintHandler(tx, twit);
                    break;
                case "NFTokenCreateOffer":
                    await tokenCreateOfferHandler(tx, twit);
                    break;
                case "NFTokenAcceptOffer":
                    await tokenAcceptOfferHandler(tx, twit);
                    break;
            }

            log(`Processed update for transaction ${transactionType}`);
        }
    });
};