import axios from "axios";
import Twit from "twit";
import { convertHexToString, NFTokenMint, parseNFTokenID, TransactionStream } from "xrpl";

import { IpfsUrl, TokenIssuer } from "../configuration";
import { log } from "../utils/logger";
import { TweetFormatter } from "../utils/tweetFormatter";

export async function tokenMintHandler(tx: TransactionStream, twit: Twit) {
    const transaction = tx.transaction as NFTokenMint;
    const uri = transaction.URI;

    if (uri == null) {
        log("Nft's image uri is null!")
        return;
    }

    const imageBase64 = await convertNftUriToBase64(uri);

    const uploadResponse = await twit.post("media/upload", {
        media_data: imageBase64,
    });

    const mediaId = (uploadResponse.data as any)?.media_id_string;

    if (mediaId == null) {
        log("Uploaded media id is null. Probably something went wrong!");
        return;
    }

    const nftId = getNftIdFromTransaction(tx);

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

function getNftIdFromTransaction(tx: TransactionStream): string | undefined {
    const affectedNodeWithNftId = tx.meta?.AffectedNodes.find((an: any) => an.ModifiedNode?.FinalFields?.NFTokens != null);
    const nftId = (affectedNodeWithNftId as any)?.ModifiedNode?.FinalFields?.NFTokens[0]?.NFToken?.NFTokenID;
    return nftId;
}

async function convertNftUriToBase64(uri: string) {
    const imageAddress = convertHexToString(uri);
    const imageUrl = `${IpfsUrl}/${imageAddress.substring(7)}`;
    const imageFileResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBase64 = Buffer.from(imageFileResponse.data, 'binary').toString('base64');
    return imageBase64;
}
