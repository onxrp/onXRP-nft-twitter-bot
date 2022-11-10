import { Amount } from "xrpl/dist/npm/models/common";

import { MarketplaceUrl } from "../configuration";
import { formatAmount } from "./helpers";

export class TweetFormatter {
    static getMintMessage(account: string, nftId: string): string {
        const partialNftId = nftId.substring(nftId.length - 4);
        const formattedAccount = account.substring(0, 8);
        const marketUrl = `${MarketplaceUrl}/${nftId}`;

        return `XPUNKS Sale!\n${formattedAccount} minted NFT #${partialNftId}.\n${marketUrl}`;
    }

    static getCreateOfferMessage(account: string, amount: Amount, nftId: string, issuer: string): string {
        const partialNftId = nftId.substring(nftId.length - 4);
        const formattedAccount = account.substring(0, 8);
        const formattedIssuer = issuer.substring(0, 8);
        const marketUrl = `${MarketplaceUrl}/${nftId}`;
        const formattedAmount = formatAmount(amount);

        return `XPUNKS Sale!\n${formattedAccount} wants to buy NFT #${partialNftId} for ${formattedAmount} from ${formattedIssuer}.\n${marketUrl}`;
    }

    static getTokenAcceptOfferMessage(account: string, amount: Amount, nftId: string, issuer: string, nftNumber: string | undefined): string {
        const partialNftId = nftId.substring(nftId.length - 4);
        const formattedAccount = account.substring(0, 8);
        const formattedIssuer = issuer.substring(0, 8);
        const marketUrl = `${MarketplaceUrl}/${nftId}`;
        const formattedAmount = formatAmount(amount);

        return `XPUNK #${nftNumber || partialNftId} bought for ${formattedAmount} by ${formattedAccount} from ${formattedIssuer}\n\n Powered by @onXRPdotcom. \n\n ${marketUrl}`;
        // return `XPUNKS Sale!\n${formattedAccount} bought NFT #${partialNftId} for ${formattedAmount} from ${formattedIssuer}.\n${marketUrl}`;
    }
}