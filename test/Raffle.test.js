const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");

const provider = ganache.provider();
const web3 = new Web3(provider);

const { interface, bytecode } = require("../compile");

let raffle;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  raffle = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: "1000000" });
  raffle.setProvider(provider);
});

describe("Raffle Contract", () => {
  it("deploys contract", () => {
    assert.ok(raffle.options.address);
  });

  it("allows one account to enter", async () => {
    await raffle.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("0.01", "ether")
    });

    const players = await raffle.methods
      .getPlayers()
      .call({ from: accounts[0] });

    assert.equal(accounts[0], players[0]);
    assert.equal(1, players.length);
  });

  it("allows multiple accounts to enter", async () => {
    await raffle.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("0.01", "ether")
    });
    await raffle.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei("0.01", "ether")
    });
    await raffle.methods.enter().send({
      from: accounts[2],
      value: web3.utils.toWei("0.01", "ether")
    });

    const players = await raffle.methods
      .getPlayers()
      .call({ from: accounts[0] });

    assert.equal(accounts[0], players[0]);
    assert.equal(accounts[1], players[1]);
    assert.equal(accounts[2], players[2]);

    assert.equal(3, players.length);
  });

  it("requires minimum amount of ether to enter", async () => {
    try {
      await raffle.methods.enter().send({
        from: accounts[0],
        value: 0
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("only allows manager to pick winner", async () => {
    try {
      await raffle.methods.pickWinner().send({ from: accounts[0] });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("it send ether to winner and resets players array", async () => {
    await raffle.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("2", "ether")
    });

    const initialBalance = await web3.eth.getBalance(accounts[0]);
    await raffle.methods.pickWinner().send({ from: accounts[0] });
    const finalBalance = await web3.eth.getBalance(accounts[0]);
    const difference = finalBalance - initialBalance;
    const players = await raffle.methods
      .getPlayers()
      .call({ from: accounts[0] });

    assert(difference > web3.utils.toWei("1.8", "ether"));
    assert.equal(0, players.length);
  });
});
