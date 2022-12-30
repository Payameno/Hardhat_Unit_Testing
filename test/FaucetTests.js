const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
require('dotenv').config()
const { expect } = require('chai');

describe('Faucet', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContractAndSetVariables() {
    //connecting to Alchemy network testnet @ goerli
    const provider = ethers.getDefaultProvider(network=5, {
      alchemy: process.env.ALCHEMY_API_KEY,
  });
    //initial value to deploy for the contract instance
    const initialBalance = ethers.utils.parseUnits("1", "ether");

    const Faucet = await ethers.getContractFactory('Faucet');
    const faucet = await Faucet.deploy({value: initialBalance});

    //User is someone who does not own the contract
    const [owner, user] = await ethers.getSigners();
    let withdrawAmount = ethers.utils.parseUnits("1", "ether");

    console.log('Signer 1 address: ', owner.address);
    return { faucet, owner, user, withdrawAmount, provider };
  }

  it('should deploy and set the owner correctly', async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);
    expect(await faucet.owner()).to.equal(owner.address);
  });

  it('should not allow a withdraw above 1 ETH at a time!', async function () {
    const { faucet, withdrawAmount } = await loadFixture(deployContractAndSetVariables);
    await expect(faucet.withdraw(withdrawAmount)).to.be.reverted;
  });

  it('should destory the faucet contrarct only by the owner', async function () {
    const { faucet, user } = await loadFixture(deployContractAndSetVariables);
    await expect(faucet.connect(user).destroyFaucet()).to.be.reverted;
  });

  it('should destory the faucet contrarct when desctruct called by the owner', async function () {
    const { faucet, provider } = await loadFixture(deployContractAndSetVariables);
    expect(await provider.getCode(faucet.address)).to.be.equal("0x");
  });

  it("should return contract's balance to the owner once self-destructed performed", async function () {
    const { faucet } = await loadFixture(deployContractAndSetVariables);

    const balanceBefore = await faucet.provider.getBalance(faucet.address);
    const tx = await faucet.destroyFaucet();
    await tx.wait();
    const balanceAfter = await faucet.provider.getBalance(faucet.address);

    expect(balanceBefore).not.to.be.equal(ethers.utils.parseUnits("0", "ether"))
    expect(balanceAfter).to.equal(ethers.utils.parseUnits("0", "ether"));
  });

  it("should deposit full contract's balance to owner once self-destructed called", async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);

    const contractBalanceBefore = await faucet.provider.getBalance(faucet.address);
    const ownerBalanceBefore = await faucet.provider.getBalance(owner.address);

    //Getting the transaction receipt, calculating gasCost
    const tx = await faucet.destroyFaucet();
    const txReceipt = await tx.wait();
    const { gasUsed, effectiveGasPrice } = txReceipt;
    const gasCost = gasUsed.mul(effectiveGasPrice);
    console.log("gasCost", ethers.utils.formatEther(gasCost), "ETH");

    const contractBalanceAfter = await faucet.provider.getBalance(faucet.address);
    const ownerBalanceAfter = await faucet.provider.getBalance(owner.address);
    
    //Calculate faucet contrcat balance difference
    // const contractWithdrawDiff = contractBalanceBefore.toString() - contractBalanceAfter.toString();
    // console.log("withdraw Difference",contractWithdrawDiff);
    
    // const ownerBalanceDiff = -(ownerBalanceBefore.toString() - ownerBalanceAfter.toString());
    // console.log("owner Difference",ownerBalanceDiff);
    
    // const contractBalanceMinusGas = contractBalanceBefore.toString() - gasCost.toString();
    // console.log("Contract balance minus gas",contractBalanceMinusGas);
    
    expect(contractBalanceAfter.toString()).to.equal("0");
    expect(ownerBalanceAfter.toString() > ownerBalanceBefore.toString()).to.be.true;
    expect(contractBalanceBefore.add(ownerBalanceBefore).toString()).to.equal(ownerBalanceAfter.add(gasCost).toString());
  });

});