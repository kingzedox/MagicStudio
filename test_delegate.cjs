const { Connection, Keypair, PublicKey, SystemProgram } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet } = require('@coral-xyz/anchor');
const IDL = require('./src/idl/magicstudio.json');

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const RELAYER_SECRET = new Uint8Array([166,176,27,23,192,123,96,69,54,177,160,215,22,15,130,84,175,228,240,141,118,102,65,175,34,12,229,1,50,227,244,30,107,235,28,202,224,184,66,73,86,197,191,173,223,16,20,63,109,116,211,235,20,59,131,204,24,102,35,111,210,113,49,204]);
  const wallet = new Wallet(Keypair.fromSecretKey(RELAYER_SECRET));
  const provider = new AnchorProvider(connection, wallet, { skipPreflight: false });
  
  const programId = new PublicKey("5nRcojZxaqi3SYd4qBUdD8NzYPEBbWHUkbcHAACY23A2");
  const program = new Program(IDL, programId, provider);
  
  const roomId = "studio-asae";
  const [canvasStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("canvas"), Buffer.from(roomId)],
    programId
  );
  
  try {
    const tx = await program.methods.delegate()
      .accounts({
        canvasState: canvasStatePda,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("Success:", tx);
  } catch (e) {
    console.error("Simulation failed:", e);
  }
}
main();
