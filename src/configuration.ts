require('dotenv').config();

export const TokenIssuer = process.env.TOKEN_ISSUER as string;
export const XrpServer = process.env.XRP_SERVER || "wss://xrplcluster.com";
export const XrpClioServer = process.env.XRP_CLIO_SERVER as string;
export const IpfsUrl = process.env.IPFS_URL as string;

export const ApiKey = process.env.API_KEY as string;
export const ApiKeySecret = process.env.API_KEY_SECRET as string;
export const AccessToken = process.env.ACCESS_TOKEN as string;
export const AccessTokenSecret = process.env.ACCESS_TOKEN_SECRET as string;

export const MarketplaceUrl = process.env.MARKETPLACE_URL as string;
