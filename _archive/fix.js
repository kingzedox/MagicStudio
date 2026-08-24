const fs = require('fs');
let code = fs.readFileSync('/Users/admin/magicstudio/programs/magicstudio/src/lib.rs', 'utf8');
code = code.replace(
`pub mod magicblock {
    use anchor_lang::prelude::declare_id;
    pub mod delegation_program {
        declare_id!("DEL15yxPE6d1k4ZELXQj1pZgNudwQv5yRByv4Gg13R");
    }
    pub mod magic_program {
        declare_id!("MAG1CYQjcQkEbq8N856GZpYQYm58B7e1E4s952KXYyC");
    }
}`,
`pub mod magicblock {
    use anchor_lang::prelude::*;
    pub const DELEGATION_PROGRAM_ID: Pubkey = pubkey!("DEL15yxPE6d1k4ZELXQj1pZgNudwQv5yRByv4Gg13R");
    pub const MAGIC_PROGRAM_ID: Pubkey = pubkey!("MAG1CYQjcQkEbq8N856GZpYQYm58B7e1E4s952KXYyC");
}`
);
code = code.replace(`address = magicblock::delegation_program::ID`, `address = crate::magicblock::DELEGATION_PROGRAM_ID`);
code = code.replace(`address = magicblock::magic_program::ID`, `address = crate::magicblock::MAGIC_PROGRAM_ID`);
fs.writeFileSync('/Users/admin/magicstudio/programs/magicstudio/src/lib.rs', code);
