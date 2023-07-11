const SortedTroves = artifacts.require("./SortedTroves.sol")
const TroveManager = artifacts.require("./TroveManager.sol")
const PriceFeedTestnet = artifacts.require("./PriceFeedTestnet.sol")
const BUSDCToken = artifacts.require("./BUSDCToken.sol")
const ActivePool = artifacts.require("./ActivePool.sol");
const DefaultPool = artifacts.require("./DefaultPool.sol");
const StabilityPool = artifacts.require("./StabilityPool.sol")
const GasPool = artifacts.require("./GasPool.sol")
const CollSurplusPool = artifacts.require("./CollSurplusPool.sol")
const FunctionCaller = artifacts.require("./TestContracts/FunctionCaller.sol")
const BorrowerOperations = artifacts.require("./BorrowerOperations.sol")
const HintHelpers = artifacts.require("./HintHelpers.sol")

const B2BStaking = artifacts.require("./B2BStaking.sol")
const B2BToken = artifacts.require("./B2BToken.sol")
const LockupContractFactory = artifacts.require("./LockupContractFactory.sol")
const CommunityIssuance = artifacts.require("./CommunityIssuance.sol")
const SanctionsListMock = artifacts.require("./SanctionsListMock.sol")
const BackedFactory = artifacts.require("./BackedFactory.sol")
const BackedToken = artifacts.require("./BackedTokenImplementation.sol")

const Unipool =  artifacts.require("./Unipool.sol")

const B2BTokenTester = artifacts.require("./B2BTokenTester.sol")
const CommunityIssuanceTester = artifacts.require("./CommunityIssuanceTester.sol")
const StabilityPoolTester = artifacts.require("./StabilityPoolTester.sol")
const ActivePoolTester = artifacts.require("./ActivePoolTester.sol")
const DefaultPoolTester = artifacts.require("./DefaultPoolTester.sol")
const LiquityMathTester = artifacts.require("./LiquityMathTester.sol")
const BorrowerOperationsTester = artifacts.require("./BorrowerOperationsTester.sol")
const TroveManagerTester = artifacts.require("./TroveManagerTester.sol")
const BUSDCTokenTester = artifacts.require("./BUSDCTokenTester.sol")
const StableMintControllerTester = artifacts.require("./StableMintControllerTester.sol")

// Proxy scripts
const BorrowerOperationsScript = artifacts.require('BorrowerOperationsScript')
const BorrowerWrappersScript = artifacts.require('BorrowerWrappersScript')
const TroveManagerScript = artifacts.require('TroveManagerScript')
const StabilityPoolScript = artifacts.require('StabilityPoolScript')
const TokenScript = artifacts.require('TokenScript')
const B2BStakingScript = artifacts.require('B2BStakingScript')
const {
  buildUserProxies,
  BorrowerOperationsProxy,
  BorrowerWrappersProxy,
  TroveManagerProxy,
  StabilityPoolProxy,
  SortedTrovesProxy,
  TokenProxy,
  B2BStakingProxy
} = require('../utils/proxyHelpers.js')

const testHelpers = require("../utils/testHelpers.js")

const th = testHelpers.TestHelper
const dec = th.dec

/* "Liquity core" consists of all contracts in the core Liquity system.

B2B contracts consist of only those contracts related to the B2B Token:

-the B2B token
-the Lockup factory and lockup contracts
-the B2BStaking contract
-the CommunityIssuance contract
*/

const ZERO_ADDRESS = '0x' + '0'.repeat(40)
const maxBytes32 = '0x' + 'f'.repeat(64)

class DeploymentHelper {

  static async deployLiquityCore(owner) {
    const cmdLineArgs = process.argv
    const frameworkPath = cmdLineArgs[1]
    // console.log(`Framework used:  ${frameworkPath}`)

    if (frameworkPath.includes("hardhat")) {
      return this.deployLiquityCoreHardhat(owner)
    } else if (frameworkPath.includes("truffle")) {
      return this.deployLiquityCoreTruffle()
    }
  }

  static async deployB2BContracts(bountyAddress, lpRewardsAddress, multisigAddress) {
    const cmdLineArgs = process.argv
    const frameworkPath = cmdLineArgs[1]
    // console.log(`Framework used:  ${frameworkPath}`)

    if (frameworkPath.includes("hardhat")) {
      return this.deployB2BContractsHardhat(bountyAddress, lpRewardsAddress, multisigAddress)
    } else if (frameworkPath.includes("truffle")) {
      return this.deployB2BContractsTruffle(bountyAddress, lpRewardsAddress, multisigAddress)
    }
  }

