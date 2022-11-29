import { Transaction, TransactionMetadata } from "xrpl";
import { Amount } from "xrpl/dist/npm/models/common";

type TxWithMeta = Transaction & { meta?: TransactionMetadata };

export function parseTxMeta(tx: TxWithMeta, entryTypes?: string[], include?: boolean) {
    const meta = tx.meta;

    if (meta == null) {
        return
    }

    const formattedMeta = meta.AffectedNodes.map((an: any) => {
        const modificationType = Object.keys(an)[0]
        const modifiedEntry = an[modificationType]

        return {
            modificationType: modificationType,
            ledgerEntryType: modifiedEntry['LedgerEntryType'],
            finalFields: modifiedEntry['FinalFields'],
            newFields: modifiedEntry['NewFields'],
            previousFields: modifiedEntry['PreviousFields'],
        }
    })

    function predicate(fm: typeof formattedMeta[0]) {
        if (entryTypes == null) {
            return true;
        }

        if (include) {
            return entryTypes.indexOf(fm.ledgerEntryType) >= 0
        }

        return entryTypes.indexOf(fm.ledgerEntryType) < 0
    }

    const filteredMeta = formattedMeta.filter(predicate);

    return filteredMeta;
}

export function parseAcceptOfferTx(tx: TxWithMeta) {
    const meta = parseTxMeta(tx, ['NFTokenOffer'], true)

    const sellOffer = meta?.find(m => m.finalFields?.Flags === 1);
    const buyOffer = meta?.find(m => m.finalFields?.Flags === 0);

    const nftId = sellOffer?.finalFields?.NFTokenID || buyOffer?.finalFields?.NFTokenID;
    const amount = (buyOffer?.finalFields?.Amount || sellOffer?.finalFields?.Amount) as Amount;
    const previousOwner = sellOffer?.finalFields?.Owner;
    const newOwner = buyOffer?.finalFields?.Owner || sellOffer?.finalFields?.Destination;

    const parseResult = {
        sellOffer,
        buyOffer,
        nftId,
        amount,
        previousOwner,
        newOwner,
    }

    return parseResult;
}

export type ParseAcceptOfferTxResult = ReturnType<typeof parseAcceptOfferTx>;