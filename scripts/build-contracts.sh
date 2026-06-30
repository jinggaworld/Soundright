#!/bin/bash
set -e

echo "🔨 Building SoundRight Smart Contracts..."

# Check if cargo-odra is installed
if ! command -v cargo-odra &> /dev/null; then
    echo "❌ cargo-odra not found. Install it with:"
    echo "   cargo install cargo-odra"
    exit 1
fi

# Build RoyaltyToken
echo "Building RoyaltyToken..."
cd contracts/royalty-token
cargo odra build -b casper-test
cd ../..
echo "✅ RoyaltyToken built"

# Build StreamOracle
echo "Building StreamOracle..."
cd contracts/oracle
cargo odra build -b casper-test
cd ../..
echo "✅ StreamOracle built"

# Build RoyaltyDistributor
echo "Building RoyaltyDistributor..."
cd contracts/distributor
cargo odra build -b casper-test
cd ../..
echo "✅ RoyaltyDistributor built"

echo ""
echo "✅ All contracts built successfully!"
echo ""
echo "WASM files:"
find contracts/ -name "*.wasm" -type f
