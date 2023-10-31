import Twit from "twit";
import { TwitterApi } from 'twitter-api-v2';
import { fileTypeFromBuffer } from "file-type";
import { downloadImageAsBase64, downloadImageAsBuffer, uploadUriToTwitterMedia } from "./helpers";
import { log } from "./logger";
import { TwitterAccounts } from "configuration"; 

export interface TwitterClient {
    tweet(message: string, image?: any): Promise<any>;
    postMedia(url: string): Promise<string[] | string | undefined>;
}

export class TwitJsClient implements TwitterClient {
    private twit: Twit;

    constructor(credentials: { apiKey: string; apiKeySecret: string; accessToken: string; accessTokenSecret: string; }) {
        log("Using twit.js library to post tweets to Twitter!");

        this.twit = new Twit({
            consumer_key: credentials.apiKey,
            consumer_secret: credentials.apiKeySecret,
            access_token: credentials.accessToken,
            access_token_secret: credentials.accessTokenSecret,
        });
    }

    async postMedia(url: string): Promise<string[] | string | undefined> {
        const imageBase64 = await downloadImageAsBase64(url);

        if (imageBase64 == null) {
            log(`Error when converting ${url} to base64`);
            return;
        }

        const uploadResponse = await this.twit.post("media/upload", {
            media_data: imageBase64,
        });

        log(`Upload response ${JSON.stringify(uploadResponse)}`);
        const mediaId = (uploadResponse.data as any)?.media_id_string as string[] | undefined;

        return mediaId;
    }

    async tweet(message: string, image?: any): Promise<any> {
        const statusUpdate: Twit.Params = {
            status: message,
        };

        if (image != null) {
            const mediaId = await this.postMedia(image);

            if (mediaId != null) {
                // Ensure media_ids always receives an array of strings
                statusUpdate.media_ids = Array.isArray(mediaId) ? mediaId : [mediaId];
            } else {
                log(`Uploaded media id for image url ${image} is null. Probably something went wrong!`);
                // Uncomment this if you want to skip creating tweet when image is null
                // return;
            }
        }

        await this.twit.post("statuses/update", statusUpdate);
    }
}



export class TwitterApiV2Client implements TwitterClient {
    private twitterApi: TwitterApi;

    constructor(credentials: { appKey: string; appSecret: string; accessToken: string; accessSecret: string; }) {
        log("Using twitter-api-v2 library to post tweets to Twitter!");

        this.twitterApi = new TwitterApi({
            appKey: credentials.appKey,
            appSecret: credentials.appSecret,
            accessToken: credentials.accessToken,
            accessSecret: credentials.accessSecret,
        });
    }

    async postMedia(url: string): Promise<string | string[] | undefined> {
        const buffer = await downloadImageAsBuffer(url);

        if (buffer == null) {
            log(`Error when downloading ${url} and converting it to buffer`);
            return;
        }

        const fileType = await fileTypeFromBuffer(buffer);
        const mediaId = await this.twitterApi.v1.uploadMedia(buffer, {
            mimeType: fileType?.mime,
        });

        return mediaId;
    }

    async tweet(message: string, image?: any): Promise<any> {
        const statusUpdate: any = {
            text: message,
        };

        if (image != null) {
            const mediaId = await this.postMedia(image);

            if (mediaId != null) {
                statusUpdate.media = {
                    media_ids: [mediaId],
                };
            } else {
                log(`Uploaded media id for image url ${image} is null. Probably something went wrong!`);
                // Uncomment this if you want to skip creating tweet when image is null
                // return;
            }
        }

        await this.twitterApi.v2.tweet(statusUpdate);
    }
}

// Initialize Twitter clients for each account
const twitterClients = TwitterAccounts.map(account => 
    new TwitJsClient({
        apiKey: account.apiKey,
        apiKeySecret: account.apiKeySecret,
        accessToken: account.accessToken,
        accessTokenSecret: account.accessTokenSecret
    })
);


// Map collections to respective Twitter clients
const collectionToClientMap = {
    'XPUNKS': twitterClients[0],
    'EDEN-PROPERTIES': twitterClients[1],
    'UNIXPUNKS': twitterClients[2],
};


type CollectionName = keyof typeof collectionToClientMap;

function postTweetForCollection(collectionName: CollectionName, message: string, image?: any) {
    const client = collectionToClientMap[collectionName];
    if (client) {
        client.tweet(message, image);
    } else {
        log(`No Twitter client found for collection: ${collectionName}`);
    }
}

export { postTweetForCollection };
