var ContractManager = artifacts.require("ContractManager");

var FidaToken = artifacts.require("FidaToken");
var MemberManager = artifacts.require("MemberManager.sol");

contract("FidaToken", function(account) {
  var contractManager;
  var fidaToken;

  var owner = account[1];
  var account_one = account[2];
  var account_two = account[3];

  describe("minting bought tokens", function() {
    before("should create token", function(done) {
      createToken(done);
    });

    it("should send bought tokens to wallet", async function() {
      await fidaToken.sendBoughtTokens(account_one, 4000, {from: owner});
      var totalSupply = (await fidaToken.totalSupply.call()).toNumber();
      var tokens = (await fidaToken.balanceOf(account_one)).toNumber();

      assert.equal(totalSupply, 4000, "Tokens have not been added to totalSupply");
      assert.equal(tokens, 4000, "Tokens have not been successfully bought");
    });

    it("should not be able to mint tokens to deposit address while locked", async function() {
      try {
        await fidaToken.mintTokens(4000, {from: owner});
        
        assert.fail("Tokens have been minted while locked");
      } catch(err)  {}
    });

    it("should not send bought tokens to wallet when unlocked", async function() {
      await fidaToken.unlockTokens({from: owner});
      
      try {
        await fidaToken.sendBoughtTokens(account_one, 0, {from: owner});

        assert.fail("Token did not throw when token is unlocked");
      } catch(err) {}
    });

    it("should not send bought tokens to wallet when unauthorized", async function() {
      try {
        await fidaToken.sendBoughtTokens(account_one, 0, {from: account_two});

        assert.fail("Token did not throw when tokens are 0");
      } catch(err) {}
    });

    it("should not send bought tokens to wallet when beneficiary is equal to 0x0", async function() {
      try {
        await fidaToken.sendBoughtTokens("0x0", 0, {from: owner});

        assert.fail("Token did not throw when beneficiary is 0x0");
      } catch(err) {}
    });

    it("should not send bought tokens to wallet when tokens are 0", async function() {
      try {
        await fidaToken.sendBoughtTokens(account_one, 0, {from: owner});

        assert.fail("Token did not throw when tokens are 0");
      } catch(err) {}
    });
  });

  describe("unlocking tokens", function() {
    before("should buy tokens", function(done) {
      createToken(done, function (done) {
        fidaToken.sendBoughtTokens(account_one, 4000, {from: owner}).then(function() {
          done();
        });
      });
    });

    it("should not transfer tokens", async function() {
      try {
        await fidaToken.transfer(address_two, 500, {from: address_one});

        assert.fail("Tokens were transfered and it did not throw while locked");
      } catch(err) {}
    });

    it("should unlock tokens when unauthorized", async function() {
      try {
        await fidaToken.unlockTokens({from: address_one});

        assert.fail("It unlocked tokens while unauthorized");
      } catch(err) {}
    });

    it("should unlock tokens", async function() {
      try {
        await fidaToken.unlockTokens({from: owner});
      } catch(err) {
        assert.fail("It threw when unlocking tokens");
      }
    });

    it("should not unlock tokens again", async function() {
      try {
        await fidaToken.unlockTokens({from: owner});

        assert.fail("It did not throw when unlocking tokens again");
      } catch(err) {}
    });

    it("should transfer tokens after unlock", async function() {
      try {
        await fidaToken.transfer(account_two, 500, {from: account_one});
      } catch(err) {
        assert.fail("Tokens were not transfered and it did throw while unlocked");
      }
    });
  });

  describe("minting afer tokens unlock", function() {
    before("should unlock tokens", function(done) {
      createToken(done, function (done) {
        fidaToken.unlockTokens({from: owner}).then(function() {
          done();
        });
      });
    });

    it("should be able to mint after unlock", async function() {
      try {
        await fidaToken.mintTokens(4000, {from: owner});

        var totalSupply = (await fidaToken.totalSupply.call()).toNumber();
        var tokens = (await fidaToken.balanceOf(owner)).toNumber();
      } catch(err) {
        assert.fail("It threw while minting tokens after unlock");
      }

      assert.equal(totalSupply, 4000, "Tokens have not been added to totalSupply");
      assert.equal(tokens, 4000, "Tokens have not been successfully minted");
    });

    it("should be able to mint bought tokens after unlock", async function() {
      try {
        await fidaToken.sendBoughtTokens(account_one, 4000, {from: owner});

        assert.fail("It did not throw while minting bought tokens after unlock");
      } catch(err) {}
    });
  });

  describe("burning afer tokens unlock", function() {
    before("should unlock tokens", function(done) {
      createToken(done, function (done) {
        fidaToken.sendBoughtTokens(account_one, 4000, {from: owner}).then(function() {
          fidaToken.unlockTokens({from: owner}).then(function() {
            done();
          });
        });
      });
    });

    it("should not be able to burn refunded tokens", async function() {
      try {
        await fidaToken.burnSaleTokens(account_one, 2000, {from: owner});
        assert.fail("Tokens that have been refunded cannot be burned after sale");
      } catch(err) {}

      var totalSupply = (await fidaToken.totalSupply.call()).toNumber();
      var tokens = (await fidaToken.balanceOf(account_one)).toNumber();

      assert.equal(totalSupply, 4000, "Tokens have been removed from totalSupply");
      assert.equal(tokens, 4000, "Tokens have been burned while it shouldn't");
    });

    it("should be able to burn tokens from deposit address after sale", async function() {
      fidaToken.mintTokens(4000, {from: owner});

      try {
        await fidaToken.burnTokens(2000, {from: owner});
      } catch(err) {
        assert.fail("Tokens couldn't be burned from deposit address after sale");
      }

      var totalSupply = (await fidaToken.totalSupply.call()).toNumber();
      var tokens = (await fidaToken.balanceOf(owner)).toNumber();

      assert.equal(totalSupply, 6000, "Tokens have been removed from totalSupply after sale from deposit address");
      assert.equal(tokens, 2000, "Tokens have not been burned after sale from deposit address");
    });
  });

  function createToken(done, callback) {
    ContractManager.new({from: owner}).then(function(instance) {
      contractManager = instance;
      
      FidaToken.new(owner, "FidaToken", contractManager.address, {from: owner}).then(function(instance) {
        fidaToken = instance;

        contractManager.addContract("FidaToken", fidaToken.address, {from: owner}).then(function() {
          contractManager.setAuthorizedContract("FidaToken", owner, true, {from: owner}).then(function() {
            if(callback) {
              callback(done);
            } else {
              done();
            }
          });
        });
      });
    });
  }
});