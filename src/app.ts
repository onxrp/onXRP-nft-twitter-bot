import { Client, SubscribeRequest } from "xrpl";

import { tokenCreateOfferHandler } from "./handlers/tokenCreateOfferHandler";
import { tokenMintHandler } from "./handlers/tokenMintHandler";
import { tokenAcceptOfferHandler } from "./handlers/tokenAcceptOfferHandler";
import { XrpServer } from "./configuration";
import { log } from "./utils/logger";
import { ValidTransactions } from "./constants";
import { TwitterApiV2Client } from "./utils/twitterClient";

let intervalTimer: NodeJS.Timer;
let checkNumber = 0;

export async function runApplication() {
    try {
        log("Started listening for XRP transactions!");

        const client = new Client(XrpServer);
        await client.connect();

        const twitterClient = new TwitterApiV2Client();

        log(`Successfully connected to XRP server ${XrpServer}!`);
        log("Starting interval to subscribe for XRP events!");

        async function subscribe() {
            await client.request({
                id: `Check all transactions in XRP №${checkNumber++}`,
                command: "subscribe",
                streams: ["transactions"],
            });
            log("Subscribed for updates from XRP!");
        }

        await subscribe();
        intervalTimer = setInterval(subscribe, 600000); // 10 minutes

        client.on("transaction", async tx => {
            const transactionType = tx?.transaction?.TransactionType;
            if (transactionType != null && ValidTransactions.indexOf(transactionType) >= 0) {
                log(`Received update for transaction ${transactionType}`);
                log(`TX ${JSON.stringify(tx.transaction)}`);

                switch (transactionType) {
                    case "NFTokenMint":
                        await tokenMintHandler(tx, twitterClient);
                        break;
                    case "NFTokenCreateOffer":
                        await tokenCreateOfferHandler(tx, twitterClient);
                        break;
                    case "NFTokenAcceptOffer":
                        await tokenAcceptOfferHandler(tx, twitterClient);
                        break;
                }

                log(`Processed update for transaction ${transactionType}`);
            }
        });
    }
    catch (err) {
        if (intervalTimer != null) {
            clearInterval(intervalTimer);
        }
        throw err;
    }
};