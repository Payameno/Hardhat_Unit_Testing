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

  });
});