const deploymentHelper = require("../utils/deploymentHelpers.js")
const testHelpers = require("../utils/testHelpers.js")

const { keccak256 } = require('@ethersproject/keccak256');
const { defaultAbiCoder } = require('@ethersproject/abi');
const { toUtf8Bytes } = require('@ethersproject/strings');
const { pack } = require('@ethersproject/solidity');
const { hexlify } = require("@ethersproject/bytes");
const { ecsign } = require('ethereumjs-util');

const { toBN, assertRevert, assertAssert, dec, ZERO_ADDRESS } = testHelpers.TestHelper

const sign = (digest, privateKey) => {
  return ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(privateKey.slice(2), 'hex'))
}

const PERMIT_TYPEHASH = keccak256(
  toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
)

// Gets the EIP712 domain separator
const getDomainSeparator = (name, contractAddress, chainId, version)  => {
  return keccak256(defaultAbiCoder.encode(['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
  [
    keccak256(toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')),
    keccak256(toUtf8Bytes(name)),
    keccak256(toUtf8Bytes(version)),
    parseInt(chainId), contractAddress.toLowerCase()
  ]))
}

// Returns the EIP712 hash which should be signed by the user
// in order to make a call to `permit`
const getPermitDigest = ( name, address, chainId, version,
                          owner, spender, value ,
                          nonce, deadline ) => {

  const DOMAIN_SEPARATOR = getDomainSeparator(name, address, chainId, version)
  return keccak256(pack(['bytes1', 'bytes1', 'bytes32', 'bytes32'],
    ['0x19', '0x01', DOMAIN_SEPARATOR,
      keccak256(defaultAbiCoder.encode(
        ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
        [PERMIT_TYPEHASH, owner, spender, value, nonce, deadline])),
    ]))
}

contract('BUSDCToken', async accounts => {
  const [owner, alice, bob, carol, dennis] = accounts;

  const [bountyAddress, lpRewardsAddress, multisig] = accounts.slice(997, 1000)

  // the second account our hardhatenv creates (for Alice)
  // from https://github.com/liquity/dev/blob/main/packages/contracts/hardhatAccountsList2k.js#L3
  const alicePrivateKey = '0xeaa445c85f7b438dEd6e831d06a4eD0CEBDc2f8527f84Fcda6EBB5fCfAd4C0e9'

  let chainId
  let busdcTokenOriginal
  let busdcTokenTester
  let stabilityPool
  let troveManager
  let borrowerOperations

  let tokenName
  let tokenVersion

  const testCorpus = ({ withProxy = false }) => {
    beforeEach(async () => {

      const contracts = await deploymentHelper.deployTesterContractsHardhat(owner)


      const B2BContracts = await deploymentHelper.deployB2BContracts(bountyAddress, lpRewardsAddress, multisig)

      await deploymentHelper.connectCoreContracts(contracts, B2BContracts)
      await deploymentHelper.connectB2BContracts(B2BContracts)
      await deploymentHelper.connectB2BContractsToCore(B2BContracts, contracts)

      busdcTokenOriginal = contracts.busdcToken
      if (withProxy) {
        const users = [ alice, bob, carol, dennis ]
        await deploymentHelper.deployProxyScripts(contracts, B2BContracts, owner, users)
      }

      busdcTokenTester = contracts.busdcToken
      // for some reason this doesn’t work with coverage network
      //chainId = await web3.eth.getChainId()
      chainId = await busdcTokenOriginal.getChainId()

      stabilityPool = contracts.stabilityPool
      troveManager = contracts.stabilityPool
      borrowerOperations = contracts.borrowerOperations

      tokenVersion = await busdcTokenOriginal.version()
      tokenName = await busdcTokenOriginal.name()

      // mint some tokens
      if (withProxy) {
        await busdcTokenOriginal.unprotectedMint(busdcTokenTester.getProxyAddressFromUser(alice), 150)
        await busdcTokenOriginal.unprotectedMint(busdcTokenTester.getProxyAddressFromUser(bob), 100)
        await busdcTokenOriginal.unprotectedMint(busdcTokenTester.getProxyAddressFromUser(carol), 50)
      } else {
        await busdcTokenOriginal.unprotectedMint(alice, 150)
        await busdcTokenOriginal.unprotectedMint(bob, 100)
        await busdcTokenOriginal.unprotectedMint(carol, 50)
      }
    })

    it('balanceOf(): gets the balance of the account', async () => {
      const aliceBalance = (await busdcTokenTester.balanceOf(alice)).toNumber()
      const bobBalance = (await busdcTokenTester.balanceOf(bob)).toNumber()
      const carolBalance = (await busdcTokenTester.balanceOf(carol)).toNumber()

      assert.equal(aliceBalance, 150)
      assert.equal(bobBalance, 100)
      assert.equal(carolBalance, 50)
    })

    it('totalSupply(): gets the total supply', async () => {
      const total = (await busdcTokenTester.totalSupply()).toString()
      assert.equal(total, '300') // 300
    })

    it("name(): returns the token's name", async () => {
      const name = await busdcTokenTester.name()
      assert.equal(name, "BUSDC Stablecoin")
    })

    it("symbol(): returns the token's symbol", async () => {
      const symbol = await busdcTokenTester.symbol()
      assert.equal(symbol, "BUSDC")
    })

    it("decimal(): returns the number of decimal digits used", async () => {
      const decimals = await busdcTokenTester.decimals()
      assert.equal(decimals, "18")
    })

    it("allowance(): returns an account's spending allowance for another account's balance", async () => {
      await busdcTokenTester.approve(alice, 100, {from: bob})

      const allowance_A = await busdcTokenTester.allowance(bob, alice)
      const allowance_D = await busdcTokenTester.allowance(bob, dennis)

      assert.equal(allowance_A, 100)
      assert.equal(allowance_D, '0')
    })

    it("approve(): approves an account to spend the specified amount", async () => {
      const allowance_A_before = await busdcTokenTester.allowance(bob, alice)
      assert.equal(allowance_A_before, '0')

      await busdcTokenTester.approve(alice, 100, {from: bob})

      const allowance_A_after = await busdcTokenTester.allowance(bob, alice)
      assert.equal(allowance_A_after, 100)
    })

    if (!withProxy) {
      it("approve(): reverts when spender param is address(0)", async () => {
        const txPromise = busdcTokenTester.approve(ZERO_ADDRESS, 100, {from: bob})
        await assertAssert(txPromise)
      })

      it("approve(): reverts when owner param is address(0)", async () => {
        const txPromise = busdcTokenTester.callInternalApprove(ZERO_ADDRESS, alice, dec(1000, 18), {from: bob})
        await assertAssert(txPromise)
      })
    }

    it("transferFrom(): successfully transfers from an account which is it approved to transfer from", async () => {
      const allowance_A_0 = await busdcTokenTester.allowance(bob, alice)
      assert.equal(allowance_A_0, '0')

      await busdcTokenTester.approve(alice, 50, {from: bob})

      // Check A's allowance of Bob's funds has increased
      const allowance_A_1= await busdcTokenTester.allowance(bob, alice)
      assert.equal(allowance_A_1, 50)


      assert.equal(await busdcTokenTester.balanceOf(carol), 50)

      // Alice transfers from bob to Carol, using up her allowance
      await busdcTokenTester.transferFrom(bob, carol, 50, {from: alice})
      assert.equal(await busdcTokenTester.balanceOf(carol), 100)

       // Check A's allowance of Bob's funds has decreased
      const allowance_A_2= await busdcTokenTester.allowance(bob, alice)
      assert.equal(allowance_A_2, '0')

      // Check bob's balance has decreased
      assert.equal(await busdcTokenTester.balanceOf(bob), 50)

      // Alice tries to transfer more tokens from bob's account to carol than she's allowed
      const txPromise = busdcTokenTester.transferFrom(bob, carol, 50, {from: alice})
      await assertRevert(txPromise)
    })

    it("transfer(): increases the recipient's balance by the correct amount", async () => {
      assert.equal(await busdcTokenTester.balanceOf(alice), 150)

      await busdcTokenTester.transfer(alice, 37, {from: bob})

      assert.equal(await busdcTokenTester.balanceOf(alice), 187)
    })

    it("transfer(): reverts if amount exceeds sender's balance", async () => {
      assert.equal(await busdcTokenTester.balanceOf(bob), 100)

      const txPromise = busdcTokenTester.transfer(alice, 101, {from: bob})
      await assertRevert(txPromise)
    })

    it('transfer(): transferring to a blacklisted address reverts', async () => {
      await assertRevert(busdcTokenTester.transfer(busdcTokenTester.address, 1, { from: alice }))
      await assertRevert(busdcTokenTester.transfer(ZERO_ADDRESS, 1, { from: alice }))
      await assertRevert(busdcTokenTester.transfer(troveManager.address, 1, { from: alice }))
      await assertRevert(busdcTokenTester.transfer(stabilityPool.address, 1, { from: alice }))
      await assertRevert(busdcTokenTester.transfer(borrowerOperations.address, 1, { from: alice }))
    })

    it("increaseAllowance(): increases an account's allowance by the correct amount", async () => {
      const allowance_A_Before = await busdcTokenTester.allowance(bob, alice)
      assert.equal(allowance_A_Before, '0')

      await busdcTokenTester.increaseAllowance(alice, 100, {from: bob} )

      const allowance_A_After = await busdcTokenTester.allowance(bob, alice)
      assert.equal(allowance_A_After, 100)
    })

    if (!withProxy) {
      it('mint(): issues correct amount of tokens to the given address', async () => {
        const alice_balanceBefore = await busdcTokenTester.balanceOf(alice)
        assert.equal(alice_balanceBefore, 150)

        await busdcTokenTester.unprotectedMint(alice, 100)

        const alice_BalanceAfter = await busdcTokenTester.balanceOf(alice)
        assert.equal(alice_BalanceAfter, 250)
      })

      it('burn(): burns correct amount of tokens from the given address', async () => {
        const alice_balanceBefore = await busdcTokenTester.balanceOf(alice)
        assert.equal(alice_balanceBefore, 150)

        await busdcTokenTester.unprotectedBurn(alice, 70)

        const alice_BalanceAfter = await busdcTokenTester.balanceOf(alice)
        assert.equal(alice_BalanceAfter, 80)
      })

      // TODO: Rewrite this test - it should check the actual busdcTokenTester's balance.
      it('sendToPool(): changes balances of Stability pool and user by the correct amounts', async () => {
        const stabilityPool_BalanceBefore = await busdcTokenTester.balanceOf(stabilityPool.address)
        const bob_BalanceBefore = await busdcTokenTester.balanceOf(bob)
        assert.equal(stabilityPool_BalanceBefore, 0)
        assert.equal(bob_BalanceBefore, 100)

        await busdcTokenTester.unprotectedSendToPool(bob, stabilityPool.address, 75)

        const stabilityPool_BalanceAfter = await busdcTokenTester.balanceOf(stabilityPool.address)
        const bob_BalanceAfter = await busdcTokenTester.balanceOf(bob)
        assert.equal(stabilityPool_BalanceAfter, 75)
        assert.equal(bob_BalanceAfter, 25)
      })

      it('returnFromPool(): changes balances of Stability pool and user by the correct amounts', async () => {
        /// --- SETUP --- give pool 100 BUSDC
        await busdcTokenTester.unprotectedMint(stabilityPool.address, 100)

        /// --- TEST ---
        const stabilityPool_BalanceBefore = await busdcTokenTester.balanceOf(stabilityPool.address)
        const  bob_BalanceBefore = await busdcTokenTester.balanceOf(bob)
        assert.equal(stabilityPool_BalanceBefore, 100)
        assert.equal(bob_BalanceBefore, 100)

        await busdcTokenTester.unprotectedReturnFromPool(stabilityPool.address, bob, 75)

        const stabilityPool_BalanceAfter = await busdcTokenTester.balanceOf(stabilityPool.address)
        const bob_BalanceAfter = await busdcTokenTester.balanceOf(bob)
        assert.equal(stabilityPool_BalanceAfter, 25)
        assert.equal(bob_BalanceAfter, 175)
      })
    }

    it('transfer(): transferring to a blacklisted address reverts', async () => {
      await assertRevert(busdcTokenTester.transfer(busdcTokenTester.address, 1, { from: alice }))
      await assertRevert(busdcTokenTester.transfer(ZERO_ADDRESS, 1, { from: alice }))
      await assertRevert(busdcTokenTester.transfer(troveManager.address, 1, { from: alice }))
      await assertRevert(busdcTokenTester.transfer(stabilityPool.address, 1, { from: alice }))
      await assertRevert(busdcTokenTester.transfer(borrowerOperations.address, 1, { from: alice }))
    })

    it('decreaseAllowance(): decreases allowance by the expected amount', async () => {
      await busdcTokenTester.approve(bob, dec(3, 18), { from: alice })
      assert.equal((await busdcTokenTester.allowance(alice, bob)).toString(), dec(3, 18))
      await busdcTokenTester.decreaseAllowance(bob, dec(1, 18), { from: alice })
      assert.equal((await busdcTokenTester.allowance(alice, bob)).toString(), dec(2, 18))
    })

    it('decreaseAllowance(): fails trying to decrease more than previously allowed', async () => {
      await busdcTokenTester.approve(bob, dec(3, 18), { from: alice })
      assert.equal((await busdcTokenTester.allowance(alice, bob)).toString(), dec(3, 18))
      await assertRevert(busdcTokenTester.decreaseAllowance(bob, dec(4, 18), { from: alice }), 'ERC20: decreased allowance below zero')
      assert.equal((await busdcTokenTester.allowance(alice, bob)).toString(), dec(3, 18))
    })

    // EIP2612 tests

    if (!withProxy) {
      it("version(): returns the token contract's version", async () => {
        const version = await busdcTokenTester.version()
        assert.equal(version, "1")
      })

      it('Initializes PERMIT_TYPEHASH correctly', async () => {
        assert.equal(await busdcTokenTester.permitTypeHash(), PERMIT_TYPEHASH)
      })

      it('Initializes DOMAIN_SEPARATOR correctly', async () => {
        assert.equal(await busdcTokenTester.domainSeparator(),
                     getDomainSeparator(tokenName, busdcTokenTester.address, chainId, tokenVersion))
      })

      it('Initial nonce for a given address is 0', async function () {
        assert.equal(toBN(await busdcTokenTester.nonces(alice)).toString(), '0');
      });

      // Create the approval tx data
      const approve = {
        owner: alice,
        spender: bob,
        value: 1,
      }

      const buildPermitTx = async (deadline) => {
        const nonce = (await busdcTokenTester.nonces(approve.owner)).toString()

        // Get the EIP712 digest
        const digest = getPermitDigest(
          tokenName, busdcTokenTester.address,
          chainId, tokenVersion,
          approve.owner, approve.spender,
          approve.value, nonce, deadline
        )

        const { v, r, s } = sign(digest, alicePrivateKey)

        const tx = busdcTokenTester.permit(
          approve.owner, approve.spender, approve.value,
          deadline, v, hexlify(r), hexlify(s)
        )

        return { v, r, s, tx }
      }

      it('permits and emits an Approval event (replay protected)', async () => {
        const deadline = 100000000000000

        // Approve it
        const { v, r, s, tx } = await buildPermitTx(deadline)
        const receipt = await tx
        const event = receipt.logs[0]

        // Check that approval was successful
        assert.equal(event.event, 'Approval')
        assert.equal(await busdcTokenTester.nonces(approve.owner), 1)
        assert.equal(await busdcTokenTester.allowance(approve.owner, approve.spender), approve.value)

        // Check that we can not use re-use the same signature, since the user's nonce has been incremented (replay protection)
        await assertRevert(busdcTokenTester.permit(
          approve.owner, approve.spender, approve.value,
          deadline, v, r, s), 'BUSDC: invalid signature')

        // Check that the zero address fails
        await assertAssert(busdcTokenTester.permit('0x0000000000000000000000000000000000000000',
                                                  approve.spender, approve.value, deadline, '0x99', r, s))
      })

      it('permits(): fails with expired deadline', async () => {
        const deadline = 1

        const { v, r, s, tx } = await buildPermitTx(deadline)
        await assertRevert(tx, 'BUSDC: expired deadline')
      })

      it('permits(): fails with the wrong signature', async () => {
        const deadline = 100000000000000

        const { v, r, s } = await buildPermitTx(deadline)

        const tx = busdcTokenTester.permit(
          carol, approve.spender, approve.value,
          deadline, v, hexlify(r), hexlify(s)
        )

        await assertRevert(tx, 'BUSDC: invalid signature')
      })
    }
  }
  describe('Basic token functions, without Proxy', async () => {
    testCorpus({ withProxy: false })
  })

  describe('Basic token functions, with Proxy', async () => {
    testCorpus({ withProxy: true })
  })
})



contract('Reset chain state', async accounts => {})