  static async deployLiquityCoreHardhat(owner) {
    const priceFeedTestnet = await PriceFeedTestnet.new()
    const sortedTroves = await SortedTroves.new()
    const troveManager = await TroveManager.new()
    const activePool = await ActivePool.new()
    const stabilityPool = await StabilityPool.new()
    const gasPool = await GasPool.new()
    const defaultPool = await DefaultPool.new()
    const collSurplusPool = await CollSurplusPool.new()
    const functionCaller = await FunctionCaller.new()
    const borrowerOperations = await BorrowerOperations.new()
    const hintHelpers = await HintHelpers.new()
    const busdcToken = await BUSDCToken.new(
      troveManager.address,
      stabilityPool.address,
      borrowerOperations.address
    )
    const sanctionsListMock = await SanctionsListMock.new()
    const backedFactory = await BackedFactory.new(owner)
    const tx = await backedFactory.deployToken("Backed IB01", "IB01", owner, owner, owner, owner, sanctionsListMock.address)
    const backedToken = await BackedToken.at(tx.logs[2].args.newToken)
    await backedToken.mint(owner, dec(10000, 'ether'), {from: owner})
    const stableMintControllerTester = await StableMintControllerTester.new()

    BUSDCToken.setAsDeployed(busdcToken)
    DefaultPool.setAsDeployed(defaultPool)
    PriceFeedTestnet.setAsDeployed(priceFeedTestnet)
    SortedTroves.setAsDeployed(sortedTroves)
    TroveManager.setAsDeployed(troveManager)
    ActivePool.setAsDeployed(activePool)
    StabilityPool.setAsDeployed(stabilityPool)
    GasPool.setAsDeployed(gasPool)
    CollSurplusPool.setAsDeployed(collSurplusPool)
    FunctionCaller.setAsDeployed(functionCaller)
    BorrowerOperations.setAsDeployed(borrowerOperations)
    HintHelpers.setAsDeployed(hintHelpers)
    SanctionsListMock.setAsDeployed(sanctionsListMock)
    StableMintControllerTester.setAsDeployed(stableMintControllerTester)
    BackedFactory.setAsDeployed(backedFactory)
    BackedToken.setAsDeployed(backedToken)

    const coreContracts = {
      priceFeedTestnet,
      busdcToken,
      sortedTroves,
      troveManager,
      activePool,
      stabilityPool,
      gasPool,
      defaultPool,
      collSurplusPool,
      functionCaller,
      borrowerOperations,
      hintHelpers,
      backedToken,
      stableMintControllerTester,
    }
    return coreContracts
  }

  static async deployTesterContractsHardhat() {
    const testerContracts = {}

    // Contract without testers (yet)
    testerContracts.priceFeedTestnet = await PriceFeedTestnet.new()
    testerContracts.sortedTroves = await SortedTroves.new()
    // Actual tester contracts
    testerContracts.communityIssuance = await CommunityIssuanceTester.new()
    testerContracts.activePool = await ActivePoolTester.new()
    testerContracts.defaultPool = await DefaultPoolTester.new()
    testerContracts.stabilityPool = await StabilityPoolTester.new()
    testerContracts.gasPool = await GasPool.new()
    testerContracts.collSurplusPool = await CollSurplusPool.new()
    testerContracts.math = await LiquityMathTester.new()
    testerContracts.borrowerOperations = await BorrowerOperationsTester.new()
    testerContracts.troveManager = await TroveManagerTester.new()
    testerContracts.functionCaller = await FunctionCaller.new()
    testerContracts.hintHelpers = await HintHelpers.new()
    testerContracts.busdcToken =  await BUSDCTokenTester.new(
      testerContracts.troveManager.address,
      testerContracts.stabilityPool.address,
      testerContracts.borrowerOperations.address
    )
    return testerContracts
  }

  static async deployB2BContractsHardhat(bountyAddress, lpRewardsAddress, multisigAddress) {
    const b2bStaking = await B2BStaking.new()
    const lockupContractFactory = await LockupContractFactory.new()
    const communityIssuance = await CommunityIssuance.new()

    B2BStaking.setAsDeployed(b2bStaking)
    LockupContractFactory.setAsDeployed(lockupContractFactory)
    CommunityIssuance.setAsDeployed(communityIssuance)

    // Deploy B2B Token, passing Community Issuance and Factory addresses to the constructor
    const b2bToken = await B2BToken.new(
      communityIssuance.address,
      b2bStaking.address,
      lockupContractFactory.address,
      bountyAddress,
      lpRewardsAddress,
      multisigAddress
    )
    B2BToken.setAsDeployed(b2bToken)

    const B2BContracts = {
      b2bStaking,
      lockupContractFactory,
      communityIssuance,
      b2bToken
    }
    return B2BContracts
  }

