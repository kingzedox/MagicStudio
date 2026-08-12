import * as anchor from "@coral-xyz/anchor";
import { IDL } from "./src/idl/magicstudio";

try {
  const provider = { connection: {} } as any;
  const program = new anchor.Program(IDL as any, provider);
  console.log("Success! Anchor successfully parsed the IDL.");
} catch (e) {
  console.error(e);
}
