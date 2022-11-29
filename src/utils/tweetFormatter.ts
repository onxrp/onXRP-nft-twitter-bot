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

    static getTokenAcceptOfferMessage(account: string, amount: Amount, nftId: string, previousOwner: string, nftName: string | undefined, usdPrice: number | undefined): string {
        // const partialNftId = nftId.substring(nftId.length - 4);
        const formattedAccount = account.substring(0, 8);
        const formattedPreviousOwner = previousOwner.substring(0, 8);
        const marketUrl = `${MarketplaceUrl}/${nftId}`;
        const formattedAmount = formatAmount(amount);
        const formattedUsd = usdPrice != null ? ` (${usdPrice.toFixed(2)} USD)` : '';

        return `${nftName} bought for ${formattedAmount}${formattedUsd} by ${formattedAccount} from ${formattedPreviousOwner}.\n\n ${marketUrl}\n\n#XPUNKS #onXRP`;
    }
}