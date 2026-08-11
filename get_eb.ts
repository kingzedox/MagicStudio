import { PublicKey } from "@solana/web3.js";
import { DELEGATION_PROGRAM_ID } from "@magicblock-labs/ephemeral-rollups-sdk";
const payer = new PublicKey("11111111111111111111111111111111"); // dummy
console.log("From payer:", PublicKey.findProgramAddressSync([Buffer.from("balance"), payer.toBuffer(), Buffer.from([255])], DELEGATION_PROGRAM_ID)[0].toString());
const validator = new PublicKey("MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57");
console.log("From validator:", PublicKey.findProgramAddressSync([Buffer.from("balance"), validator.toBuffer(), Buffer.from([255])], DELEGATION_PROGRAM_ID)[0].toString());
