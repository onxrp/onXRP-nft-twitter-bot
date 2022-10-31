import { Client, SubscribeRequest } from "xrpl";

import { tokenCreateOfferHandler } from "./handlers/tokenCreateOfferHandler";
import { tokenMintHandler } from "./handlers/tokenMintHandler";
import { tokenAcceptOfferHandler } from "./handlers/tokenAcceptOfferHandler";
import { XrpServer } from "./configuration";
import { log } from "./utils/logger";
import { ValidTransactions } from "./constants";
import { TwitJsClient, TwitterApiV2Client } from "./utils/twitterClient";

export async function runApplication() {
    log("Started listening for XRP transactions!");

    const client = new Client(XrpServer);
    await client.connect();
    
    // const twitterClient = new TwitJsClient();
    const twitterClient = new TwitterApiV2Client();

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
};