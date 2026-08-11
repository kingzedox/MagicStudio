import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, setProvider } from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction, Keypair, Transaction } from '@solana/web3.js';
import { MagicStudio, IDL } from '../idl/magicstudio';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { MAGIC_PROGRAM_ID, MAGIC_CONTEXT_ID, DELEGATION_PROGRAM_ID, delegationRecordPdaFromDelegatedAccount, delegateBufferPdaFromDelegatedAccountAndOwnerProgram, delegationMetadataPdaFromDelegatedAccount } from '@magicblock-labs/ephemeral-rollups-sdk';
import { PROGRAM_ID as PROGRAM_ID_STRING, EPHEMERAL_ROLLUP_RPC } from '../constants';

// Global burner wallet for all ER transactions to bypass Phantom popups and simulation issues
let BURNER_WALLET: Keypair;
const savedSecret = localStorage.getItem('burner_wallet_secret');
if (savedSecret) {
  try {
    BURNER_WALLET = Keypair.fromSecretKey(new Uint8Array(JSON.parse(savedSecret)));
  } catch (e) {
    BURNER_WALLET = Keypair.generate();
    localStorage.setItem('burner_wallet_secret', JSON.stringify(Array.from(BURNER_WALLET.secretKey)));
  }
} else {
  BURNER_WALLET = Keypair.generate();
  localStorage.setItem('burner_wallet_secret', JSON.stringify(Array.from(BURNER_WALLET.secretKey)));
}

const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);

