var ContractManager = artifacts.require("ContractManager");

var FidaSale = artifacts.require("FidaSale");
var FidaToken = artifacts.require("FidaToken");
var MemberManager = artifacts.require("MemberManager.sol");

contract('FidaSale', function(accounts) {
  var contractManager;
  var fidaSale;
  var fidaToken;
  var whitelist;

  var owner = accounts[1];
  var depositAccount = accounts[2];

  var saleService = accounts[3];

  var address_one = accounts[6];
  var address_two = accounts[7];
  var address_three = accounts[8];
  var address_four = accounts[9];

  var wallet = "0x5E074B5685FD456Aa2b3c9165a6b9EFe5232838d";

  var fidaPerEther;
  var boughtBonus;

  describe("buying tokens", async function() {
    before("should create token and sale", function(done) {
      createContracts(done);
    });

    it("should send balance to wallet address", async function() {
      var balance = (await web3.eth.getBalance(wallet)).toNumber();

      await fidaSale.buyTokens(address_two, {from: address_two, value: web3.toWei(5)});

      balance = (await web3.eth.getBalance(wallet)).toNumber() - balance;

      assert.equal(Math.round(balance / 10**12) * 10**12, web3.toWei(5), "Not all ether has been transferred to wallet");
    });
  });

  describe("buying earlybird tokens", async function() {
    before("should create token and sale", function(done) {
      createContracts(done);
    });

    it("should throw because bought less than 50 fida", async function() {
      var amountWei = Math.floor((web3.toWei(49, "ether") * 100000) / fidaPerEther);

      try {
        await fidaSale.buyTokens(address_two, {from: address_two, value: amountWei});
        assert.fail("It did not throw so could buy less than 50 fida as earlybird");
      } catch(err) {}
    });

    it("should buy minimal amount of fida", async function() {
      var amountWei = Math.floor((web3.toWei(51, "ether") * 100000) / fidaPerEther);

      try {
        await fidaSale.buyTokens(address_two, {from: address_two, value: amountWei});
      } catch(err) {
        assert.fail("It did throw when buying 50 fida as earlybird");
      }
    });

    it("should buy total amount of earlybird tokens", async function() {
      var maxAmount = await fidaSale.INITIAL_EARLYBIRD_TOKENS();
      var boughtAmount = await fidaSale.tokensBoughtInEarlybird();

      var amountWei = Math.ceil(maxAmount.minus(boughtAmount).toNumber() * 100000 / fidaPerEther);

      try {
        await fidaSale.buyTokens(address_two, {from: address_two, value: amountWei});
      } catch(err) {
        assert.fail("It did throw when buying maximum amount of tokens");
      }
    });
  });

  describe("whitelisting users", async function() {
    before("should create token and sale", function(done) {
      createContracts(done);
    });

    it("should not be able to buy tokens", async function() {
      try {
        await fidaSale.buyTokens(address_three, {from: address_three, value: web3.toWei(1)});
        assert.fail("Buying was successfull when it shouldn't have been");
      } catch(e) {} 
    });

    it("should be able to whitelist and buy tokens", async function() {
      await fidaSale.setWhitelistStatus(address_three, true, { from: saleService });

      try {
        await fidaSale.buyTokens(address_three, {from: address_three, value: web3.toWei(1)});
      } catch(e) {
        assert.fail("Buying was unsuccessfull when it shouldn't have been");
      } 
    });
  });

  describe("sending tokens if bought with btc", async function() {
    before("should create token and sale", function(done) {
      createContracts(done);
    });

    it("should be able to sent tokens", async function() {
      await fidaSale.setWhitelistStatus(address_three, true, { from: saleService });
      var balanceBefore = (await fidaToken.balanceOf(address_three)).toNumber();

      try {
        await fidaSale.tokensBoughtWithBTC(address_three, web3.toWei(250), {from: saleService});
      } catch(e) {
        console.log(e);
        assert.fail("Buying was unsuccessfull when it shouldn't have been");
      } 

      var balanceAfter = (await fidaToken.balanceOf(address_three)).toNumber();

      assert.equal(balanceAfter-balanceBefore, web3.toWei(250), "Not enough tokens have been bought");
    });
  });

  describe("buying bonus tokens", async function() {
    before("should create token and sale", function(done) {
      createContracts(done, async function(d) {
        await fidaSale.setWhitelistStatus(address_three, true, { from: saleService });
        
        var maxAmount = await fidaSale.INITIAL_EARLYBIRD_TOKENS();
        var amountWei = Math.ceil(maxAmount.toNumber() * 100000 / fidaPerEther);
        await fidaSale.buyTokens(address_two, {from: address_two, value: amountWei});

        d();
      });
    });

    it("should should buy token with 15% bonus", async function() {
      await fidaSale.buyTokens(address_three, {from: address_three, value: web3.toWei(5)});
      var tokens = Math.round((await fidaToken.balanceOf.call(address_three)).toNumber() / 10**21) * 10**21;
      
      var expectedTokens15 = web3.toWei(5) * fidaPerEther / 100000;
      var expectedBonusTokens15 = Math.round((expectedTokens15 * 115 / 100) / 10**21) * 10**21;

      assert.equal(tokens, expectedBonusTokens15, "Tokens bought do not match with expected amount");      
    });

    it("should should buy token with 15% and 10% bonus", async function() {
      var tokensBought = web3.fromWei((await fidaSale.tokensBoughtInBonusProgram.call()).toNumber());
      var tokensToBuy = 30e5 - tokensBought;
      var amountWei = Math.ceil(web3.toWei(tokensToBuy) * 100000 / fidaPerEther);
      
      await fidaSale.buyTokens(address_three, {from: address_three, value: amountWei});
      var tokens = Math.round((await fidaToken.balanceOf.call(address_three)).toNumber() / 10**21) * 10**21;
      
      var expectedBonusTokens15 = Number(web3.toWei(25e5 * 115)) / 100;
      var expectedBonusTokens10 = Number(web3.toWei(5e5 * 110)) / 100;

      assert.equal(tokens, Math.round((expectedBonusTokens15 + expectedBonusTokens10) / 10**21) * 10**21, "Tokens bought do not match with expected amount");      
    });

    it("should should buy token with 10% bonus", async function() {
      var tokens = (await fidaToken.balanceOf.call(address_three)).toNumber();

      await fidaSale.buyTokens(address_three, {from: address_three, value: web3.toWei(5)});
      
      var boughtTokens = Math.round((await fidaToken.balanceOf.call(address_three)).toNumber() / 10**21) * 10**21;
      
      var expectedTokens10 = web3.toWei(5) * fidaPerEther / 100000;
      var expectedBonusTokens10 = expectedTokens10 * 110 / 100;

      assert.equal(boughtTokens, Math.round((tokens + expectedBonusTokens10) / 10**21) * 10**21, "Tokens bought do not match with expected amount");      
    });

    it("should should buy token with 10% and 5% bonus", async function() {
      var tokensBought = web3.fromWei((await fidaSale.tokensBoughtInBonusProgram.call()).toNumber());
      var tokensToBuy = 55e5 - tokensBought;
      var amountWei = Math.ceil(web3.toWei(tokensToBuy) * 100000 / fidaPerEther);
      
      await fidaSale.buyTokens(address_three, {from: address_three, value: amountWei});
      var tokens = Math.round((await fidaToken.balanceOf.call(address_three)).toNumber() / 10**21) * 10**21;
      
      var expectedBonusTokens15 = Number(web3.toWei(25e5 * 115)) / 100;
      var expectedBonusTokens10 = Number(web3.toWei(25e5 * 110)) / 100;
      var expectedBonusTokens05 = Number(web3.toWei(5e5 * 105)) / 100;

      assert.equal(tokens, Math.round((expectedBonusTokens15 + expectedBonusTokens10 + expectedBonusTokens05) / 10**21) * 10**21, "Tokens bought do not match with expected amount");      
    });

    it("should should buy token with 5% bonus", async function() {
      var tokens = (await fidaToken.balanceOf.call(address_three)).toNumber();

      await fidaSale.buyTokens(address_three, {from: address_three, value: web3.toWei(5)});
      
      var boughtTokens = Math.round((await fidaToken.balanceOf.call(address_three)).toNumber() / 10**21) * 10**21;
      
      var expectedTokens05 = web3.toWei(5) * fidaPerEther / 100000;
      var expectedBonusTokens05 = expectedTokens05 * 105 / 100;

      assert.equal(boughtTokens, Math.round((tokens + expectedBonusTokens05) / 10**21) * 10**21, "Tokens bought do not match with expected amount");      
    });

    it("should should buy token with 5% and 2.5% bonus", async function() {
      var tokensBought = web3.fromWei((await fidaSale.tokensBoughtInBonusProgram.call()).toNumber());
      var tokensToBuy = 105e5 - tokensBought;
      var amountWei = Math.ceil(web3.toWei(tokensToBuy) * 100000 / fidaPerEther);
      
      await fidaSale.buyTokens(address_three, {from: address_three, value: amountWei});
      var tokens = Math.round((await fidaToken.balanceOf.call(address_three)).toNumber() / 10**23) * 10**23;
      
      var expectedBonusTokens15 = Number(web3.toWei(25e5 * 115)) / 100;
      var expectedBonusTokens10 = Number(web3.toWei(25e5 * 110)) / 100;
      var expectedBonusTokens05 = Number(web3.toWei(50e5 * 105)) / 100;
      var expectedBonusTokens025 = Number(web3.toWei(5e5 * 1025)) / 1000;

      assert.equal(tokens, Math.round((expectedBonusTokens15 + expectedBonusTokens10 + expectedBonusTokens05 + expectedBonusTokens025) / 10**23) * 10**23, "Tokens bought do not match with expected amount");      
    });

    it("should should buy token with 2.5% bonus", async function() {
      var tokens = (await fidaToken.balanceOf.call(address_three)).toNumber();

      await fidaSale.buyTokens(address_three, {from: address_three, value: web3.toWei(5)});
      
      var boughtTokens = Math.round((await fidaToken.balanceOf.call(address_three)).toNumber() / 10**21) * 10**21;
      
      var expectedTokens025 = web3.toWei(5) * fidaPerEther / 100000;
      var expectedBonusTokens025 = expectedTokens025 * 1025 / 1000;

      assert.equal(boughtTokens, Math.round((tokens + expectedBonusTokens025) / 10**21) * 10**21, "Tokens bought do not match with expected amount");      
    });

    it("should should buy token with 2.5% and no bonus", async function() {
      var tokensBought = web3.fromWei((await fidaSale.tokensBoughtInBonusProgram.call()).toNumber());
      var tokensToBuy = 155e5 - tokensBought;
      var amountWei = Math.ceil(web3.toWei(tokensToBuy) * 100000 / fidaPerEther);
      
      await fidaSale.buyTokens(address_three, {from: address_three, value: amountWei});
      var tokens = Math.round((await fidaToken.balanceOf.call(address_three)).toNumber() / 10**21) * 10**21;
      
      var expectedBonusTokens15 = Number(web3.toWei(25e5 * 115)) / 100;
      var expectedBonusTokens10 = Number(web3.toWei(25e5 * 110)) / 100;
      var expectedBonusTokens05 = Number(web3.toWei(50e5 * 105)) / 100;
      var expectedBonusTokens025 = Number(web3.toWei(50e5 * 1025)) / 1000;
      var expectedNoBonusTokens = Number(web3.toWei(5e5));

      assert.equal(tokens, Math.ceil((expectedBonusTokens15 + expectedBonusTokens10 + expectedBonusTokens05 + expectedBonusTokens025 + expectedNoBonusTokens) / 10**21) * 10**21, "Tokens bought do not match with expected amount");      
    });

    it("should should buy token with no bonus", async function() {
      var tokens = (await fidaToken.balanceOf.call(address_three)).toNumber();

      await fidaSale.buyTokens(address_three, {from: address_three, value: web3.toWei(5)});
      
      var boughtTokens = Math.round((await fidaToken.balanceOf.call(address_three)).toNumber() / 10**23) * 10**23;
      
      var expectedTokens = web3.toWei(5) * fidaPerEther / 10000;

      assert.equal(boughtTokens, Math.round((tokens + expectedTokens) / 10**23) * 10**23, "Tokens bought do not match with expected amount");      
    });
  });

  describe("buying tokens and transfer", async function() {
    before("should create token and sale", function(done) {
      createContracts(done, async function(d) {
        await fidaSale.setWhitelistStatus(address_one, true, { from: saleService });

        d();
      });
    });

    it("should not be able to transfer", async function() {
      await fidaSale.buyTokens(address_one, {from: address_one, value: web3.toWei(5, "ether")});

      try {
        await fidaToken.transfer(address_two, 400, {from: address_one});
        assert.fail("It did not throw and I was able to transfer funds");
      } catch(err) {
      }
    });

    it("should be able to transfer", async function() {
      await fidaToken.unlockTokens({from: owner});

      try {
        await fidaToken.transfer(address_two, web3.toWei(400), {from: address_one});
      } catch(err) {
        assert.fail("It did throw and I was not able to transfer funds");
      }

      var tokens = (await fidaToken.balanceOf.call(address_two)).toNumber();

      assert.equal(tokens, web3.toWei(400), "Tokens have not been transferred");
    });
  });

  describe("finishing sale", async function() {
    before("should create token and sale", function(done) {
      createContracts(done);
    });

    it("should not finish sale when unauthorized", async function() {
      try {
        await fidaSale.finishedSale({from: address_one});
        assert.fail("Sale was finished by unauthorized address");
      } catch(err) {}
    });

    it("should finish sale", async function() {
      await fidaSale.finishedSale({from: owner});
    });

    it("should not finish sale twice", async function() {
      try {
        await fidaSale.finishedSale({from: owner});
        assert.fail("Sale has finished twice");
      } catch(err) {}
    });

    it("should not be able to buy tokens", async function() {
      try {
        await fidaSale.buyTokens(address_three, {from: address_three, value: web3.toWei(1, "ether")});
        assert.fail("It did now throw while sale has ended");
      } catch(err) {}
    });
  });

  function createContracts(done, cb) {
    ContractManager.new({from: owner}).then(function(instance) {
      contractManager = instance;
      
      FidaToken.new(depositAccount, "FidaToken", contractManager.address, {from: owner}).then(function(instance) {
        fidaToken = instance;
  
        MemberManager.new("Whitelist", contractManager.address, {from: owner}).then(function(instance) {
          whitelist = instance;
  
          contractManager.addContract("FidaToken", fidaToken.address, {from: owner}).then(function() {
            contractManager.addContract("Whitelist", whitelist.address, {from: owner}).then(function() {
  
              FidaSale.new("FidaSale", wallet, wallet, saleService, saleService, owner, contractManager.address, "FidaToken", "Whitelist", {from: owner, value: web3.toWei(0.05)}).then(async function(instance) {
                fidaSale = instance;
                
                await contractManager.addContract("FidaSale", fidaSale.address, {from: owner});
                await contractManager.setAuthorizedContract("FidaSale", owner, true, {from: owner});
                await contractManager.setAuthorizedContract("FidaToken", fidaSale.address, true, {from: owner});
                await contractManager.setAuthorizedContract("FidaToken", owner, true, {from: owner});
                await contractManager.setAuthorizedContract("Whitelist", fidaSale.address, true, {from: owner});
                await contractManager.setAuthorizedContract("Whitelist", owner, true, {from: owner});
                
                await fidaSale.startSale({from: owner});

                await fidaSale.setWhitelistStatus(address_two, true, { from: saleService });

                var event = fidaSale.PriceUpdated({},{fromBlock: 0, toBlock: 'latest'});
                event.watch(function(err, res) {
                  if(err) {
                    assert.fail(err);
                  } else {
                    fidaPerEther = parseInt(res.args._price.replace(".", ""));
                    event.stopWatching();
                  }
                  
                  if(cb) {
                    cb(done);
                  } else {
                    if(done) done();
                  }
                });
              });
            });
          });
        });
      });
    });
  }
});