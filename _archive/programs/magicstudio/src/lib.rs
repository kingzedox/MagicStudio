use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};
use anchor_lang::solana_program::program::invoke_signed;

declare_id!("5nRcojZxaqi3SYd4qBUdD8NzYPEBbWHUkbcHAACY23A2");

pub mod delegation_program {
    use anchor_lang::prelude::declare_id;
    declare_id!("DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh");
}
pub mod magic_program {
    use anchor_lang::prelude::declare_id;
    declare_id!("Magic11111111111111111111111111111111111111");
}

use borsh::BorshSerialize;

#[derive(BorshSerialize)]
pub struct DelegateArgs {
    pub commit_frequency_ms: u32,
    pub seeds: Vec<Vec<u8>>,
    pub validator: Option<Pubkey>,
}

#[program]
pub mod magicstudio {
    use super::*;

    pub fn initialize_canvas(ctx: Context<InitializeCanvas>, room_id: String) -> Result<()> {
        let canvas = &mut ctx.accounts.canvas_state;
        canvas.room_id = room_id;
        canvas.elements = Vec::new();
        Ok(())
    }

    pub fn delegate(ctx: Context<DelegateInput>) -> Result<()> {
        let room_id = {
            let data = ctx.accounts.canvas_state.try_borrow_data()?;
            let mut data_slice: &[u8] = &data;
            let state = CanvasState::try_deserialize(&mut data_slice)?;
            state.room_id.clone()
        };
        let (pda, bump) = Pubkey::find_program_address(&[b"canvas", room_id.as_bytes()], ctx.program_id);
        require_keys_eq!(pda, ctx.accounts.canvas_state.key());

        let seeds = &[
            b"canvas",
            room_id.as_bytes(),
            &[bump],
        ];
        let signer = &[&seeds[..]];

        let args = DelegateArgs {
            commit_frequency_ms: 0,
            seeds: vec![
                b"canvas".to_vec(),
                room_id.as_bytes().to_vec(),
                vec![bump],
            ],
            validator: None,
        };
        let mut data = vec![0, 0, 0, 0, 0, 0, 0, 0]; // delegate_account discriminator
        args.serialize(&mut data).unwrap();

        let ix = Instruction {
            program_id: ctx.accounts.delegation_program.key(),
            accounts: vec![
                AccountMeta::new(ctx.accounts.payer.key(), true),
                AccountMeta::new(ctx.accounts.canvas_state.key(), true),
                AccountMeta::new_readonly(ctx.accounts.owner_program.key(), false),
                AccountMeta::new(ctx.accounts.buffer.key(), false),
                AccountMeta::new(ctx.accounts.delegation_record.key(), false),
                AccountMeta::new(ctx.accounts.delegation_metadata.key(), false),
                AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
            ],
            data,
        };

        invoke_signed(
            &ix,
            &[
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.canvas_state.to_account_info(),
                ctx.accounts.buffer.to_account_info(),
                ctx.accounts.delegation_record.to_account_info(),
                ctx.accounts.delegation_metadata.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.delegation_program.to_account_info(),
                ctx.accounts.magic_program_engine.to_account_info(),
            ],
            signer
        )?;
        
        Ok(())
    }

    pub fn save_version_snapshot(_ctx: Context<CommitCanvas>) -> Result<()> {
        Ok(()) 
    }

    pub fn publish_and_undelegate(ctx: Context<CommitCanvas>) -> Result<()> {
        let ix = Instruction {
            program_id: ctx.accounts.magic_program.key(),
            accounts: vec![
                AccountMeta::new(ctx.accounts.canvas_state.key(), true),
                AccountMeta::new_readonly(ctx.accounts.magic_context.key(), false),
                AccountMeta::new(ctx.accounts.payer.key(), true),
            ],
            data: vec![9, 108, 132, 87, 184, 76, 98, 84], // commit_and_undelegate
        };

        let room_id = ctx.accounts.canvas_state.room_id.clone();
        let (pda, bump) = Pubkey::find_program_address(&[b"canvas", room_id.as_bytes()], ctx.program_id);
        require_keys_eq!(pda, ctx.accounts.canvas_state.key());

        let seeds = &[
            b"canvas",
            room_id.as_bytes(),
            &[bump],
        ];
        let signer = &[&seeds[..]];

        invoke_signed(
            &ix,
            &[
                ctx.accounts.canvas_state.to_account_info(),
                ctx.accounts.magic_context.to_account_info(),
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.magic_program.to_account_info(),
            ],
            signer
        )?;
        Ok(())
    }

    pub fn update_element(
        ctx: Context<UpdateCanvas>, 
        element_id: u32, 
        element_type: u8, 
        x: i32, 
        y: i32, 
        w: i32, 
        h: i32, 
        color_rgb: [u8; 3]
    ) -> Result<()> {
        let canvas = &mut ctx.accounts.canvas_state;
        
        // Find if element already exists
        let mut found = false;
        for el in canvas.elements.iter_mut() {
            if el.id == element_id {
                el.element_type = element_type;
                el.x = x;
                el.y = y;
                el.w = w;
                el.h = h;
                el.color_rgb = color_rgb;
                found = true;
                break;
            }
        }

        // If not found, push it, ensuring we don't exceed a safe capacity for the 10000 byte account
        if !found {
            require!(canvas.elements.len() < 350, CanvasError::CanvasFull);
            canvas.elements.push(Element {
                id: element_id,
                element_type,
                x,
                y,
                w,
                h,
                color_rgb,
            });
        }
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(room_id: String)]
pub struct InitializeCanvas<'info> {
    #[account(
        init,
        payer = payer,
        space = 10000,
        seeds = [b"canvas", room_id.as_bytes()],
        bump
    )]
    pub canvas_state: Account<'info, CanvasState>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DelegateInput<'info> {
    /// CHECK: We manually verify this account's PDA derivation
    #[account(mut)]
    pub canvas_state: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    
    /// CHECK: buffer account
    #[account(mut)]
    pub buffer: UncheckedAccount<'info>,
    /// CHECK: delegation record
    #[account(mut)]
    pub delegation_record: UncheckedAccount<'info>,
    /// CHECK: delegation metadata
    #[account(mut)]
    pub delegation_metadata: UncheckedAccount<'info>,
    /// CHECK: delegation program
    #[account(address = crate::delegation_program::ID)]
    pub delegation_program: UncheckedAccount<'info>,
    /// CHECK: magic program (MagicBlock Engine)
    #[account(address = crate::magic_program::ID)]
    pub magic_program_engine: UncheckedAccount<'info>,
    /// CHECK: owner program (this program)
    #[account(address = crate::ID)]
    pub owner_program: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct CommitCanvas<'info> {
    #[account(mut)]
    pub canvas_state: Account<'info, CanvasState>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: magic context
    pub magic_context: UncheckedAccount<'info>,
    /// CHECK: magic program
    #[account(address = crate::magic_program::ID)]
    pub magic_program: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct UpdateCanvas<'info> {
    #[account(mut)]
    pub canvas_state: Account<'info, CanvasState>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Default)]
pub struct Element {
    pub id: u32,
    pub element_type: u8,
    pub x: i32,
    pub y: i32,
    pub w: i32,
    pub h: i32,
    pub color_rgb: [u8; 3],
}

#[account]
pub struct CanvasState {
    pub room_id: String,
    pub elements: Vec<Element>,
}

#[error_code]
pub enum CanvasError {
    #[msg("Invalid pixel index")]
    InvalidPixelIndex,
    #[msg("Canvas is full")]
    CanvasFull,
}
