import { NFTokenMint, parseNFTokenID, TransactionStream } from "xrpl";
import lodash from "lodash";

import { TokenIssuer } from "../configuration";
import { log } from "../utils/logger";
import { DiscordFormatter } from "../utils/discordFormatter";
import { Client as DiscordClient, GatewayIntentBits, EmbedBuilder, AttachmentBuilder } from 'discord.js';

const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const ROLE_ID = "1156637040746692678";

export async function tokenMintHandlerDiscord(tx: TransactionStream, discordClient: DiscordClient) {
    const transaction = tx.transaction as NFTokenMint;
    const uri = transaction.URI;

    if (uri == null) {
        log("Nft's image uri is null!")
        return;
    }

    const nftId = getNftIdFromTransaction(tx, uri);

    if (nftId == null) {
        log(`Nft id from transaction with image uri ${uri} is null!`);
        return;
    }

    const { Issuer: nftsIssuer } = parseNFTokenID(nftId);

    if (TokenIssuer !== nftsIssuer) {
        log(`Issuer is different from required (required: ${TokenIssuer}, actual: ${nftsIssuer}). Skipping updates!`)
        return;
    }

    const account = tx?.transaction?.Account;

    if (account == null) {
        log("Account address from transaction is null!");
        return;
    }

    const message = DiscordFormatter.getMintMessage(account, nftId)
    const imageUrl = uri;

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
    .setTitle(nftId ?? 'NFT Mint')
    .setURL(`https://nft.onxrp.com/nft/${nftId}`)
    .setDescription(message)
    .setColor("#ffffff")
    .setAuthor({ name: 'XPUNKS Offer (@XRPLPUNKSBOT)', iconURL: 'https://nftimg.onxrp.com/bradleypunkhouse_blackwhite.jpg', url: 'https://twitter.com/XRPLPUNKSBOT' })
    .setImage(imageUrl as string)
    .setFooter({
        text: `Powered by XPUNKS`,
        iconURL: "https://nftimg.onxrp.com/bradleypunkhouse_blackwhite.jpg",
    })

await channel.send({ 
    content: `<@&${ROLE_ID}>`,
    embeds: [embed] 
}).catch(log);

    log(`Successfully posted new Discord for token ${nftId} with updates!`);
}

function getNftIdFromTransaction(tx: TransactionStream, uri: string): string | undefined {
    const affectedNodes = tx.meta?.AffectedNodes;

    if (affectedNodes == null) {
        return;
    }

    const nftTokenPage: any = affectedNodes.find(an => (an as any).ModifiedNode?.LedgerEntryType === "NFTokenPage");

    if (nftTokenPage == null) {
        return;
    }

    const finalTokens: any[] = nftTokenPage.ModifiedNode.FinalFields.NFTokens;
    const previousTokens: any[] = nftTokenPage.ModifiedNode.PreviousFields.NFTokens;

    if (finalTokens == null || previousTokens == null) {
        return;
    }

    const newTokens = lodash.differenceBy(finalTokens, previousTokens, "NFToken.NFTokenID");

    return newTokens[0]?.NFToken?.NFTokenID;
}
