var PriceChecker = artifacts.require("./PriceChecker.sol");

contract("PriceChecker", function(accounts) {

  var owner = accounts[1];
  var priceChecker;

  before("deploy contract", async function() {
    priceChecker = await PriceChecker.new(owner, {value: web3.toWei(0.005, "ether"), from: owner});
  });
 
  it("should not get new price", async function() {
    try {
      await priceChecker.updatePrice();
      assert.fail("Should not be able to get price")
    } catch(err) {
      
    }
  });

  it("should get new price", function(done) {
    priceChecker.updatePrice({value: web3.toWei(1, "ether"), from: owner});
    var event = priceChecker.PriceUpdated({},{fromBlock: 0, toBlock: 'latest'});
    event.watch(function(err, res) {
      if(err) {
        assert.fail(err);
        done();
      } else {
        var price = res.args._price;
    
        assert.ok(price != undefined, "Couldn't get price from kraken api");

        event.stopWatching();
        done();
      }
    });
  });

  it("should calculate correct amount fida per ether", function(done) {
    priceChecker.updatePrice({value: web3.toWei(1, "ether"), from: owner});
    var event = priceChecker.PriceUpdated({},{fromBlock: 0, toBlock: 'latest'});
    event.watch(function(err, res) {
      if(err) {
        assert.fail(err);
        done();
      } else {
        priceChecker.fidaPerEther.call().then((calculatedFida) => {
          var fida = parseInt(res.args._price.replace(".", ""));

          assert.equal(calculatedFida.toNumber(), fida, "Amount fida calculate in contract does not equal the correct amount");

          event.stopWatching();
          done();
        });
      }
    });
  });
});