var ContractManager = artifacts.require("ContractManager");
var MemberManager = artifacts.require("MemberManager.sol");

contract('MemberManager', function(accounts) {
  var contractManager;
  var memberManager;

  var owner = accounts[1];

  var address_one = accounts[6];
  var address_two = accounts[7];
  var address_three = accounts[8];
  var address_four = accounts[9];

  before("should create all contractse", function(done) {
    ContractManager.new({from: owner}).then(function(instance) {
      contractManager = instance;
      MemberManager.new("MemberManager", contractManager.address, {from: owner}).then(function(instance) {
        memberManager = instance;

        contractManager.addContract("MemberManager", memberManager.address, {from: owner}).then(function() {
          contractManager.setAuthorizedContract("MemberManager", owner, true, {from: owner}).then(function() {
            done();
          });
        });
      });
    });
  });

  describe("removing members", function() {
    it("should be able to remove members", async function() {
      await memberManager.addAmountBoughtAsMember(address_one, 4000, {from: owner});
      await memberManager.removeMember(address_one, {from: owner});
    });
  
    it("should not be able to remove members twice", async function() {
      try {
        await memberManager.removeMember(address_one, {from: owner});

        assert.fail("Member was removed for a second time");
      } catch(err) {}
    });

    it("should not be able to remove members when not authorized", async function() {
      try {
        await memberManager.addMember(address_one, {from: owner});
        await memberManager.removeMember(address_two, {from: address_one});

        assert.fail("Member was removed while address was not authorized");
      } catch(err) {}
    });
  });

  describe("buying as member", function() {
    it("should be able to add bought tokens", async function() {
      await memberManager.addAmountBoughtAsMember(address_three, 4000, {from: owner});
      var tokens = (await memberManager.bought.call(address_three)).toNumber();
  
      assert.equal(tokens, 4000, "Bought tokens were not successfully registered");
    });

    it("should not be able to add 0 bought tokens", async function() {
      try {
        await memberManager.addAmountBoughtAsMember(address_three, 0, {from: owner});
    
        assert.fail("0 bought tokens were added instead of throwing");
      } catch(err) {}
    });

    it("should not be able to add when not authorized", async function() {
      try {
        await memberManager.addAmountBoughtAsMember(address_three, 4000, {from: address_one});
    
        assert.fail("Tokens were added while not authorized");
      } catch(err) {}
    });
  });
});