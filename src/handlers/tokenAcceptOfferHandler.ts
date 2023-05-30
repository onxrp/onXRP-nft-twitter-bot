import { NFTokenAcceptOffer, parseNFTokenID, TransactionStream } from "xrpl";

import { log } from "../utils/logger";
import { TokenIssuer } from "../configuration";
import { TweetFormatter } from "../utils/tweetFormatter";
import { checkAmountValidity, getCoinPrice, getNftInfo } from "../utils/helpers";
import { TwitterClient } from "../utils/twitterClient";
import { parseAcceptOfferTx } from "../utils/txUtils";

export async function tokenAcceptOfferHandler(tx: TransactionStream, twitterClient: TwitterClient) {
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
    await twitterClient.tweet(TweetFormatter.getTokenAcceptOfferMessage(newOwner, amount, nftId, previousOwner, nftInfo.nftName, usdPrice), nftInfo.image);

    log(`Successfully posted new tweet for token ${nftId} with updates!`);
}