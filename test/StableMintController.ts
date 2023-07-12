import { ethers } from 'hardhat'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

describe('StableMintController', function () {
  let stableMintController: Contract
  let owner: SignerWithAddress
  let troveManager: SignerWithAddress
  let stabilityPool: SignerWithAddress
  let ethBo: SignerWithAddress
  let backedBo: SignerWithAddress

  beforeEach(async function () {
    [owner, troveManager, stabilityPool, ethBo, backedBo] = await ethers.getSigners()

    const StableMintController = await ethers.getContractFactory('StableMintController')

    const initMintCapsOfEthBO = ethers.utils.parseEther('800')
    const initMintCapsOfBackedBO = ethers.utils.parseEther('200')
    stableMintController = await StableMintController.deploy()
    await stableMintController.setAddresses(
      troveManager.address,
      stabilityPool.address,
      ethBo.address,
      backedBo.address,
      initMintCapsOfEthBO,
      initMintCapsOfBackedBO,
    )
  })

  it('should set addresses correctly', async function () {
    expect(await stableMintController.troveManagerAddress()).to.be.equal(troveManager.address)
    expect(await stableMintController.stabilityPoolAddress()).to.be.equal(stabilityPool.address)
    expect(await stableMintController.ethBoAddress()).to.be.equal(ethBo.address)
    expect(await stableMintController.backedBoAddress()).to.be.equal(backedBo.address)
    expect(await stableMintController.initMintCaps(ethBo.address)).to.be.equal(ethers.utils.parseEther('800'))
    expect(await stableMintController.initMintCaps(backedBo.address)).to.be.equal(ethers.utils.parseEther('200'))

    expect(await stableMintController.availableAmount(ethBo.address)).to.be.equal(ethers.utils.parseEther('800'))
    expect(await stableMintController.availableAmount(backedBo.address)).to.be.equal(ethers.utils.parseEther('200'))
  })

  it('availableAmount() should work', async function () {
    // ETH BO
    await stableMintController.connect(troveManager).increaseMint(ethBo.address, ethers.utils.parseEther('100'))
    expect(await stableMintController.availableAmount(ethBo.address)).to.be.equal(ethers.utils.parseEther('700'))

    await stableMintController.connect(troveManager).increaseMint(ethBo.address, ethers.utils.parseEther('700'))
    expect(await stableMintController.availableAmount(ethBo.address)).to.be.equal(ethers.utils.parseEther('0'))

    // Backed BO
    await stableMintController.connect(troveManager).increaseMint(backedBo.address, ethers.utils.parseEther('100'))
    expect(await stableMintController.availableAmount(backedBo.address)).to.be.equal(ethers.utils.parseEther('120'))

    await stableMintController.connect(troveManager).increaseMint(backedBo.address, ethers.utils.parseEther('120'))
    expect(await stableMintController.availableAmount(backedBo.address)).to.be.equal(ethers.utils.parseEther('0'))

    expect(await stableMintController.availableAmount(ethBo.address)).to.be.equal(ethers.utils.parseEther('168'))
    await stableMintController.connect(troveManager).increaseMint(ethBo.address, ethers.utils.parseEther('168'))

    expect(await stableMintController.availableAmount(backedBo.address)).to.be.equal(ethers.utils.parseEther('46.2'))
    await stableMintController.connect(troveManager).increaseMint(backedBo.address, ethers.utils.parseEther('46.2'))
  })
})
