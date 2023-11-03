import { NFTokenAcceptOffer, parseNFTokenID, TransactionStream } from "xrpl";
import { log } from "../utils/logger";
import { TokenIssuer, validTokenIssuers  } from "../configuration";
import { TweetFormatter } from "../utils/tweetFormatter";
import { checkAmountValidity, formatAmount, getCoinPrice, getNftInfo } from "../utils/helpers";
import { TwitterApiV2Client } from "../utils/twitterClient";
import { parseAcceptOfferTx } from "../utils/txUtils";
import { DiscordClient } from '../utils/discordClient'; 
import { EmbedBuilder } from 'discord.js';

import moment from "moment";



// Create a Discord client instance
const discordClientInstance = new DiscordClient();

// function to get the Twitter client  based on the NFT collection

function getTwitterClientIndex({ collectionName }: { collectionName: string; }): number | undefined {
    
    const collectionToIndexMap: { [key: string]: number } = {
        'Xpunks': 0,
        'Unixpunks': 1,
        'Eden-Properties': 2,
    };
    return collectionToIndexMap[collectionName];
}
// Map collection names to Discord role IDs
const collectionToRoleIdMap: { [key: string]: string } = {
    'Xpunks': process.env.DISCORD_XPUNKS_ROLE_ID as string,
    'Unixpunks': process.env.DISCORD_UNIXPUNKS_ROLE_ID as string,
    'Eden-Properties': process.env.DISCORD_EDEN_PROPERTIES_ROLE_ID as string,
};
function getDiscordRoleId({ collectionName }: { collectionName: string; }): string | undefined {
    return collectionToRoleIdMap[collectionName];
}
// Map collection names to Discord channel IDs
function getDiscordChannelId({ collectionName }: { collectionName: string; }): string | undefined {
    const collectionToChannelIdMap: { [key: string]: string } = {
        'Xpunks': process.env.DISCORD_XPUNKS_CHANNEL_ID as string,
        'Unixpunks': process.env.DISCORD_UNIXPUNKS_CHANNEL_ID as string,
        'Eden-Properties': process.env.DISCORD_EDEN_PROPERTIES_CHANNEL_ID as string,
    };
    return collectionToChannelIdMap[collectionName];
}

export async function tokenAcceptOfferHandler(tx: TransactionStream, twitterClients: TwitterApiV2Client[], discordClientInstance: DiscordClient) {
    
    const issuerCollectionMapping: { [key: string]: string } = {
        'rHEL3bM4RFsvF8kbQj3cya8YiDvjoEmxLq': 'Xpunks',
        'rhqfdeNZRx9sMHZb197gwA6dj11uDKv8RD': 'Unixpunks',
        'rMgcSs3HQjvy3ZM2FVsxqgUrudVPM7HP5m': 'Eden-Properties',

    };

    const transaction = tx.transaction as NFTokenAcceptOffer;
    
    if (transaction == null) {
        log("Transaction is null!");
        return;
    }

    const { previousOwner, newOwner, nftId, amount } = parseAcceptOfferTx({
        ...tx.transaction,
        meta: tx.meta,
    });

    if (nftId == null) {
        log("Nft id from transaction is null!");
        return;
    }

    const { Issuer: nftsIssuer } = parseNFTokenID(nftId);
    let nftCollection = issuerCollectionMapping[nftsIssuer];
    

    if (!validTokenIssuers.includes(nftsIssuer) || !nftCollection) {
        log(`Issuer is not valid for token ${nftId} (required: ${validTokenIssuers.join(", ")}, actual: ${nftsIssuer}). Skipping updates!`);
        return;
    }

    if (previousOwner == null || newOwner == null) {
        log("Account is null. Probably something went wrong!");
        return;
    }

    const nftInfo = await getNftInfo(nftId);

    if (nftInfo == null) {
        log(`Nft info for token id ${nftId} is null. Probably something went wrong!`);
        return;
    }

    if (!checkAmountValidity(amount)) {
        log(`Amount ${JSON.stringify(amount)} didn't pass checks (XRP should be more than 100, XPUNK token should be skipped)`);
        return;
    }

    const usdPrice = await getCoinPrice(amount);

  // Determine which Twitter client to use based on the NFT collection
const specificClientIndex = getTwitterClientIndex({ collectionName: nftCollection });

// Check if specificClientIndex is not undefined BEFORE trying to use it
if (specificClientIndex === undefined) {
    log(`No Twitter client index found for collection ${nftCollection}. Skipping tweet.`);
    return;
}

const specificTwitterClient = twitterClients[specificClientIndex];
    await specificTwitterClient.tweet(TweetFormatter.getTokenAcceptOfferMessage(newOwner, amount, nftId, previousOwner, nftInfo.nftName, usdPrice), nftInfo.image);

    const discordChannelId = getDiscordChannelId({ collectionName: nftCollection });
    const roleId = getDiscordRoleId({ collectionName: nftCollection });  // Fetching the Role ID based on collection name

    if (discordChannelId && roleId) {
        const embed = new EmbedBuilder()
            .setColor("#FFFFFF")
            .setTitle(nftInfo.nftName ?? 'NFT Transaction')
            .setURL(`https://nft.onxrp.com/nft/${nftInfo.token_id}`)
            .setAuthor({ 
                name: 'XPUNKS Sales (@XRPLPUNKSBOT)', 
                iconURL: 'https://nftimg.onxrp.com/bradleypunkhouse_blackwhite.jpg', 
                url: 'https://twitter.com/XRPLPUNKSBOT' 
            })
            .setFields([
                {
                    name: "Sold for",
                    value: `${nftId.formattedAmount}${nftId.formattedUsd}`,
                },
                {
                    name: "Seller",
                    value: `${nftId.formattedPreviousOwner}`,
                },
                {
                    name: "Buyer",
                    value: `${nftId.nftformattedAccount} `,
                },
                {
                    name: "Rank",
                    value: `${nftInfo.rarity_rank}`
                },
            ])
            .setImage(nftInfo.picture_url_thumbnail ?? `https://marketplace-api.onxrp.com/api/image/${nftInfo.token_id}`)
            .setTimestamp(moment(nftId.created_at).toDate())
            .setFooter({
                text: `Powered by XPUNKS`,
                iconURL: "https://nftimg.onxrp.com/bradleypunkhouse_blackwhite.jpg",
            });

        

            const channel = discordClientInstance.channels.cache.get(discordChannelId);
            if (channel && channel.isText()) {
                channel.send({
                    content: `<@&${roleId}>`,
                    embeds: [embed]
                });

        }
  

    log(`Successfully posted new tweet for token ${nftId.token_id} with updates!`);
    log(`Successfully posted token ${nftId} accept offer update on Discord!`);

}

}
