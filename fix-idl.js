import fs from 'fs';
const idl = JSON.parse(fs.readFileSync('/Users/admin/magicstudio/target/idl/magicstudio.json', 'utf8'));
idl.metadata = { address: "5nRcojZxaqi3SYd4qBUdD8NzYPEBbWHUkbcHAACY23A2" };
fs.writeFileSync('/Users/admin/magicstudio-frontend/MagicStudio/src/idl/magicstudio.ts', `export const IDL = ${JSON.stringify(idl, null, 2)} as const;\nexport type MagicStudio = typeof IDL;\n`);
console.log("IDL fixed!");
