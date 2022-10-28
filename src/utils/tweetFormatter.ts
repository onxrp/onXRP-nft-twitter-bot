import Twit from "twit";
import { Amount } from "xrpl/dist/npm/models/common";

import { MarketplaceUrl } from "../configuration";
import { formatAmount } from "./helpers";

export class TweetFormatter {
    static getMintMessage(account: string, nftId: string, mediaId: string[]): Twit.Params {
        const partialNftId = nftId.substring(nftId.length - 4);
        const formattedAccount = account.substring(0, 8);
        const marketUrl = `${MarketplaceUrl}/${nftId}`;
        return {
            status: `XPUNKS Sale!\n${formattedAccount} minted NFT with ID ${partialNftId}.\n${marketUrl}`,
            media_ids: mediaId,
        };
    }

    static getCreateOfferMessage(account: string, amount: Amount, nftId: string, issuer: string, mediaId: string[]): Twit.Params {
        const partialNftId = nftId.substring(nftId.length - 4);
        const formattedAccount = account.substring(0, 8);
        const formattedIssuer = issuer.substring(0, 8);
        const marketUrl = `${MarketplaceUrl}/${nftId}`;
        const formattedAmount = formatAmount(amount);

        return {
            status: `XPUNKS Sale!\n${formattedAccount} wants to buy NFT #${partialNftId} for ${formattedAmount} from ${formattedIssuer}.\n${marketUrl}`,
            media_ids: mediaId,
        };
    }

    static getTokenAcceptOfferMessage(account: string, amount: Amount, nftId: string, issuer: string, mediaId: string[]): Twit.Params {
        const partialNftId = nftId.substring(nftId.length - 4);
        const formattedAccount = account.substring(0, 8);
        const formattedIssuer = issuer.substring(0, 8);
        const marketUrl = `${MarketplaceUrl}/${nftId}`;
        const formattedAmount = formatAmount(amount);

        return {
            status: `XPUNKS Sale!\n${formattedAccount} bought NFT #${partialNftId} for ${formattedAmount} from ${formattedIssuer}.\n${marketUrl}`,
            media_ids: mediaId,
        };
    }
}