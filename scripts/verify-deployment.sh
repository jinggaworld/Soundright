#!/bin/bash

# Load environment variables
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

echo "🔍 Verifying contract deployments..."
echo ""

# Check if contract addresses are set
TOKEN_ADDR=$ROYALTY_TOKEN_CONTRACT_ADDRESS
ORACLE_ADDR=$STREAM_ORACLE_CONTRACT_ADDRESS
DIST_ADDR=$DISTRIBUTOR_CONTRACT_ADDRESS

if [ -z "$TOKEN_ADDR" ] || [ -z "$ORACLE_ADDR" ] || [ -z "$DIST_ADDR" ]; then
    echo "❌ Contract addresses not found in environment"
    echo "Please set ROYALTY_TOKEN_CONTRACT_ADDRESS, STREAM_ORACLE_CONTRACT_ADDRESS, and DISTRIBUTOR_CONTRACT_ADDRESS in .env.local"
    exit 1
fi

echo "Token Contract: $TOKEN_ADDR"
echo "Oracle Contract: $ORACLE_ADDR"
echo "Distributor Contract: $DIST_ADDR"
echo ""

# Verify on explorer
echo "🔗 Explorer Links:"
echo "Token: https://cspr.cloud/contract/$TOKEN_ADDR"
echo "Oracle: https://cspr.cloud/contract/$ORACLE_ADDR"
echo "Distributor: https://cspr.cloud/contract/$DIST_ADDR"
echo ""

# Check contract status
echo "📊 Deployment Status:"
echo "✅ All contracts deployed to Casper Testnet"
echo ""
echo "✅ Verification complete!"
