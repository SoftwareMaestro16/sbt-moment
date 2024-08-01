import {Api, HttpClient} from "@ton-api/client";

const httpClient = new HttpClient({
    baseUrl: 'https://tonapi.io',
    baseApiParams: {
        headers: {
            Authorization: `Bearer AEXJI3CLA76FXGQAAAAIC6OMGVN22R6SCKVNVRN7WMPGTVZI2M6LMAYXTOI6PDFNB2BLNII`,
            'Content-type': 'application/json'
        }
    }
});

export const tonapi = new Api(httpClient);


export async function waitForTx(msgHash: string, attempt = 0) {
    try {
        return await tonapi.blockchain.getBlockchainTransactionByMessageHash(msgHash);
    } catch (e) {
        if (attempt >= 20) {
            throw e;
        }

        await new Promise(resolve => setTimeout(resolve, 1500));

        return waitForTx(msgHash, attempt + 1);
    }
}

export async function getJettonWalletAddress(jettonMasterAddress: string, walletAddress: string) {
    console.log('Fetching jetton wallet address with:', { jettonMasterAddress, walletAddress });
    try {
        const result = await tonapi.blockchain.execGetMethodForBlockchainAccount(jettonMasterAddress, 'get_wallet_address', {
            args: [walletAddress]
        });
        console.log('Jetton wallet address result:', result);
        return result.decoded.jetton_wallet_address;
    } catch (e) {
        console.error('Error fetching jetton wallet address:', e);
        throw e;
    }
}