import { Client } from "xrpl";
import { tokenCreateOfferHandler,} from "./handlers/tokenCreateOfferHandler";
import { tokenMintHandler } from "./handlers/tokenMintHandler";
import { tokenAcceptOfferHandler } from "./handlers/tokenAcceptOfferHandler";
import { XrpServer, TwitterAccounts, issuerCollectionMapping, validTokenIssuers } from "./configuration"; // Import once
import { log } from "./utils/logger";
import { ValidTransactions } from "./constants";
import { TwitterApiV2Client } from "./utils/twitterClient";
import { DiscordClient } from './utils/discordClient';



let intervalTimer: NodeJS.Timer;
let checkNumber = 0;
let subscribeInterval = 600000; // 10 minutes

function getSubscribeMessage(subscriptionNumber: number) {
    return `Check all transactions in XRP №${subscriptionNumber++}`;
}

export async function runApplication() {
    try {
        log("Started listening for XRP transactions!");

        const client = new Client(XrpServer);
        await client.connect();
        // Initialize Discord Client
        const discordClient = new DiscordClient();
        await discordClient.initialize(process.env.DISCORD_BOT_TOKEN as string);

        // Twitter clients for all accounts
        const twitterClients = TwitterAccounts.map(account =>
            new TwitterApiV2Client({
                appKey: account.apiKey,
                appSecret: account.apiKeySecret,
                accessToken: account.accessToken,
                accessSecret: account.accessTokenSecret,
            })
        );

        log(`Successfully connected to XRP server ${XrpServer}!`);
        log("Starting interval to subscribe for XRP events!");

        async function subscribe() {
            if (checkNumber > 0) {
                log(`Unsubscribing for updates from XRP! #${checkNumber}`);
                await client.request({
                    id: getSubscribeMessage(checkNumber),
                    command: "unsubscribe",
                    streams: ["transactions"],
                });
            }
            log(`Subscribing for updates from XRP! #${checkNumber + 1}`);
            await client.request({
                id: getSubscribeMessage(checkNumber++),
                command: "subscribe",
                streams: ["transactions"],
            });
        }

        await subscribe();
        intervalTimer = setInterval(subscribe, subscribeInterval);

        client.on("transaction", async tx => {
            const transactionType = tx?.transaction?.TransactionType;
        
            if (transactionType && ValidTransactions.indexOf(transactionType) >= 0) {
                log(`Received update for transaction ${transactionType}`);
                log(`TX ${tx.transaction.hash}`);
                
                switch (transactionType) {
                    case "NFTokenAcceptOffer":
                    await tokenAcceptOfferHandler(tx, twitterClients, discordClient);
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
       
        console.log("Error occurred while running application: ", err);
        console.log("Restarting application");
        runApplication();
    }
}