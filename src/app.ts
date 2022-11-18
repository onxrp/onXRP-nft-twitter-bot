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
let subscribeInterval = 600000; // 10 minutes

function getSubsribeMessage(subscriptionNumber: number) {
    return `Check all transactions in XRP №${subscriptionNumber++}`;
}

export async function runApplication() {
    try {
        log("Started listening for XRP transactions!");

        const client = new Client(XrpServer);
        await client.connect();

        const twitterClient = new TwitterApiV2Client();

        log(`Successfully connected to XRP server ${XrpServer}!`);
        log("Starting interval to subscribe for XRP events!");

        async function subscribe() {
            if (checkNumber > 0) {
                log(`Unsubscribing for updates from XRP! #${checkNumber}`);
                await client.request({
                    id: getSubsribeMessage(checkNumber),
                    command: "unsubscribe",
                    streams: ["transactions"],
                });
            }
            log(`Subscribing for updates from XRP! #${checkNumber + 1}`);
            await client.request({
                id: getSubsribeMessage(checkNumber++),
                command: "subscribe",
                streams: ["transactions"],
            });
        }

        await subscribe();
        intervalTimer = setInterval(subscribe, subscribeInterval);

        client.on("transaction", async tx => {
            const transactionType = tx?.transaction?.TransactionType;
            if (transactionType != null && ValidTransactions.indexOf(transactionType) >= 0) {
                log(`Received update for transaction ${transactionType}`);
                log(`TX ${tx.transaction.hash}`);

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