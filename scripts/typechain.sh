#!/bin/bash


cd ../LimitOrderTestnet
npx typechain --target ethers-v5 --out-dir ../limitorders_relayer_testnet/src/contracts/new "deployments/rsktestnet/*.json"
