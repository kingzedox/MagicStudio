import { BaseMessageSignerWalletAdapter, WalletName, WalletReadyState } from '@solana/wallet-adapter-base';
import { Keypair, Transaction, VersionedTransaction, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';

export const BurnerWalletName = 'Burner Wallet (Test)' as WalletName<'Burner Wallet (Test)'>;

export class BurnerWalletAdapter extends BaseMessageSignerWalletAdapter {
    name = BurnerWalletName;
    url = 'https://magicstudio.app';
    icon = 'https://cryptologos.cc/logos/solana-sol-logo.png';
    readyState = WalletReadyState.Installed;
    supportedTransactionVersions: ReadonlySet<any> = new Set(['legacy', 0]);
    
    private _keypair: Keypair | null = null;
    
    constructor() {
        super();
        const savedSecret = localStorage.getItem('burner_wallet_secret');
        if (savedSecret) {
            try {
                this._keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(savedSecret)));
            } catch (e) {}
        }
        if (!this._keypair) {
            this._keypair = Keypair.generate();
            localStorage.setItem('burner_wallet_secret', JSON.stringify(Array.from(this._keypair.secretKey)));
        }
    }

    get publicKey() { return this._keypair?.publicKey || null; }
    get connecting() { return false; }

    async connect(): Promise<void> {
        this.emit('connect', this.publicKey!);
    }

    async disconnect(): Promise<void> {
        this.emit('disconnect');
    }

    async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
        if (!this._keypair) throw new Error('Not connected');
        if ('version' in transaction) {
            transaction.sign([this._keypair]);
        } else {
            transaction.partialSign(this._keypair);
        }
        return transaction;
    }

    async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
        return transactions.map(t => {
            if ('version' in t) {
                t.sign([this._keypair!]);
            } else {
                t.partialSign(this._keypair!);
            }
            return t;
        });
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        throw new Error('Not implemented');
    }
}
