import { NFTokenCreateOffer, parseNFTokenID, TransactionStream } from "xrpl";

import { TokenIssuer } from "../configuration";
import { log } from "../utils/logger";
import { TweetFormatter } from "../utils/tweetFormatter";
import { getNftInfo, uploadUriToTwitterMedia } from "../utils/helpers";
import { TwitterClient } from "../utils/twitterClient";

export async function tokenCreateOfferHandler(tx: TransactionStream, twitterClient: TwitterClient) {
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

    const mediaId = await uploadUriToTwitterMedia(nftInfo.image, twitterClient);

    if (mediaId == null) {
        log(`Uploaded media id for image url ${nftInfo.image} and token id ${nftId} is null. Probably something went wrong!`);
        return;
    }

    await twitterClient.tweet(TweetFormatter.getCreateOfferMessage(account, transaction.Amount, nftId, nftsIssuer), mediaId);

    log(`Successfully posted new tweet for token ${nftId} with updates!`);
}