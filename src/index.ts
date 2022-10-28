require('dotenv').config();

import axios from "axios";
import Twit from "twit";
import { Client, SubscribeRequest, convertHexToString, parseNFTokenID } from "xrpl";
import { IssuedCurrencyAmount } from "xrpl/dist/npm/models/common";

const validTransactions = ["NFTokenMint", "NFTokenCreateOffer", "NFTokenAcceptOffer"];
const xrpServer = process.env.XRP_SERVER || "wss://xrplcluster.com";

async function startCheckingForTransactions() {
    console.log("Started listening for XRP transactions!");

    const twit = new Twit({
        consumer_key: process.env.API_KEY as string,
        consumer_secret: process.env.API_KEY_SECRET as string,
        access_token: process.env.ACCESS_TOKEN as string,
        access_token_secret: process.env.ACCESS_TOKEN_SECRET as string,
    });

    const client = new Client(xrpServer);
    await client.connect();

    console.log(`Successfully connected to XRP server ${xrpServer}!`);

    const subscribe: SubscribeRequest = {
        id: "Check all transactions in XRP",
        command: "subscribe",
        streams: ["transactions"],
    }

    await client.request(subscribe);

    console.log("Subscribed for updates from XRP!");

    client.on("transaction", async tx => {
        const transactionType = tx?.transaction?.TransactionType;
        if (transactionType != null && validTransactions.indexOf(transactionType) >= 0) {
            console.log(`Received update for transaction ${transactionType}`);

            switch (transactionType) {
                case "NFTokenMint":
                    const uri = tx?.transaction?.URI;
                    if (uri != null) {
                        const imageAddress = convertHexToString(uri);
                        const imageUrl = `${process.env.IPFS_URL}/${imageAddress.substring(7)}`;
                        const imageFileResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                        const imageBase64 = Buffer.from(imageFileResponse.data, 'binary').toString('base64');

                        const uploadResponse = await twit.post("media/upload", {
                            media_data: imageBase64,
                        });

                        const mediaId = (uploadResponse.data as any)?.media_id_string;
                        const affectedNodeWithNftId = tx.meta?.AffectedNodes.find((an: any) => an.ModifiedNode?.FinalFields?.NFTokens != null);
                        const nftId = (affectedNodeWithNftId as any)?.ModifiedNode?.FinalFields?.NFTokens[0]?.NFToken?.NFTokenID;
                        const account = tx?.transaction?.Account;

                        if (mediaId != null && nftId != null && account != null) {
                            await twit.post("statuses/update", {
                                status: `${account} minted NFT with ID ${nftId}!`,
                                media_ids: mediaId,
                            });

                            console.log("Posted new tweet with updates!");
                        }
                    }
                    break;
                case "NFTokenCreateOffer":
                    const transaction = tx?.transaction;

                    if (transaction != null) {
                        const offerAmount = transaction.Amount;
                        let formattedAmount = null;

                        if ((offerAmount as IssuedCurrencyAmount).value != null) {
                            formattedAmount = `${(offerAmount as IssuedCurrencyAmount).value}${(offerAmount as IssuedCurrencyAmount).currency}`;
                        } else {
                            formattedAmount = `${+offerAmount / 1000000}XRP`;
                        }

                        const nftTokenId = transaction.NFTokenID;
                        const { Issuer } = parseNFTokenID(nftTokenId);
                        const account = transaction.Account;

                        await twit.post("statuses/update", {
                            status: `${account} wants to buy NFT ${nftTokenId} for ${formattedAmount} from issuer ${Issuer}!`,
                        });

                        console.log("Posted new tweet with updates!");
                    }

                    break;
                default:
                    console.log(JSON.stringify(tx));
                    break;
            }
        }
    });
};

startCheckingForTransactions()
    .catch(err => {
        console.log(err.toString());
        console.log("Program stopped executing!");
    });