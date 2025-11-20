# Discount Code Setup Instructions

## How the 15% Off Discount Works

When customers sign up, they receive a unique discount code in the format: `WELCOME15-{UNIQUEID}`

## Setup Options

### Option 1: Create Automatic Discount in Shopify Admin (Recommended)

1. Go to Shopify Admin → Discounts → Create discount
2. Choose "Automatic discount"
3. Set discount type to "Percentage"
4. Set percentage to "15%"
5. Set customer eligibility to "First-time customers only"
6. Set usage limits to "One use per customer"
7. Save the discount

This way, any customer who signs up will automatically get 15% off on their first purchase without needing a code.

### Option 2: Create Manual Discount Codes

1. Go to Shopify Admin → Discounts → Create discount
2. Choose "Code discount"
3. Set discount type to "Percentage"
4. Set percentage to "15%"
5. Set customer eligibility to "Everyone" or "Specific customers"
6. Set usage limits to "One use per customer"
7. Create codes matching the pattern `WELCOME15-*` as customers sign up

### Option 3: Use Shopify Admin API (Advanced)

Set up a webhook or backend service that automatically creates discount codes when customers sign up using Shopify's Admin API.

## Current Implementation

The signup form generates unique discount codes for each customer. These codes are displayed on the success page. You'll need to create matching discount codes in Shopify Admin, or use the automatic discount feature (Option 1) which is the easiest solution.

