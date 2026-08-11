import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
const RELAYER_SECRET = new Uint8Array([166,176,27,23,192,123,96,69,54,177,160,215,22,15,130,84,175,228,240,141,118,102,65,175,34,12,229,1,50,227,244,30,107,235,28,202,224,184,66,73,86,197,191,173,223,16,20,63,109,116,211,235,20,59,131,204,24,102,35,111,210,113,49,204]);
const relayerKeypair = Keypair.fromSecretKey(RELAYER_SECRET);
const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const BURNER_WALLET = Keypair.generate();

async function run() {
    try {
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        console.log("Blockhash:", blockhash);
        const tx = new Transaction({
            feePayer: relayerKeypair.publicKey,
            recentBlockhash: blockhash,
        }).add(
            SystemProgram.transfer({
            fromPubkey: relayerKeypair.publicKey,
            toPubkey: BURNER_WALLET.publicKey,
            lamports: 10000000, // 0.01 SOL
            })
        );
        tx.sign(relayerKeypair);
        const sig = await connection.sendRawTransaction(tx.serialize());
        console.log("Sent tx:", sig);
        await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
        console.log("Confirmed!");
    } catch (e) {
        console.error(e);
    }
}
run();