export function useMagicStudio(roomId: string | null) {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  // Custom RPC for Ephemeral Rollup
  const erConnection = useMemo(() => new Connection(EPHEMERAL_ROLLUP_RPC, 'confirmed'), []);

  // Dummy wallet for read-only access when Phantom is not connected
  const dummyWallet = useMemo(() => {
    return {
      publicKey: BURNER_WALLET.publicKey,
      signTransaction: async (tx: any) => {
        if ('version' in tx) tx.sign([BURNER_WALLET]);
        else tx.sign(BURNER_WALLET);
        return tx;
      },
      signAllTransactions: async (txs: any[]) => {
        txs.forEach(tx => {
          if ('version' in tx) tx.sign([BURNER_WALLET]);
          else tx.sign(BURNER_WALLET);
        });
        return txs;
      }
    };
  }, []);

  const provider = useMemo(() => {
    const activeWallet = (wallet && wallet.publicKey && wallet.signTransaction) ? wallet : dummyWallet;
    const prov = new AnchorProvider(
      connection, 
      activeWallet as any, 
      { commitment: 'confirmed' }
    );
    setProvider(prov);
    return prov;
  }, [connection, wallet, dummyWallet]);

  // Hardcoded Relayer Wallet (Devnet SOL only) to bypass all rate limits and popups!
  const RELAYER_SECRET = new Uint8Array(JSON.parse(import.meta.env.VITE_RELAYER_SECRET || "\[\]"));
  const relayerKeypair = useMemo(() => Keypair.fromSecretKey(RELAYER_SECRET), []);

  // Fund wallets automatically if needed (bypasses devnet faucet limits)
  useEffect(() => {
    const fundWallets = async () => {
      try {
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        let needsFunding = false;
        const tx = new Transaction({
          feePayer: relayerKeypair.publicKey,
          recentBlockhash: blockhash,
        });

        // 1. Check Burner Wallet
        const burnerBal = await connection.getBalance(BURNER_WALLET.publicKey);
        if (burnerBal < 10000000) { // < 0.01 SOL
          console.log("Funding Burner Wallet via embedded Relayer...");
          tx.add(
            SystemProgram.transfer({
              fromPubkey: relayerKeypair.publicKey,
              toPubkey: BURNER_WALLET.publicKey,
              lamports: 50000000, // 0.05 SOL
            })
          );
          needsFunding = true;
        }

        // 2. Check User's Phantom Wallet
        if (wallet && wallet.publicKey) {
          const userBal = await connection.getBalance(wallet.publicKey);
          if (userBal < 10000000) { // < 0.01 SOL
            console.log("Funding User Wallet via embedded Relayer...");
            tx.add(
              SystemProgram.transfer({
                fromPubkey: relayerKeypair.publicKey,
                toPubkey: wallet.publicKey,
                lamports: 50000000, // 0.05 SOL
              })
            );
            needsFunding = true;
          }
        }

        if (needsFunding) {
          tx.sign(relayerKeypair);
          const sig = await connection.sendRawTransaction(tx.serialize());
          await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
          console.log("Wallets successfully funded by Relayer!");
        }
      } catch (e) {
        console.warn("Failed to check or fund balances:", e);
      }
    };
    
    fundWallets();
  }, [connection, erConnection, relayerKeypair, wallet?.publicKey]);

  const erProvider = useMemo(() => {
    const activeWallet = (wallet && wallet.publicKey && wallet.signTransaction) ? wallet : dummyWallet;
    return new AnchorProvider(
      erConnection, 
      activeWallet as any, 
      { skipPreflight: true }
    );
  }, [erConnection, wallet, dummyWallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    return new Program(IDL as any, provider);
  }, [provider]);

  const erProgram = useMemo(() => {
    if (!erProvider) return null;
    return new Program(IDL as any, erProvider);
  }, [erProvider]);

  // Derive PDA
  const canvasStatePda = useMemo(() => {
    if (!roomId) return null;
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("canvas"), Buffer.from(roomId)],
      PROGRAM_ID
    );
    return pda;
  }, [roomId]);

  const initializeCanvas = async () => {
    if (!program || !canvasStatePda || !wallet.publicKey) {
      throw new Error("Missing required parameters for canvas initialization");
    }
    
    const tx = await program.methods.initializeCanvas(roomId)
      .accounts({
        canvasState: canvasStatePda,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    return tx;
  };

  const checkIfDelegated = async () => {
    if (!canvasStatePda) return false;
    try {
      const accountInfo = await connection.getAccountInfo(canvasStatePda);
      if (!accountInfo) return false;
      return accountInfo.owner.equals(DELEGATION_PROGRAM_ID);
    } catch (e) {
      return false;
    }
  };

  const delegateToER = async () => {
    if (!program || !canvasStatePda || !wallet.publicKey || !wallet.signTransaction) {
      throw new Error("Program not initialized or wallet not connected");
    }
    
    const delegationRecord = delegationRecordPdaFromDelegatedAccount(canvasStatePda);
    const buffer = delegateBufferPdaFromDelegatedAccountAndOwnerProgram(canvasStatePda, program.programId);
    const delegationMetadata = delegationMetadataPdaFromDelegatedAccount(canvasStatePda);

    const tx = await program.methods.delegate()
      .accounts({
        canvasState: canvasStatePda,
        payer: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .remainingAccounts([
        { pubkey: buffer, isWritable: true, isSigner: false },
        { pubkey: delegationRecord, isWritable: true, isSigner: false },
        { pubkey: delegationMetadata, isWritable: true, isSigner: false }
      ])
      .rpc();
    
    return tx;
  };

  const updateElement = async (
    elementId: number,
    type: number,
    x: number,
    y: number,
    w: number,
    h: number,
    color: number[]
  ) => {
    if (!erProgram || !canvasStatePda || !wallet.publicKey) {
      throw new Error("ER Program not initialized or wallet not connected");
    }
    
    const { blockhash } = await erConnection.getLatestBlockhash();
    
    const ix = await erProgram.methods.updateElement(
      elementId,
      type,
      x,
      y,
      w,
      h,
      color
    )
    .accounts({
      canvasState: canvasStatePda,
      authority: BURNER_WALLET.publicKey,
    })
    .instruction();

    const messageV0 = new TransactionMessage({
      payerKey: BURNER_WALLET.publicKey,
      recentBlockhash: blockhash,
      instructions: [ix],
    }).compileToV0Message();

    const tx = new VersionedTransaction(messageV0);
    tx.sign([BURNER_WALLET]);
    const txId = await erConnection.sendRawTransaction(tx.serialize(), { skipPreflight: true });
    
    return txId;
  };

  const saveSnapshot = async () => {
    if (!erProgram || !canvasStatePda || !wallet.publicKey) {
      throw new Error("L1 Program not initialized or wallet not connected");
    }
    
    // Commit the state to ER (Note: This is an L1 instruction)
    const txId = await program.methods.saveVersionSnapshot()
      .accounts({
        canvasState: canvasStatePda,
        payer: wallet.publicKey,
        magicContext: MAGIC_CONTEXT_ID,
        magicProgram: MAGIC_PROGRAM_ID,
      })
      .rpc();
      
    return txId;
  };

  const publishAndUndelegate = async () => {
    if (!erProgram || !canvasStatePda || !wallet.publicKey) {
      throw new Error("L1 Program not initialized or wallet not connected");
    }
    
    // Finalize state on ER and undelegate back to L1 (Note: This is an L1 instruction)
    const txId = await program.methods.publishAndUndelegate()
      .accounts({
        canvasState: canvasStatePda,
        payer: wallet.publicKey,
        magicContext: MAGIC_CONTEXT_ID,
        magicProgram: MAGIC_PROGRAM_ID,
      })
      .rpc();
      
    return txId;
  };

  const fetchCanvasState = useCallback(async () => {
    if (!erProgram || !canvasStatePda) return null;
    try {
      // Must fetch from ER program to get the latest delegated state
      const state = await (erProgram.account as any).canvasState.fetch(canvasStatePda);
      return state;
    } catch (e) {
      console.warn("Failed to fetch canvas state (may not exist yet):", e);
      return null;
    }
  }, [erProgram, canvasStatePda]);

  // Real-time listeners (Polling fallback for ER)
  useEffect(() => {
    if (!erProgram || !canvasStatePda) return;
    
    // MagicBlock ER RPC does not support WSS Anchor events reliably on Devnet
    // Using polling as a robust fallback for real-time collaboration
    let lastStateStr = "";
    
    const pollInterval = setInterval(async () => {
      try {
        const state = await fetchCanvasState();
        if (state) {
          const newStateStr = JSON.stringify(state.elements);
          if (newStateStr !== lastStateStr) {
            lastStateStr = newStateStr;
            // Dispatch a batch update so the frontend re-renders
            window.dispatchEvent(new CustomEvent('magicstudio:BatchUpdated', { 
              detail: { editor: PublicKey.default } 
            }));
          }
        }
      } catch (e) {
        // Silent catch for polling
      }
    }, 1000); // Poll every 1 second
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [erProgram, canvasStatePda]);

  return {
    program,
    erProgram,
    canvasStatePda,
    initializeCanvas,
    delegateToER,
    updateElement,
    saveSnapshot,
    publishAndUndelegate,
    fetchCanvasState,
    checkIfDelegated
  };
}
