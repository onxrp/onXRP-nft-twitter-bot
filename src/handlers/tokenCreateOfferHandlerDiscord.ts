import { NFTokenCreateOffer, parseNFTokenID, TransactionStream } from "xrpl";

import { TokenIssuer } from "../configuration";
import { log } from "../utils/logger";
import { DiscordFormatter } from "../utils/discordFormatter";
import { getNftInfo } from "../utils/helpers";
import { Client as DiscordClient, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } from 'discord.js';

const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const ROLE_ID = "1156637040746692678";

export async function tokenCreateOfferHandlerDiscord(tx: TransactionStream, discordClient: DiscordClient) {
    const transaction = tx.transaction as NFTokenCreateOffer;

    if (transaction == null) {
        log("Transaction is null!");
        return;
    }

    const nftId = transaction.NFTokenID;
    const { Issuer: nftsIssuer } = parseNFTokenID(nftId);

    if (TokenIssuer !== nftsIssuer) {
        log(`Issuer is different for token ${nftId} from required (required: ${TokenIssuer}, actual: ${nftsIssuer}). Skipping updates!`);
        return;
    }

    const account = transaction.Account;

    if (account === nftsIssuer) {
        log(`Account ${account} and issuer ${nftsIssuer} are same!. Skipping updates!`);
        return;
    }

    const nftInfo = await getNftInfo(nftId);

    if (nftInfo == null) {
        log(`Nft info for token ${nftId} is null. Probably something went wrong!`);
        return;
    }

    const message = DiscordFormatter.getCreateOfferMessage(account, transaction.Amount, nftId, nftsIssuer);
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
    .setAuthor({ name: 'XPUNKS Offer (@XRPLPUNKSBOT)', iconURL: 'https://nftimg.onxrp.com/bradleypunkhouse_blackwhite.jpg', url: 'https://twitter.com/XRPLPUNKSBOT' })
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

log(`Successfully posted token ${nftId} create offer update on Discord!`);
}