import { NFTokenAcceptOffer, parseNFTokenID, TransactionStream } from "xrpl";
import { log } from "../utils/logger";
import { TokenIssuer, validTokenIssuers  } from "../configuration";
import { TweetFormatter } from "../utils/tweetFormatter";
import { checkAmountValidity, getCoinPrice, getNftInfo } from "../utils/helpers";
import { TwitterApiV2Client, TwitterClient } from "../utils/twitterClient";
import { parseAcceptOfferTx } from "../utils/txUtils";



// function to get the Twitter client  based on the NFT collection
function getTwitterClientIndex({ collectionName }: { collectionName: string; }): number | undefined {
    
    const collectionToIndexMap: { [key: string]: number } = {
        'Xpunks': 0,
        'Unixpunks': 1,
        'Eden-Properties': 2,
    };
    return collectionToIndexMap[collectionName];
}

export async function tokenAcceptOfferHandler(tx: TransactionStream, twitterClients: TwitterApiV2Client[]) {
    
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

log(`Successfully posted new tweet for token ${nftId} with updates!`);
}