const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
require('dotenv').config()
const { expect } = require('chai');

describe('Faucet', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContractAndSetVariables() {
    const initialBalance = ethers.utils.parseUnits("1", "ether");

    const Faucet = await ethers.getContractFactory('Faucet');
    const faucet = await Faucet.deploy({value: initialBalance});

    const [owner, intruder] = await ethers.getSigners();
    let withdrawAmount = ethers.utils.parseUnits("1", "ether");

    console.log('Signer 1 address: ', owner.address);
    return { faucet, owner, intruder, withdrawAmount };
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
    const { faucet, intruder } = await loadFixture(deployContractAndSetVariables);
    await expect(faucet.connect(intruder).destroyFaucet()).to.be.reverted;
  });

  it('should destory the faucet contrarct when desctruct called by the owner', async function () {
    const { faucet } = await loadFixture(deployContractAndSetVariables);
    const provider = ethers.getDefaultProvider(network=5, {
      alchemy: process.env.ALCHEMY_API_KEY,
  });
    expect(await provider.getCode(faucet.address)).to.be.equal("0x");
  });

  it("should return contract's balance to the owner once self-destructed performed", async function () {

  });
});