import { Client as XrplClient } from "xrpl";

import { tokenCreateOfferHandler } from "./handlers/tokenCreateOfferHandler";
import { tokenMintHandler } from "./handlers/tokenMintHandler";
import { tokenAcceptOfferHandler } from "./handlers/tokenAcceptOfferHandler";
import { XrpServer } from "./configuration";
import { log } from "./utils/logger";
import { ValidTransactions } from "./constants";
import { TwitterApiV2Client } from "./utils/twitterClient";

//////// new Discord  ///////
import { tokenCreateOfferHandlerDiscord } from "./handlers/tokenCreateOfferHandlerDiscord";
import { tokenMintHandlerDiscord } from "./handlers/tokenMintHandlerDiscord";
import { tokenAcceptOfferHandlerDiscord } from "./handlers/tokenAcceptOfferHandlerDiscord";
import { Client as DiscordClient, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } from "discord.js";
////////


let intervalTimer: NodeJS.Timer;
let checkNumber = 0;
let subscribeInterval = 600000; // 10 minutes

function getSubsribeMessage(subscriptionNumber: number) {
    return `Check all transactions in XRP №${subscriptionNumber++}`;
}

export async function runApplication() {
    try {
        log("Started listening for XRP transactions!");

        const xrplClient = new XrplClient(XrpServer);
        await xrplClient.connect();

        const twitterClient = new TwitterApiV2Client();

        const discordClient = new DiscordClient({ intents: [GatewayIntentBits.Guilds] });
        await discordClient.login(process.env.DISCORD_BOT_TOKEN);

        log(`Successfully connected to XRP server ${XrpServer}!`);
        log("Starting interval to subscribe for XRP events!");

        // now get the price first one time
/*         const getUSDXrpPrice = async () => {
            let xrpPrice = 0;
            try {
                const xrpPriceData = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd");
                xrpPrice = JSON.parse(xrpPriceData.data.ripple.usd);
            } catch (err) {
                console.error("Coingecko API error, using CMC", err);
                const response = await axios.get(`https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?slug=xrp&convert=usd`, {
                    headers: {
                        "X-CMC_PRO_API_KEY": CMC_API_KEY,
                    },
                });
                if (response?.data?.data) {
                    const cmcData = response?.data?.data["52"]; //xrp
                    if (cmcData.quote["USD"]) xrpPrice = cmcData.quote["USD"].price;
                }
            }
 
            return xrpPrice
        };

        const price = await getUSDXrpPrice();
        if (price) {
            log("Getting global price Done!");
        } */

        async function subscribe() {
            if (checkNumber > 0) {
                log(`Unsubscribing for updates from XRP! #${checkNumber}`);
                await xrplClient.request({
                    id: getSubsribeMessage(checkNumber),
                    command: "unsubscribe",
                    streams: ["transactions"],
                });
            }
            log(`Subscribing for updates from XRP! #${checkNumber + 1}`);
            await xrplClient.request({
                id: getSubsribeMessage(checkNumber++),
                command: "subscribe",
                streams: ["transactions"],
            });
        }

        await subscribe();
        intervalTimer = setInterval(subscribe, subscribeInterval);

        xrplClient.on("transaction", async tx => {
            const transactionType = tx?.transaction?.TransactionType;
            if (transactionType != null && ValidTransactions.indexOf(transactionType) >= 0) {
                log(`Received update for transaction ${transactionType}`);
                log(`TX ${tx.transaction.hash}`);

                switch (transactionType) {
                    case "NFTokenMint":
                        await tokenMintHandler(tx, twitterClient);
                        await tokenMintHandlerDiscord(tx,  discordClient)
                        break;
                    case "NFTokenCreateOffer":
                        await tokenCreateOfferHandler(tx, twitterClient);
                        await tokenCreateOfferHandlerDiscord(tx, discordClient);
                        break;
                    case "NFTokenAcceptOffer":
                        await tokenAcceptOfferHandler(tx, twitterClient);
                        await tokenAcceptOfferHandlerDiscord(tx, discordClient);
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
        console.log("Error occured while running application: ", err);
        console.log("Restarting application");
        runApplication();
    }
};