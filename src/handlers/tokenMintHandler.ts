import Twit from "twit";
import { NFTokenMint, parseNFTokenID, TransactionStream } from "xrpl";
import lodash from "lodash";

import { TokenIssuer } from "../configuration";
import { log } from "../utils/logger";
import { TweetFormatter } from "../utils/tweetFormatter";
import { uploadUriToTwitterMedia } from "../utils/helpers";

export async function tokenMintHandler(tx: TransactionStream, twit: Twit) {
    const transaction = tx.transaction as NFTokenMint;
    const uri = transaction.URI;

    if (uri == null) {
        log("Nft's image uri is null!")
        return;
    }

    const mediaId = await uploadUriToTwitterMedia(uri, twit);

    if (mediaId == null) {
        log("Uploaded media id is null. Probably something went wrong!");
        return;
    }

    const nftId = getNftIdFromTransaction(tx, uri);

    if (nftId == null) {
        log("Nft id from transaction is null!");
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

    await twit.post("statuses/update", TweetFormatter.getMintMessage(account, nftId, mediaId));

    log("Successfully posted new tweet with updates!");
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
