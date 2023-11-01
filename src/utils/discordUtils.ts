import { Client, TextChannel, ClientOptions,IntentsBitField  } from "discord.js"; 

export interface DiscordClient {
    postMessage(channelId: string, message: string, image?: Buffer): Promise<void>;
}

export class DiscordJsClient implements DiscordClient {
    private client: Client;

    constructor() {
        const options: ClientOptions = {
            intents: [
                IntentsBitField.Flags.Guilds,
                IntentsBitField.Flags.GuildMessages
            ]
        };
        
        this.client = new Client(options);

        this.client.login(process.env.DISCORD_BOT_TOKEN);
    }

    async postMessage(channelId: string, message: string, image?: Buffer): Promise<void> {
        const channel = this.client.channels.cache.get(channelId);

if (channel instanceof TextChannel) {
    // You can now safely work with the channel as a TextChannel
    await channel.send(message);
} else {
    console.error(`Channel with ID ${channelId} is not a TextChannel.`);
    return;
}
        }
    }


// Map collections to respective Discord channel IDs
const collectionToDiscordChannelMap = {
    'XPUNKS': process.env.DISCORD_XPUNKS_CHANNEL_ID,
    'EDEN-PROPERTIES': process.env.DISCORD_EDEN_PROPERTIES_CHANNEL_ID,
    'UNIXPUNKS': process.env.DISCORD_UNIXPUNKS_CHANNEL_ID,
};

type CollectionName = keyof typeof collectionToDiscordChannelMap;

function postMessageForCollection(collectionName: CollectionName, message: string, image?: Buffer) {
    const channelId = collectionToDiscordChannelMap[collectionName];
    if (channelId) {
        const discordClient = new DiscordJsClient();
        discordClient.postMessage(channelId, message, image);
    } else {
        console.error(`No Discord channel ID found for collection: ${collectionName}`);
    }
}

export { postMessageForCollection };
