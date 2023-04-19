import _ from 'lodash';
import { ethers, upgrades } from 'hardhat';
import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { deployPoolContractsFixture } from '../utils';

describe('VaultAndSwapTest', () => {


  it('MockUSDC Mintable', async () => {
    const {mockUSDC, sanctionsListMock, backedOracle, backedFactory, backedSwap, backedVault, Alice, Bob, Caro, Dave } = await loadFixture(deployPoolContractsFixture);
    // Mint 10_000 USDC to Bob
    await mockUSDC.connect(Alice).mint(10_000) 
    await mockUSDC.connect(Alice).transfer(Bob.address, 10_000) 
    expect(await mockUSDC.totalSupply()).to.equal(10_000);
    expect(await mockUSDC.balanceOf(Bob.address)).to.equal(10_000);
  });

  it("backedFactory DeployToken should not allow 0 address to be assigned to role and shold be able to deploy new token", async () => {
    const {mockUSDC, sanctionsListMock, backedOracle, backedFactory, backedSwap, backedVault, Alice, Bob, Caro, Dave } = await loadFixture(deployPoolContractsFixture);
    const tokenName = "Backed IB01";
    const tokenSymbol = "IB01";
    let minter = Alice;
    let burner = Alice;
    let pauser = Alice;
    let tokenContractOwner = Alice;
    await expect(
      backedFactory.connect(Alice).deployToken(
        tokenName,
        tokenSymbol,
        ethers.constants.AddressZero,
        minter.address,
        burner.address,
        pauser.address,
        sanctionsListMock.address
      )
    ).to.revertedWith("Factory: address should not be 0");

    await expect(
      backedFactory.connect(Alice).deployToken(
        tokenName,
        tokenSymbol,
        tokenContractOwner.address,
        ethers.constants.AddressZero,
        burner.address,
        pauser.address,
        sanctionsListMock.address
      )
    ).to.revertedWith("Factory: address should not be 0");

    await expect(
      backedFactory.connect(Alice).deployToken(
        tokenName,
        tokenSymbol,
        tokenContractOwner.address,
        minter.address,
        ethers.constants.AddressZero,
        pauser.address,
        sanctionsListMock.address
      )
    ).to.revertedWith("Factory: address should not be 0");

    await expect(
      backedFactory.connect(Alice).deployToken(
        tokenName,
        tokenSymbol,
        tokenContractOwner.address,
        minter.address,
        burner.address,
        ethers.constants.AddressZero,
        sanctionsListMock.address
      )
    ).to.revertedWith("Factory: address should not be 0");

    const tokenDeployReceipt = await (
      await backedFactory.connect(Alice).deployToken(
        tokenName,
        tokenSymbol,
        tokenContractOwner.address,
        minter.address,
        burner.address,
        pauser.address,
        sanctionsListMock.address
      )
    ).wait();

    // Expect there to be { NewToken } event
    const newTokenEvent = tokenDeployReceipt.events?.find(
      (e) => e.event === "NewToken"
    );
    expect(newTokenEvent).not.equal(undefined);
    expect(newTokenEvent?.args?.length).to.equal(3);
    expect(newTokenEvent?.args?.newToken).to.match(/^0x[a-fA-F\d]{40}$/);
    expect(newTokenEvent?.args?.name).to.equal(tokenName);
    expect(newTokenEvent?.args?.symbol).to.equal(tokenSymbol);
  });


  it('IB01 Mintable and Burnerable', async () => {
    const {mockUSDC, sanctionsListMock, backedOracle, backedFactory, backedSwap, backedVault, Alice, Bob, Caro, Dave } = await loadFixture(deployPoolContractsFixture);
    const tokenName = "Backed IB01";
    const tokenSymbol = "IB01";
    let minter = Alice;
    let burner = Alice;
    let pauser = Alice;
    let tokenContractOwner = Alice;

    const tokenDeployReceipt = await (
      await backedFactory.connect(Alice).deployToken(
        tokenName,
        tokenSymbol,
        tokenContractOwner.address,
        minter.address,
        burner.address,
        pauser.address,
        sanctionsListMock.address
      )
    ).wait();
    const deployedTokenAddress = tokenDeployReceipt.events?.find(
      (event) => event.event === "NewToken"
    )?.args?.newToken;
    const ib01token = await ethers.getContractAt(
      "BackedTokenImplementation",
      deployedTokenAddress
    );
    // set minter and burner
    await ib01token.setMinter(minter.address);
    await ib01token.setBurner(burner.address);
    // mint ib01 to bob
    await ib01token.connect(Alice).mint(Bob.address, 10_000) 
    expect(await ib01token.totalSupply()).to.equal(10_000);
    expect(await ib01token.balanceOf(Bob.address)).to.equal(10_000)
    // burn ib01 in token contract
    await ib01token.connect(Alice).mint(ib01token.address, 10_000) 
    expect(await ib01token.balanceOf(ib01token.address)).to.equal(10_000)
    await ib01token.connect(Alice).burn(ib01token.address, 10_000)
    expect(await ib01token.balanceOf(ib01token.address)).to.equal(0)

  })

  it('Mint IB01 to BackedVault and initialize BackedSwap', async () => {

    const {mockUSDC, sanctionsListMock, backedOracle, backedFactory, backedSwap, backedVault, Alice, Bob, Caro, Dave } = await loadFixture(deployPoolContractsFixture);
    const tokenName = "Backed IB01";
    const tokenSymbol = "IB01";
    let minter = Alice;
    let burner = Alice;
    let pauser = Alice;
    let tokenContractOwner = Alice;
    const tokenDeployReceipt = await (
      await backedFactory.connect(Alice).deployToken(
        tokenName,
        tokenSymbol,
        tokenContractOwner.address,
        minter.address,
        burner.address,
        pauser.address,
        sanctionsListMock.address
      )
    ).wait();
    const deployedTokenAddress = tokenDeployReceipt.events?.find(
      (event) => event.event === "NewToken"
    )?.args?.newToken;
    const ib01token = await ethers.getContractAt(
      "BackedTokenImplementation",
      deployedTokenAddress
    );
    // set minter and burner
    await ib01token.setMinter(minter.address);
    await ib01token.setBurner(burner.address);
    
    // mint ib01 and usdc to BackedValut and set backedswap 
    await ib01token.connect(Alice).mint(backedVault.address, 10_000) 

    expect(await ib01token.totalSupply()).to.equal(10_000);
    expect(await ib01token.balanceOf(backedVault.address)).to.equal(10_000)
    await backedVault.connect(Alice).initialize() 
    await backedVault.connect(Alice).setBackedSwap(backedSwap.address) 
    expect(await backedVault.backedSwap()).to.equal(backedSwap.address)
    await mockUSDC.connect(Alice).mint(10_000_000) 
    await mockUSDC.connect(Alice).transfer(backedVault.address, 10_000_000) 
    expect(await mockUSDC.totalSupply()).to.equal(10_000_000);
    expect(await mockUSDC.balanceOf(backedVault.address)).to.equal(10_000_000);

    // mint ib01 and usdc to Bob
    await ib01token.connect(Alice).mint(Bob.address, 10_000) 
    expect(await ib01token.balanceOf(Bob.address)).to.equal(10_000)
    await mockUSDC.connect(Alice).mint(10_000_000) 
    await mockUSDC.connect(Alice).transfer(Bob.address, 10_000_000) 
    expect(await mockUSDC.balanceOf(Bob.address)).to.equal(10_000_000);

    // initialize backedswap
    await backedSwap.connect(Alice).initialize(mockUSDC.address, ib01token.address, backedOracle.address, backedVault.address);

    // updateanswer in BackedOracle
    await backedOracle.connect(Alice).updateAnswer(10446000000 ,1680872403, 1680872403)

    // bob approve USDC and IB01 to BackedSwap address
    await ib01token.connect(Bob).approve(backedSwap.address, 10_000_000)
    await mockUSDC.connect(Bob).approve(backedSwap.address, 10_000_000)


    // // mint : usdc to ib01 (input: amount of usdc)
    await backedSwap.connect(Bob).mint(1)
    expect(await mockUSDC.balanceOf(Bob.address)).to.equal(10_000_000 - 1);

    // // redeem : ib01 to usdc (input amount of ib01)
    await backedSwap.connect(Bob).redeem(1)
    expect(await ib01token.balanceOf(Bob.address)).to.not.equal(10_000);


  })

});