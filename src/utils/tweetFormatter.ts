import Twit from "twit";

export class TweetFormatter {
    static getMintMessage(account: string, nftId: string, mediaId: string[]): Twit.Params {
        return {
            status: `${account} minted NFT with ID ${nftId}!`,
            media_ids: mediaId,
        }
    }

    static getCreateOfferMessage(account: string, amount: string, nftId: string, issuer: string): Twit.Params {
        return {
            status: `${account} wants to buy NFT ${nftId} for ${amount} from issuer ${issuer}!`,
        };
    }
}