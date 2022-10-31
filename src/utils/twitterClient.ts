import Twit from "twit";
import { TwitterApi } from 'twitter-api-v2';
import { fileTypeFromBuffer } from "file-type";

import { AccessToken, AccessTokenSecret, ApiKey, ApiKeySecret } from "../configuration";
import { downloadImageAsBase64, downloadImageAsBuffer, uploadUriToTwitterMedia } from "./helpers";
import { log } from "./logger";

export interface TwitterClient {
    tweet(message: string, image?: any): Promise<any>;
    postMedia(url: string): Promise<string[] | string | undefined>;
}

export class TwitJsClient implements TwitterClient {
    private twit: Twit;

    constructor() {
        log("Using twit.js library to post tweets to Twitter!");

        this.twit = new Twit({
            consumer_key: ApiKey,
            consumer_secret: ApiKeySecret,
            access_token: AccessToken,
            access_token_secret: AccessTokenSecret,
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
        }

        if (image != null) {
            const mediaId = await uploadUriToTwitterMedia(image, this);

            if (mediaId != null) {
                statusUpdate.media_ids = mediaId;
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

    constructor() {
        log("Using twitter-api-v2 library to post tweets to Twitter!");

        this.twitterApi = new TwitterApi({
            appKey: ApiKey,
            appSecret: ApiKeySecret,
            accessToken: AccessToken,
            accessSecret: AccessTokenSecret,
        });
    }

    async tweet(message: string, image?: any): Promise<any> {
        const statusUpdate: any = {
            text: message,
        }

        if (image != null) {
            const mediaId = await uploadUriToTwitterMedia(image, this);

            if (mediaId != null) {
                statusUpdate.media = {
                    media_ids: [mediaId],
                }
            } else {
                log(`Uploaded media id for image url ${image} is null. Probably something went wrong!`);

                // Uncomment this if you want to skip creating tweet when image is null
                // return;
            }
        }

        await this.twitterApi.v2.tweet(statusUpdate);
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

}