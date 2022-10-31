import { NFTokenMint, parseNFTokenID, TransactionStream } from "xrpl";
import lodash from "lodash";

import { TokenIssuer } from "../configuration";
import { log } from "../utils/logger";
import { TweetFormatter } from "../utils/tweetFormatter";
import { TwitterClient } from "../utils/twitterClient";

export async function tokenMintHandler(tx: TransactionStream, twitterClient: TwitterClient) {
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

    await twitterClient.tweet(TweetFormatter.getMintMessage(account, nftId), uri)

    log(`Successfully posted new tweet for token ${nftId} with updates!`);
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
