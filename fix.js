import fs from 'fs';

const idl = JSON.parse(fs.readFileSync('/Users/admin/magicstudio/target/idl/magicstudio.json', 'utf8'));

// Move the account definition from idl.accounts to idl.types
const canvasStateAccount = idl.accounts.find(a => a.name === "CanvasState");
if (canvasStateAccount && canvasStateAccount.type) {
    // Add to types
    if (!idl.types) idl.types = [];
    idl.types.unshift({
        name: canvasStateAccount.name,
        type: canvasStateAccount.type
    });
    
    // Remove type from accounts array, leaving just name
    idl.accounts = idl.accounts.map(a => ({ name: a.name }));
}

// Add the program address to the root
idl.address = "5nRcojZxaqi3SYd4qBUdD8NzYPEBbWHUkbcHAACY23A2";

// Write the fixed IDL back
fs.writeFileSync('/Users/admin/magicstudio-frontend/MagicStudio/src/idl/magicstudio.ts', `export const IDL = ${JSON.stringify(idl, null, 2)} as const;\nexport type MagicStudio = typeof IDL;\n`);
console.log("IDL fully upgraded to 0.30+ format!");
