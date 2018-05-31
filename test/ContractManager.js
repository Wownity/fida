var ContractManager = artifacts.require("ContractManager");

contract('ContractManager', function(accounts) {

  // Contract Manager contract
  var contractManager;

  var owner = accounts[1];

  var address_one = accounts[6];
  var address_two = accounts[7];
  var address_three = accounts[8];
  var address_four = accounts[9];

  it("should create contract with correct owner", async function() {
    contractManager = await ContractManager.new({from: owner});
  });

  it("should get correct contract by name", async function() {
    await contractManager.addContract("GetContract", address_one, {from: owner});

    let checkAddress = await contractManager.getContract.call("GetContract", {from: owner});

    assert.equal(checkAddress, address_one, "Addresses did not match");
  });

  describe("adding contract", async function() {
    it("should create contract", async function() {
      await contractManager.addContract("AddingContract", address_one, {from: owner});

      let checkAddress = await contractManager.getContract.call("AddingContract", {from: owner});

      assert.equal(checkAddress, address_one, "Contract was not added correctly");
    });

    it("should throws when creating from unauthorized adress", async function() {
      try {
        await contractManager.addContract("AddingContractUnauthorized", address_one, {from: address_four});
        assert.fail("It did not throw when adding a contract unauthorized");
      } catch(err) {
        // It passes
      }
    });
    
    it("should throw when adding contract with empty name", async function() {
      try {
        await contractManager.addContract("", address_one, {from: owner});
        assert.fail("It did not throw when adding a contract with empty name");
      } catch(err) {
        // It passes
      }
    });

    it("should throw when adding the same contract twice", async function() {
      await contractManager.addContract("AddSameContract", address_one, {from: owner});
      try {
        await contractManager.addContract("AddSameContract", address_one, {from: owner});
        assert.fail("It did not throw when adding the same contract");
      } catch(err) {
        // It passes
      }
    });

    it("should throw when address is equal to 0x0", async function() {
      try {
        await contractManager.addContract("AddContract0x0", address_one, {from: "0x0"});
        assert.fail("It did not throw when adding contract from 0x0");
      } catch(err) {
        // It passes
      }
    });
  });

  describe("removing contract", async function() {
    it("should remove a contract", async function() {
      await contractManager.addContract("RemovableContract", address_one, {from: owner});

      await contractManager.removeContract("RemovableContract", {from: owner});
    });

    it("should throw when removing a contract with empty contract name", async function() {
      try {
        await contractManager.removeContract("", {from: owner});
        assert.fail("It did not throw when removing contract with empty contract name")
      } catch(err) {
        // It passes
      }
    });

    it("should throw when removing a contract that does not exist", async function() {
      try {
        await contractManager.removeContract("Blupperdeblup", {from: owner});
        assert.fail("It did not throw when removing contract that does not exist")
      } catch(err) {
        // It passes
      }
    });
  });

  describe("updating contract", async function() {
    before("setup the contract", async function() {
      await contractManager.addContract("UpdateContract", address_one, {from: owner});
      await contractManager.setAuthorizedContract("UpdateContract", address_four, true, {from: owner});
    });

    it("should update contract", async function() {
      try {
        await contractManager.updateContract("UpdateContract", address_two, {from: owner});
        // It passes
      } catch(err) {
        assert.fail("Threw an error when updating contract");
      }
    });

    it("should update authorization", async function() {
      try {
        let authorized = await contractManager.authorize.call("UpdateContract", address_four, {from: address_two});
        assert.ok(authorized, "Address was not authorized while it should have been")
      } catch(err) {
        assert.fail("Threw an error when updating contract");
      }
    });

    it("should not update if contract name is empty", async function() {
      try {
        await contractManager.updateContract("", address_two, {from: owner});
        assert.fail("It did not threw an error even though contract name was empty");
      } catch(err) {
        // It passes
      }
    });

    it("should not update if contract does not exist", async function() {
      try {
        await contractManager.updateContract("RandomContract", address_two, {from: owner});
        assert.fail("It did not threw an error even though contract did not exist");
      } catch(err) {
        // It passes
      }
    });

    it("should not update if address is equal to 0x0", async function() {
      try {
        await contractManager.updateContract("UpdateContract", "0x0", {from: owner});
        assert.fail("It did not threw an error even though address is equal to 0x0");
      } catch(err) {
        // It passes
      }
    });
  });

  describe("authorization", async function() {
    before("setup the contract", async function() {
      await contractManager.addContract("AuthContract", address_one, {from: owner});
    });

    it("should have no authorization", async function() {
      try {
        await contractManager.authorize.call("AuthContract", address_two, {from: address_one});
        assert.fail("It did not throw when authorizing an unauthorized address");
      } catch(err) {
        // It passes
      }
    });

    it("should authorize address", async function() {
      await contractManager.setAuthorizedContract("AuthContract", address_two, true, {from: owner});

      try {
        let authorized = await contractManager.authorize.call("AuthContract", address_two, {from: address_one});
        assert.ok(authorized, "Address was not authorized while it should have been")
      } catch(err) {
        assert.fail("It threw while it was authorized");
      }
    });

    it("should deauthorize address", async function() {
      await contractManager.setAuthorizedContract("AuthContract", address_two, false, {from: owner});

      try {
        await contractManager.authorize.call("AuthContract", address_two, {from: address_one});
        assert.fail("It did not throw while address was deauthorized");
      } catch(err) {
        // It passes
      }
    });

    it("should throw when passing empty contract name", async function() {  
      try {
        await contractManager.setAuthorizedContract("", address_two, true, {from: owner});
        assert.fail("It did not throw while contract name was empty");
      } catch(err) {
        // It passes
      }
    });

    it("should throw when passing address 0x0", async function() {  
      try {
        await contractManager.setAuthorizedContract("OtherAuthContract", "0x0", true, {from: owner});
        assert.fail("It did not throw when passing address 0x0");
      } catch(err) {
        // It passes
      }
    });

    it("should throw when setting the same authorization status", async function() {
      await contractManager.setAuthorizedContract("AuthContract", address_three, true, {from: owner});

      try {
        await contractManager.setAuthorizedContract("AuthContract", address_three, true, {from: owner});
        assert.fail("It did not throw while authorization status was the same");
      } catch(err) {
        // It passes
      }
    });
  });
});
