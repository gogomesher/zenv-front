
const TonWeb = require('tonweb');

async function debugSerialization() {
    const tonweb = new TonWeb();

    // Test values
    const opcode = 0x2e8001b1;
    const envelopeId = 123;
    const requestHash = "0x" + "1".repeat(64); // 256 bits
    const amount = "1000000000"; // 1 TON

    // Construct cell similar to Go implementation
    const cell = new TonWeb.boc.Cell();
    cell.bits.writeUint(opcode, 32);
    cell.bits.writeUint(envelopeId, 256);
    cell.bits.writeUint(new TonWeb.utils.BN(requestHash), 256);
    cell.bits.writeCoins(new TonWeb.utils.BN(amount));

    console.log("Cell bits length:", cell.bits.length);
    console.log("Expected length:", 32 + 256 + 256 + 4 + 32); // Opcode + EnvId + Hash + Coins(len+val)

    // Print hex
    const boc = await cell.toBoc();
    console.log("BOC Hex:", TonWeb.utils.bytesToHex(boc));
}

debugSerialization();
