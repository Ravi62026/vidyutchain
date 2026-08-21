use anchor_lang::prelude::*;

declare_id!("7qKfy4B4n2jLfwwEsTdrBniqy1vBrbiZAfx51y9Kres8");

#[program]
pub mod marketplace {
    use super::*;

    pub fn list_product(ctx: Context<ListProduct>, product_name: String, price: u64) -> Result<()> {
        msg!("Listing product: {} for {} lamports", product_name, price);
        let product = &mut ctx.accounts.product;

        product.seller = ctx.accounts.seller.key();
        product.product_name = product_name;
        product.price = price;
        product.is_sold = false;

        Ok(())
    }

    pub fn buy_product(ctx: Context<BuyProduct>) -> Result<()> {
        msg!(
            "Buying product from seller: {:?}",
            ctx.accounts.product.seller
        );

        let product = &mut ctx.accounts.product;
        require!(!product.is_sold, MarketplaceError::AlreadySold);

        // Mark product as sold and record buyer
        product.is_sold = true;
        product.buyer = Some(ctx.accounts.buyer.key());

        msg!("Product purchased successfully.");

        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct Product {
    pub seller: Pubkey,
    pub buyer: Option<Pubkey>,
    #[max_len(64)]
    pub product_name: String,
    pub price: u64, // in lamports
    pub is_sold: bool,
}

#[derive(Accounts)]
#[instruction(product_name: String, price: u64)]
pub struct ListProduct<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    #[account(
        init,
        payer = seller,
        space = 8 + Product::INIT_SPACE,
        seeds = [product_name.as_bytes(), seller.key().as_ref()],
        bump
    )]
    pub product: Account<'info, Product>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyProduct<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        mut,
        constraint = !product.is_sold @ MarketplaceError::AlreadySold,
    )]
    pub product: Account<'info, Product>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum MarketplaceError {
    #[msg("Product has already been sold.")]
    AlreadySold,
}