  static async deployB2BTesterContractsHardhat(bountyAddress, lpRewardsAddress, multisigAddress) {
    const b2bStaking = await B2BStaking.new()
    const lockupContractFactory = await LockupContractFactory.new()
    const communityIssuance = await CommunityIssuanceTester.new()

    B2BStaking.setAsDeployed(b2bStaking)
    LockupContractFactory.setAsDeployed(lockupContractFactory)
    CommunityIssuanceTester.setAsDeployed(communityIssuance)

    // Deploy B2B Token, passing Community Issuance and Factory addresses to the constructor
    const b2bToken = await B2BTokenTester.new(
      communityIssuance.address,
      b2bStaking.address,
      lockupContractFactory.address,
      bountyAddress,
      lpRewardsAddress,
      multisigAddress
    )
    B2BTokenTester.setAsDeployed(b2bToken)

    const B2BContracts = {
      b2bStaking,
      lockupContractFactory,
      communityIssuance,
      b2bToken
    }
    return B2BContracts
  }

  static async deployLiquityCoreTruffle() {
    const priceFeedTestnet = await PriceFeedTestnet.new()
    const sortedTroves = await SortedTroves.new()
    const troveManager = await TroveManager.new()
    const activePool = await ActivePool.new()
    const stabilityPool = await StabilityPool.new()
    const gasPool = await GasPool.new()
    const defaultPool = await DefaultPool.new()
    const collSurplusPool = await CollSurplusPool.new()
    const functionCaller = await FunctionCaller.new()
    const borrowerOperations = await BorrowerOperations.new()
    const hintHelpers = await HintHelpers.new()
    const busdcToken = await BUSDCToken.new(
      troveManager.address,
      stabilityPool.address,
      borrowerOperations.address
    )
    const coreContracts = {
      priceFeedTestnet,
      busdcToken,
      sortedTroves,
      troveManager,
      activePool,
      stabilityPool,
      gasPool,
      defaultPool,
      collSurplusPool,
      functionCaller,
      borrowerOperations,
      hintHelpers
    }
    return coreContracts
  }

  static async deployB2BContractsTruffle(bountyAddress, lpRewardsAddress, multisigAddress) {
    const b2bStaking = await b2bStaking.new()
    const lockupContractFactory = await LockupContractFactory.new()
    const communityIssuance = await CommunityIssuance.new()

    /* Deploy B2B Token, passing Community Issuance,  B2BStaking, and Factory addresses
    to the constructor  */
    const b2bToken = await B2BToken.new(
      communityIssuance.address,
      b2bStaking.address,
      lockupContractFactory.address,
      bountyAddress,
      lpRewardsAddress,
      multisigAddress
    )

    const B2BContracts = {
      b2bStaking,
      lockupContractFactory,
      communityIssuance,
      b2bToken
    }
    return B2BContracts
  }

  static async deployBUSDCToken(contracts) {
    contracts.busdcToken = await BUSDCToken.new(
      contracts.troveManager.address,
      contracts.stabilityPool.address,
      contracts.borrowerOperations.address
    )
    return contracts
  }

  static async deployBUSDCTokenTester(contracts) {
    contracts.busdcToken = await BUSDCTokenTester.new(
      contracts.troveManager.address,
      contracts.stabilityPool.address,
      contracts.borrowerOperations.address
    )
    return contracts
  }

  static async deployProxyScripts(contracts, B2BContracts, owner, users) {
    const proxies = await buildUserProxies(users)

    const borrowerWrappersScript = await BorrowerWrappersScript.new(
      contracts.borrowerOperations.address,
      contracts.troveManager.address,
      B2BContracts.b2bStaking.address
    )
    contracts.borrowerWrappers = new BorrowerWrappersProxy(owner, proxies, borrowerWrappersScript.address)

    const borrowerOperationsScript = await BorrowerOperationsScript.new(contracts.borrowerOperations.address)
    contracts.borrowerOperations = new BorrowerOperationsProxy(owner, proxies, borrowerOperationsScript.address, contracts.borrowerOperations)

    const troveManagerScript = await TroveManagerScript.new(contracts.troveManager.address)
    contracts.troveManager = new TroveManagerProxy(owner, proxies, troveManagerScript.address, contracts.troveManager)

    const stabilityPoolScript = await StabilityPoolScript.new(contracts.stabilityPool.address)
    contracts.stabilityPool = new StabilityPoolProxy(owner, proxies, stabilityPoolScript.address, contracts.stabilityPool)

    contracts.sortedTroves = new SortedTrovesProxy(owner, proxies, contracts.sortedTroves)

    const busdcTokenScript = await TokenScript.new(contracts.busdcToken.address)
    contracts.busdcToken = new TokenProxy(owner, proxies, busdcTokenScript.address, contracts.busdcToken)

    const b2bTokenScript = await TokenScript.new(B2BContracts.b2bToken.address)
    B2BContracts.b2bToken = new TokenProxy(owner, proxies, b2bTokenScript.address, B2BContracts.b2bToken)

    const b2bStakingScript = await B2BStakingScript.new(B2BContracts.b2bStaking.address)
    B2BContracts.b2bStaking = new B2BStakingProxy(owner, proxies, b2bStakingScript.address, B2BContracts.b2bStaking)
  }

