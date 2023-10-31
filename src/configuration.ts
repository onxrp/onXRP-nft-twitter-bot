require('dotenv').config();

export const TokenIssuer = process.env.TOKEN_ISSUER as string;
export const XrpServer = process.env.XRP_SERVER || "wss://xrplcluster.com";
export const XrpClioServer = process.env.XRP_CLIO_SERVER as string;
export const IpfsUrl = process.env.IPFS_URL as string;

//  multiple Twitter accounts
interface TwitterAccount {
    apiKey: string;
    apiKeySecret: string;
    accessToken: string;
    accessTokenSecret: string;
    collectionName: string;
  }
export const TwitterAccounts = [
    {
      apiKey: process.env.API_KEY_ACCOUNT_1 as string,
      apiKeySecret: process.env.API_KEY_SECRET_ACCOUNT_1 as string,
      accessToken: process.env.ACCESS_TOKEN_ACCOUNT_1 as string,
      accessTokenSecret: process.env.ACCESS_TOKEN_SECRET_ACCOUNT_1 as string,
      collectionName: 'Xpunks',
    },
    {
      apiKey: process.env.API_KEY_ACCOUNT_2 as string,
      apiKeySecret: process.env.API_KEY_SECRET_ACCOUNT_2 as string,
      accessToken: process.env.ACCESS_TOKEN_ACCOUNT_2 as string,
      accessTokenSecret: process.env.ACCESS_TOKEN_SECRET_ACCOUNT_2 as string,
      collectionName: 'Unixpunks',
    },
    {
        apiKey: process.env.API_KEY_ACCOUNT_3 as string,
        apiKeySecret: process.env.API_KEY_SECRET_ACCOUNT_3 as string,
        accessToken: process.env.ACCESS_TOKEN_ACCOUNT_3 as string,
        accessTokenSecret: process.env.ACCESS_TOKEN_SECRET_ACCOUNT_3 as string,
        collectionName: 'Eden-Properties',
      },

  ];

export const MarketplaceUrl = process.env.MARKETPLACE_URL as string;
export const ApiMetadataUrl = process.env.API_METADATA_URL as string;
export const ApiCoinMetaUrl = process.env.API_COIN_META_URL as string;

export const CoinmarketcapApikey = process.env.COINMARKETCAP_API_KEY as string;
export const CoinmarketcapPriceConversionUrl = process.env.COINMARKETCAP_PRICE_CONVERSION_URL as string;

export const CollectionName = process.env.COLLECTION_NAME as string || 'XPUNKS, EDEN-PROPERTIES, UNIXPUNKS';

export const validTokenIssuers = [
    'rHEL3bM4RFsvF8kbQj3cya8YiDvjoEmxLq', // XPUNKS issuer
    'rMgcSs3HQjvy3ZM2FVsxqgUrudVPM7HP5m', // UNIXPUNKS issuer 
    'rhqfdeNZRx9sMHZb197gwA6dj11uDKv8RD', // Eden-Properties issuer 
  ];
  export const issuerCollectionMapping: { [key: string]: string } = {
    'rHEL3bM4RFsvF8kbQj3cya8YiDvjoEmxLq': 'Xpunks',
    'rMgcSs3HQjvy3ZM2FVsxqgUrudVPM7HP5m': 'Unixpunks',
    'rhqfdeNZRx9sMHZb197gwA6dj11uDKv8RD': 'Eden-Properties',
    
};
