import axios from "axios";
import Twit from "twit";
import { Client, convertHexToString } from "xrpl";
import { Amount, IssuedCurrencyAmount } from "xrpl/dist/npm/models/common";

import { IpfsUrl, XrpClioServer } from "../configuration";
import { log } from "./logger";

export async function downloadImageAsBase64(url: string): Promise<string | undefined> {
    try {
        const imageFileResponse = await axios.get(url, { responseType: 'arraybuffer' });
        const imageBase64 = Buffer.from(imageFileResponse.data, 'binary').toString('base64');
        return imageBase64;
    }
    catch (err) {
        return;
    }
}

export async function getNftInfo(nftId: string): Promise<{ image: string } | undefined> {
    try {
        const clioClient = new Client(XrpClioServer);
        await clioClient.connect();

        const { result } = await clioClient.request({
            command: "nft_info",
            nft_id: nftId,
        });

        const ipfsUri = (result as any).uri;

        return {
            image: ipfsUri,
        };

        // Code below needed when ipfs uri leads to metadata instead of image.

        // const metadataUrl = convertNftUriToIpfsLink(ipfsUri);
        // const metadataResponse = await axios.get(metadataUrl);
        // return metadataResponse.data;
    }
    catch (err) {
        return;
    }
}

export function convertNftUriToIpfsLink(uri: string) {
    if (uri == null) {
        return;
    }

    const imageAddress = convertHexToString(uri) || uri;
    const imageUrl = `${IpfsUrl}/${imageAddress.substring(7)}`;
    return imageUrl;
}

export async function uploadUriToTwitterMedia(uri: string, twit: Twit): Promise<string[] | undefined> {
    const imageUrl = convertNftUriToIpfsLink(uri);
    if (imageUrl == null) {
        log(`Error when converting ${uri} to ipfs link`);
        return;
    }

    const imageBase64 = await downloadImageAsBase64(imageUrl);

    if (imageBase64 == null) {
        log(`Error when converting ${imageUrl} to base64`);
        return;
    }

    log(`Uploading ${imageUrl} to twitter`);
    const uploadResponse = await twit.post("media/upload", {
        media_data: imageBase64,
    });
    const mediaId = (uploadResponse.data as any)?.media_id_string;

    return mediaId as string[];
}

export function formatAmount(amount: Amount) {
    let formattedAmount = null;

    if ((amount as IssuedCurrencyAmount).value != null) {
        formattedAmount = `${(amount as IssuedCurrencyAmount).value}${(amount as IssuedCurrencyAmount).currency}`;
    } else {
        formattedAmount = `${(+amount / 1000000)}XRP`;
    }

    return formattedAmount;
}