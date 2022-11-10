import axios from "axios";
import { Client, convertHexToString } from "xrpl";
import { Amount, IssuedCurrencyAmount } from "xrpl/dist/npm/models/common";

import { ApiMetadataUrl, IpfsUrl, XrpClioServer } from "../configuration";
import { log } from "./logger";
import { TwitterClient } from "./twitterClient";

export async function downloadImageAsBuffer(url: string): Promise<Buffer | undefined> {
    try {
        const imageFileResponse = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(imageFileResponse.data, 'binary');
        return buffer;
    }
    catch (err) {
        log(`Error when downloading image as buffer! ${JSON.stringify(err)}`);
        return;
    }
}

export async function downloadImageAsBase64(url: string): Promise<string | undefined> {
    try {
        const buffer = await downloadImageAsBuffer(url);
        const imageBase64 = buffer?.toString('base64');
        return imageBase64;
    }
    catch (err) {
        log(`Error when downloading image as base64! ${JSON.stringify(err)}`);
        return;
    }
}

export async function getNftInfo(nftId: string): Promise<{ image: string | undefined, nftNumber: string | undefined } | undefined> {
    try {
        const clioClient = new Client(XrpClioServer);
        await clioClient.connect();

        const { result } = await clioClient.request({
            command: "nft_info",
            nft_id: nftId,
        });

        const { uri, nft_taxon } = result as any;
        const isJson = (uri as string)?.includes(".json") || false;

        if (uri != null && !isJson) {
            return {
                image: uri,
                nftNumber: nft_taxon,
            };
        }

        const metadataResponse = await axios.get(`${ApiMetadataUrl}/${nftId}`);

        return {
            image: metadataResponse.data?.image,
            nftNumber: nft_taxon,
        }

        // Code below needed when ipfs uri leads to metadata instead of image.

        // const metadataUrl = convertNftUriToIpfsLink(ipfsUri);
        // const metadataResponse = await axios.get(metadataUrl);
        // return metadataResponse.data;
    }
    catch (err) {
        log(`Error when fetching nft info! ${JSON.stringify(err)}`);
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

export async function uploadUriToTwitterMedia(uri: string, twitterClient: TwitterClient): Promise<string[] | undefined> {
    const imageUrl = convertNftUriToIpfsLink(uri);
    if (imageUrl == null) {
        log(`Error when converting ${uri} to ipfs link`);
        return;
    }

    log(`Uploading ${imageUrl} to twitter`);

    const mediaId = await twitterClient.postMedia(imageUrl);

    return mediaId as string[];
}

const currencyMap: Record<string, string> = {
    "5850554E4B000000000000000000000000000000": "XPUNK"
};

export function formatAmount(amount: Amount) {
    let formattedAmount = null;

    if ((amount as IssuedCurrencyAmount).value != null) {
        const cAmount = (amount as IssuedCurrencyAmount);
        const currency = currencyMap[cAmount.currency] || cAmount.currency;
        formattedAmount = `${cAmount.value}${currency}`;
    } else {
        formattedAmount = `${(+amount / 1000000)}XRP`;
    }

    return formattedAmount;
}