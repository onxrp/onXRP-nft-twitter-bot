import Twit from "twit";
import { NFTokenCreateOffer, parseNFTokenID, TransactionStream } from "xrpl";
import { IssuedCurrencyAmount } from "xrpl/dist/npm/models/common";

import { TokenIssuer } from "../configuration";
import { log } from "../utils/logger";
import { TweetFormatter } from "../utils/tweetFormatter";

export async function tokenCreateOfferHandler(tx: TransactionStream, twit: Twit) {
    const transaction = tx.transaction as NFTokenCreateOffer;

    if (transaction == null) {
        log("Transaction is null!");
        return;
    }

    const offerAmount = transaction.Amount;
    let formattedAmount = null;

    if ((offerAmount as IssuedCurrencyAmount).value != null) {
        formattedAmount = `${(offerAmount as IssuedCurrencyAmount).value}${(offerAmount as IssuedCurrencyAmount).currency}`;
    } else {
        formattedAmount = `${+offerAmount / 1000000}XRP`;
    }

    const nftId = transaction.NFTokenID;
    const { Issuer: nftsIssuer } = parseNFTokenID(nftId);

    if (TokenIssuer !== nftsIssuer) {
        log(`Issuer is different from required (required: ${TokenIssuer}, actual: ${nftsIssuer}). Skipping updates!`)
        return;
    }

    const account = transaction.Account;

    await twit.post("statuses/update", TweetFormatter.getCreateOfferMessage(account, formattedAmount, nftId, nftsIssuer));

    log("Successfully posted new tweet with updates!");
}