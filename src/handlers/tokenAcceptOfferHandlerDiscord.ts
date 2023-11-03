import { NFTokenAcceptOffer, parseNFTokenID, TransactionStream } from "xrpl";

import { log } from "../utils/logger";
import { TokenIssuer } from "../configuration";
import { DiscordFormatter } from "../utils/discordFormatter";
import { checkAmountValidity, getCoinPrice, getNftInfo } from "../utils/helpers";
import { Client as DiscordClient, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { parseAcceptOfferTx } from "../utils/txUtils";

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const axios = require("axios");
const ROLE_ID = "1156637040746692678";

export async function tokenAcceptOfferHandlerDiscord(tx: TransactionStream, discordClient: DiscordClient) {
    const transaction = tx.transaction as NFTokenAcceptOffer;

    if (transaction == null) {
        log("Transaction is null!");
        return;
    }

    const { previousOwner, newOwner, nftId, amount } = parseAcceptOfferTx({
        ...tx.transaction,
        meta: tx.meta,
    })

    if (nftId == null) {
        log("Nft id from transaction is null!");
        return;
    }

    const { Issuer: nftsIssuer } = parseNFTokenID(nftId);

    if (TokenIssuer !== nftsIssuer) {
        log(`Issuer is different for token ${nftId} from required (required: ${TokenIssuer}, actual: ${nftsIssuer}). Skipping updates!`);
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

    const message = DiscordFormatter.getTokenAcceptOfferMessage(newOwner, amount, nftId, previousOwner, nftInfo.nftName, usdPrice);
    const imageUrl = nftInfo.image;

    const channel = await discordClient.channels.fetch(DISCORD_CHANNEL_ID as string).catch(log);
    if (!channel) {
        log('Channel not found or access is denied.');
        return;
    }
    if (!channel.isTextBased()) {
        log('The channel is not a text-based channel.');
        return;
    }
    
   const embed = new EmbedBuilder()
    .setTitle(nftInfo.nftName ?? 'NFT Transaction')
    .setURL(`https://nft.onxrp.com/nft/${nftId}`)
    .setDescription(message)
    .setColor("#ffffff")
    .setAuthor({ name: 'XPUNKS Sales (@XRPLPUNKSBOT)', iconURL: 'https://nftimg.onxrp.com/bradleypunkhouse_blackwhite.jpg', url: 'https://twitter.com/XRPLPUNKSBOT' })
    .setImage(imageUrl as string)
    .setFooter({
        text: `Powered by XPUNKS`,
        iconURL: "https://nftimg.onxrp.com/bradleypunkhouse_blackwhite.jpg",
    })
    .setFields([
        {
            name: "Rank",
            value: `${nftInfo.rarity_rank}`,
        },
    ])

await channel.send({ 
    content: `<@&${ROLE_ID}>`,
    embeds: [embed] 
}).catch(log);

log(`Successfully posted token ${nftId} accept offer update on Discord!`);

}



