import { CHAIN_CONFIG } from './chain_config.js';

/**
 * Recovers a Solana envelope (withdraws remaining funds to creator).
 * @param {string|number} envelopeId - The ID of the envelope to recover.
 * @param {string} programAddress - The zEnvelope program address.
 */
export async function recoverSolanaEnvelope(envelopeId, programAddress) {
    console.log(`Attempting to recover envelope #${envelopeId} from program ${programAddress}`);

    if (!window.solana || !window.solana.isConnected) {
        throw new Error("Solana wallet not connected");
    }

    const connection = new solanaWeb3.Connection(CHAIN_CONFIG['solana'].rpcUrl, 'confirmed');
    const walletPublicKey = new solanaWeb3.PublicKey(window.solana.publicKey.toString());
    const programId = new solanaWeb3.PublicKey(programAddress);

    // Derive envelope PDA
    // seeds = [b"envelope", envelopeId (u64 LE)]
    const envelopeIdBn = BigInt(envelopeId);
    const envelopeIdBuffer = Buffer.alloc(8);
    envelopeIdBuffer.writeBigUInt64LE(envelopeIdBn);

    const [envelopePda] = solanaWeb3.PublicKey.findProgramAddressSync(
        [Buffer.from('envelope'), envelopeIdBuffer],
        programId
    );
    console.log("Envelope PDA:", envelopePda.toBase58());

    // Check if envelope exists and fetch data to determine if it's SPL or Native
    const envelopeAccountInfo = await connection.getAccountInfo(envelopePda);
    if (!envelopeAccountInfo) {
        throw new Error("Envelope account not found");
    }

    // Parse envelope data to check for token_mint (Option<Pubkey>)
    // Layout:
    // discriminator: 8
    // id: 8
    // creator: 32
    // password_hash: 4 + len (vec)
    // token_mint: 1 + 32 (Option<Pubkey>)
    // ...
    
    // We need to find where token_mint is.
    // Since password_hash is variable length (Vec<u8>), we need to read its length first.
    const data = envelopeAccountInfo.data;
    let offset = 8 + 8 + 32; // Skip discriminator, id, creator
    
    const passwordHashLen = data.readUInt32LE(offset);
    offset += 4 + passwordHashLen;

    const hasTokenMint = data.readUInt8(offset) === 1;
    offset += 1;
    
    let tokenMint = null;
    let envelopeTokenVault = null;
    let creatorTokenAccount = null;

    if (hasTokenMint) {
        tokenMint = new solanaWeb3.PublicKey(data.slice(offset, offset + 32));
        console.log("SPL Token Envelope. Mint:", tokenMint.toBase58());
        
        // Derive envelope token vault PDA
        // seeds = [b"envelope_vault", envelope_key]
        const [vaultPda] = solanaWeb3.PublicKey.findProgramAddressSync(
            [Buffer.from('envelope_vault'), envelopePda.toBuffer()],
            programId
        );
        envelopeTokenVault = vaultPda;

        // Get creator's token account
        // We assume the associated token account
        const associatedTokenAccount = await solanaWeb3.PublicKey.findProgramAddress(
            [
                walletPublicKey.toBuffer(),
                solanaWeb3.TOKEN_PROGRAM_ID.toBuffer(),
                tokenMint.toBuffer()
            ],
            new solanaWeb3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL") // SPL Associated Token Account Program ID
        );
        creatorTokenAccount = associatedTokenAccount[0];
    } else {
        console.log("Native SOL Envelope");
    }

    // Construct Instruction
    // Discriminator for recover_envelope: 3e61ca838588d2fb
    const discriminator = Buffer.from([0x3e, 0x61, 0xca, 0x83, 0x85, 0x88, 0xd2, 0xfb]);
    
    const keys = [
        { pubkey: envelopePda, isSigner: false, isWritable: true },
        { pubkey: walletPublicKey, isSigner: true, isWritable: true },
    ];

    if (hasTokenMint) {
        keys.push({ pubkey: creatorTokenAccount, isSigner: false, isWritable: true });
        keys.push({ pubkey: envelopeTokenVault, isSigner: false, isWritable: true });
    } else {
        // For native SOL, these are Option<Account>, so we pass the program ID or null?
        // In Anchor, Option<Account> usually expects the program ID if None, or just don't include them if the IDL allows?
        // Actually, for Option accounts in Anchor:
        // If None, you usually pass the program ID (System Program or Token Program) or a null-like address if allowed, 
        // but Anchor client usually handles this.
        // In raw web3.js, we must provide keys matching the instruction definition.
        // The instruction expects:
        // 1. envelope
        // 2. creator
        // 3. creator_token_account (Option)
        // 4. envelope_token_vault (Option)
        // 5. system_program
        // 6. token_program
        
        // If None, we typically pass the SystemProgram ID or the program ID itself as a placeholder, 
        // but strictly speaking, we should check how Anchor deserializes Option accounts.
        // Anchor expects a boolean flag (1 byte) in the instruction data if it's an argument, 
        // but here they are Accounts.
        // For Accounts, if it's Option, you can pass `program_id` (the executing program) or `system_program` as a placeholder 
        // if the account is not needed.
        // However, looking at the `RecoverEnvelope` struct:
        // pub creator_token_account: Option<Account<'info, TokenAccount>>,
        // pub envelope_token_vault: Option<Account<'info, TokenAccount>>,
        
        // If we are in Native mode, we should pass `null` or a placeholder?
        // In raw transaction, we must provide 6 keys.
        // If we pass the SystemProgram ID for the optional accounts, Anchor will try to deserialize them as TokenAccount and fail 
        // UNLESS we don't provide them at all?
        // No, the accounts array must match.
        // Wait, Anchor's `Option<Account>` handling:
        // If the account is not provided in the `keys` array, it might error "Not enough account keys".
        // If provided, it tries to deserialize.
        // BUT, if we look at `lib.rs`:
        // `if let Some(_) = envelope.token_mint { ... } else { ... }`
        // The code checks `envelope.token_mint`.
        // It does NOT check if `creator_token_account` is set in the accounts struct logic (it's checked in the `if` block implicitly by usage).
        // However, Anchor's deserialization runs BEFORE the function body.
        // `Option<Account>` means it's optional.
        // If we pass a key that is NOT owned by Token Program, deserialization might fail?
        // Actually, `Option<Account>` allows the account to be missing (program ID) OR be present.
        // If we pass the System Program ID, Anchor sees it's not the expected owner/type and might treat it as None?
        // Let's try passing SystemProgram ID for the optional token accounts when Native.
        
        keys.push({ pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false }); // creator_token_account placeholder
        keys.push({ pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false }); // envelope_token_vault placeholder
    }

    keys.push({ pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false });
    keys.push({ pubkey: solanaWeb3.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });

    const transaction = new solanaWeb3.Transaction();
    transaction.add(new solanaWeb3.TransactionInstruction({
        keys: keys,
        programId: programId,
        data: discriminator
    }));

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletPublicKey;

    const signedTx = await window.solana.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTx.serialize());
    
    console.log("Recovery Transaction Sent:", signature);
    
    const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
    });

    if (confirmation.value.err) {
        throw new Error("Transaction failed: " + JSON.stringify(confirmation.value.err));
    }

    console.log("Envelope recovered successfully!");
    return signature;
}
