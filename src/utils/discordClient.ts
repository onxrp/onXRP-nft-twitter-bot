import { Client, TextChannel, ClientOptions, IntentsBitField  } from 'discord.js';

export class DiscordClient {
    private client: Client;
    private isInitialized: boolean;

    constructor() {
        const options: ClientOptions = {
            intents: [
                IntentsBitField.Flags.Guilds,
                IntentsBitField.Flags.GuildMessages
             
            ]
        };

        this.client = new Client(options);
        this.isInitialized = false;
    }


    public async initialize(token: string): Promise<void> {
        if (this.isInitialized) return;

        try {
            await this.client.login(token);
            console.log('Discord bot is now connected!');
            this.isInitialized = true;
        } catch (error) {
            console.error('Error while initializing the Discord client:', error);
        }
    }

    public cleanup(): void {
        if (this.isInitialized) {
            this.client.destroy();
            this.isInitialized = false;
            console.log('Discord bot is disconnected and cleaned up!');
        }
    }

    public async sendMessage(channelId: string, message: string, imageUrl?: string): Promise<void> {
        if (!this.isInitialized) {
            console.error('Discord client is not initialized. Please call initialize() first.');
            return;
        }

        const channel = this.client.channels.cache.get(channelId);
        if (!channel || !(channel instanceof TextChannel)) {
            console.error(`Channel with ID ${channelId} is either not found or not a TextChannel.`);
            return;
        }

        try {
            if (imageUrl) {
                await channel.send({
                    content: message,
                    files: [imageUrl]
                });
            } else {
                await channel.send(message);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }    
    }
