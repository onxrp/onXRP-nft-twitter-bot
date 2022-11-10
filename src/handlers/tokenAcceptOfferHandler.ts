import { getBalanceChanges, NFTokenAcceptOffer, parseNFTokenID, TransactionStream } from "xrpl";

import { log } from "../utils/logger";
import { TokenIssuer } from "../configuration";
import { TweetFormatter } from "../utils/tweetFormatter";
import { getNftInfo } from "../utils/helpers";
import { Amount } from "xrpl/dist/npm/models/common";
import { TwitterClient } from "../utils/twitterClient";

export async function tokenAcceptOfferHandler(tx: TransactionStream, twitterClient: TwitterClient) {
    const transaction = tx.transaction as NFTokenAcceptOffer;

    if (transaction == null) {
        log("Transaction is null!");
        return;
    }

    const nftId = getNftIdFromTransaction(tx);

    if (nftId == null) {
        log("Nft id from transaction is null!");
        return;
    }

    const { Issuer: nftsIssuer } = parseNFTokenID(nftId);

    if (TokenIssuer !== nftsIssuer) {
        log(`Issuer is different for token ${nftId} from required (required: ${TokenIssuer}, actual: ${nftsIssuer}). Skipping updates!`);
        return;
    }

    const account = getAccountFromTransaction(tx);

    if (account == null) {
        log("Account is null. Probably something went wrong!");
        return;
    }

    const nftInfo = await getNftInfo(nftId);

    if (nftInfo == null) {
        log(`Nft info for token id ${nftId} is null. Probably something went wrong!`);
        return;
    }

    const amount = getAmountFromTransaction(tx);

    await twitterClient.tweet(TweetFormatter.getTokenAcceptOfferMessage(account, amount, nftId, nftsIssuer, nftInfo.nftNumber), nftInfo.image);

    log(`Successfully posted new tweet for token ${nftId} with updates!`);
}

function getNftIdFromTransaction(tx: TransactionStream): string | undefined {
    const affectedNodeWithNftId = tx.meta?.AffectedNodes.find((an: any) => an.DeletedNode?.LedgerEntryType === "NFTokenOffer");
    const nftId = (affectedNodeWithNftId as any)?.DeletedNode?.FinalFields?.NFTokenID;
    return nftId;
}

function getAmountFromTransaction(tx: TransactionStream): Amount {
    const affectedNodeWithNftId = tx.meta?.AffectedNodes.find((an: any) => an.DeletedNode?.LedgerEntryType === "NFTokenOffer");
    const amount = (affectedNodeWithNftId as any)?.DeletedNode?.FinalFields?.Amount;
    return amount;
}

function getAccountFromTransaction(tx: TransactionStream): string | undefined {
    if (tx.meta == null) {
        return;
    }

    const balanceChanges = getBalanceChanges(tx.meta);
    const balanceChange = balanceChanges.find(bc => +bc.balances[0].value < 0);
    return balanceChange?.account;
}