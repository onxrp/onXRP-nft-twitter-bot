import axios from "axios";
import { fileTypeFromBuffer } from "file-type";
import { Client, convertHexToString, parseNFTokenID } from "xrpl";
import { Amount, IssuedCurrencyAmount } from "xrpl/dist/npm/models/common";

import { ApiCoinMetaUrl, ApiMetadataUrl, CoinmarketcapApikey, CoinmarketcapPriceConversionUrl, IpfsUrl, XrpClioServer } from "../configuration";
import { log } from "./logger";
import { TwitterClient } from "./twitterClient";

export async function downloadImageAsBuffer(url: string): Promise<Buffer | undefined> {
    try {
        const imageFileResponse = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(imageFileResponse.data, 'binary');
        const fileType = await fileTypeFromBuffer(buffer);

        if (fileType == null) {
            return;
        }

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

export async function getNftInfo(nftId: string): Promise<{ image: string | undefined, nftName: string | undefined } | undefined> {
    try {
        // const clioClient = new Client(XrpClioServer);
        // await clioClient.connect();

        // const { result } = await clioClient.request({
        //     command: "nft_info",
        //     nft_id: nftId,
        // });

        // const { uri, nft_sequence } = result as any;
        // const isJson = (uri as string)?.includes(".json") || false;

        // if (uri != null && !isJson) {
        //     return {
        //         image: uri,
        //         nftNumber: nft_sequence,
        //     };
        // }

        const metadataResponse = await axios.get(`${ApiMetadataUrl}/${nftId}`);
        const { image, name } = metadataResponse?.data || {};

        return {
            image: image,
            nftName: name,
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
    "5850554E4B000000000000000000000000000000": "XPUNK",
    "OXP": "OXP",
};

const currencyIssuerMap: Record<string, string> = {
    "5850554E4B000000000000000000000000000000": "rHEL3bM4RFsvF8kbQj3cya8YiDvjoEmxLq",
    "OXP": "rrno7Nj4RkFJLzC4nRaZiLF5aHwcTVon3d",
}

export function formatAmount(amount?: Amount) {
    if (amount == null) {
        return null;
    }

    let formattedAmount = null;

    if ((amount as IssuedCurrencyAmount).value != null) {
        const cAmount = (amount as IssuedCurrencyAmount);
        const currency = currencyMap[cAmount.currency] || cAmount.currency;
        formattedAmount = `${cAmount.value} ${currency}`;
    } else {
        formattedAmount = `${(+amount / 1000000)} XRP`;
    }

    return formattedAmount;
}

export async function getCoinPrice(amount: Amount) {
    try {
        let xrpAmount = 0;
        if ((amount as IssuedCurrencyAmount).value != null) {
            const cAmount = (amount as IssuedCurrencyAmount);
            const result = await axios.post(ApiCoinMetaUrl, {
                counterCurrencyHex: "XRP",
                counterCurrencyIssuer: "",
                currencyHex: cAmount.currency,
                issuer: currencyIssuerMap[cAmount.currency] || cAmount.issuer,
            });
            const { high, low } = result.data;
            const averagePrice = (+high + +low) / 2;
            xrpAmount = +cAmount.value * averagePrice;
        }
        else {
            xrpAmount = (+amount / 1000000);
        }

        const priceResult = await axios.get(CoinmarketcapPriceConversionUrl, {
            params: {
                amount: xrpAmount,
                symbol: "XRP",
            },
            headers: {
                "X-CMC_PRO_API_KEY": CoinmarketcapApikey
            }
        });

        const usdPrice = +priceResult.data?.data[0]?.quote["USD"]?.price || 0;
        return usdPrice;
    }
    catch (err) {
        log(`Error when fetching coin price! ${JSON.stringify(err)}`);
        return;
    }
}

export function checkAmountValidity(amount: Amount) {
    if ((amount as IssuedCurrencyAmount).value != null) {
        const cAmount = (amount as IssuedCurrencyAmount);
        const mappedCurrency = currencyMap[cAmount.currency];
        if (mappedCurrency == null || mappedCurrency === "XPUNK") {
            return false;
        }
        return true;
    } else {
        const xrpAmount = (+amount / 1000000);
        return xrpAmount >= 100;
    }
}