  // Connect contracts to their dependencies
  static async connectCoreContracts(contracts, B2BContracts) {

    // set TroveManager addr in SortedTroves
    await contracts.sortedTroves.setParams(
      maxBytes32,
      contracts.troveManager.address,
      contracts.borrowerOperations.address
    )

    // set contract addresses in the FunctionCaller
    await contracts.functionCaller.setTroveManagerAddress(contracts.troveManager.address)
    await contracts.functionCaller.setSortedTrovesAddress(contracts.sortedTroves.address)

    // set contracts in the Trove Manager
    await contracts.troveManager.setAddresses(
      contracts.borrowerOperations.address,
      contracts.activePool.address,
      contracts.defaultPool.address,
      contracts.stabilityPool.address,
      contracts.gasPool.address,
      contracts.collSurplusPool.address,
      contracts.priceFeedTestnet.address,
      contracts.busdcToken.address,
      contracts.sortedTroves.address,
      B2BContracts.b2bToken.address,
      B2BContracts.b2bStaking.address,
      contracts.stableMintControllerTester.address,
    )

    // set contracts in BorrowerOperations
    await contracts.borrowerOperations.setAddresses(
      contracts.troveManager.address,
      contracts.activePool.address,
      contracts.defaultPool.address,
      contracts.stabilityPool.address,
      contracts.gasPool.address,
      contracts.collSurplusPool.address,
      contracts.priceFeedTestnet.address,
      contracts.sortedTroves.address,
      contracts.busdcToken.address,
      B2BContracts.b2bStaking.address,
      contracts.backedToken.address,
      contracts.stableMintControllerTester.address,
    )

    // set contracts in the Pools
    await contracts.stabilityPool.setAddresses(
      contracts.borrowerOperations.address,
      contracts.troveManager.address,
      contracts.activePool.address,
      contracts.busdcToken.address,
      contracts.sortedTroves.address,
      contracts.priceFeedTestnet.address,
      B2BContracts.communityIssuance.address,
      contracts.backedToken.address,
      contracts.stableMintControllerTester.address,
    )

    await contracts.activePool.setAddresses(
      contracts.borrowerOperations.address,
      contracts.troveManager.address,
      contracts.stabilityPool.address,
      contracts.defaultPool.address,
      contracts.backedToken.address,
    )

    await contracts.defaultPool.setAddresses(
      contracts.troveManager.address,
      contracts.activePool.address,
      contracts.backedToken.address,
    )

    await contracts.collSurplusPool.setAddresses(
      contracts.borrowerOperations.address,
      contracts.troveManager.address,
      contracts.activePool.address,
      contracts.backedToken.address,
    )

    // set contracts in HintHelpers
    await contracts.hintHelpers.setAddresses(
      contracts.sortedTroves.address,
      contracts.troveManager.address
    )

    await contracts.stableMintControllerTester.setAddresses(
      contracts.troveManager.address,
      contracts.stabilityPool.address,
      contracts.borrowerOperations.address,
      contracts.borrowerOperations.address,
      dec(1000, 'ether'),
      dec(1000, 'ether'),
    )
  }

  static async connectB2BContracts(B2BContracts) {
    // Set B2BToken address in LCF
    await B2BContracts.lockupContractFactory.setB2BTokenAddress(B2BContracts.b2bToken.address)
  }

  static async connectB2BContractsToCore(B2BContracts, coreContracts) {
    await B2BContracts.b2bStaking.setAddresses(
      B2BContracts.b2bToken.address,
      coreContracts.busdcToken.address,
      coreContracts.troveManager.address,
      coreContracts.borrowerOperations.address,
      coreContracts.activePool.address,
      coreContracts.backedToken.address
    )

    await B2BContracts.communityIssuance.setAddresses(
      B2BContracts.b2bToken.address,
      coreContracts.stabilityPool.address
    )
  }

  static async connectUnipool(uniPool, B2BContracts, uniswapPairAddr, duration) {
    await uniPool.setParams(B2BContracts.b2bToken.address, uniswapPairAddr, duration)
  }
}
module.exports = DeploymentHelper
