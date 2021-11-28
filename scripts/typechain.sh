#!/bin/bash


cd limitorders
npx typechain --target ethers-v5 --out-dir ../limitorders_relayer/src/contracts/new "deployments/rsktestnet/*.json"
