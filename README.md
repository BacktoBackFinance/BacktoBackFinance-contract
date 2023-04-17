# BacktoBack Finance contract 

This repo contains the contracts of BacktoBack Finance. 

## Steps
https://etherscan.io/txs?a=0xa850535d3628cd4dfeb528dc85cfa93051ff2984&p=2


### Deployment
- deploy PriceFeed
- deploy SortedTroves
- deploy TroveManager
- Deploy ActivePool
- Deploy StabilityPool
- Deploy GasPool
- Deploy DefaultPool
- Deploy CollSurplusPool
- Deploy BorrowerOperations
- Deploy HintHelpers
- Deploy TellorCaller
- Deploy LUSD Token
Optional staking part: 
- Create Pair Uniswap v2
- Deploy UniPool
- Deploy LQTYStaking
- Deploy LockupContractFactory
- Deploy CommunityIssuance
- Deploy LQTYToken
### Settings
- Set Address (PriceFeed)
- Set Params (SortedTroves)
- Set Address (TroveManager)
- Set Address (BorrowerOperations)
- Set Address (StabilityPool)
- Set Address (ActivePool)
- Set Address (DefaultPool)
- Set Address (CollSurplusPool)
- Set Address (HintHelpers)
Optional staking part: 
- Set LQTY Token (LockupContractFactory)
- Set Address (LQTYStaking)
- Set Address (CommunityIssuance)
- deploy MultiTroveGetter
- Set Params (UniPool)
- Deploy LockUp Contract (LockupContractFactory)

## Todo
- Swith Solidity Verison 0.6.11 ---> 0.8
- Swith ETH ---> IB01
- Test Files

## Functionality

- Vault
- Swap
- Redeem & Mint

## Installing

```shell
    npm install
```

## Available script
*Compile*
```shell
    npm run compile
```
*test*
```shell
    npm run test
```

*lint*
```shell
    npm run lint
```