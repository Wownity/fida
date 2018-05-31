const ContractManager = artifacts.require("ContractManager");
const FidaToken = artifacts.require("FidaToken");
const MemberManager = artifacts.require("MemberManager");
const FidaSale = artifacts.require("FidaSale");

module.exports = function (deployer, network, accounts) {
  var owner = accounts[0];

  /*var wallet = owner;
  var bountyAddress = owner;
  var btcTokenBoughtAddress = owner;
  var whitelistingAddress = owner;
  var priceCheckerAddress = owner;*/

  var wallet = "0xf1da45d38c47504ebbf634063921fb1a205f2a93";
  var bountyAddress = "0xEC45b21eC140299E1D7D57195CC485A517b2FAfb";
  var btcTokenBoughtAddress = "0x483BBbbf596d7e286EcB0aa1A5bf0C92074b4fa4";
  var whitelistingAddress = "0x09b74fEB9485978bADBe447072a984D9F788FAc6";
  var priceCheckerAddress = "0x483BBbbf596d7e286EcB0aa1A5bf0C92074b4fa4";

  var contractManager;
  var fidaSale;
  var fidaToken;
  var whitelist;
  
  deployer.then(function () {
    return deployer.deploy(ContractManager, { from: owner, gas: 1300000, gasPrice: web3.toWei(10, 'gwei') });
  }).then(function () {
    return ContractManager.deployed();
  }).then(function (instance) {
    contractManager = instance;

    return deployer.deploy(FidaToken, owner, "FidaToken", contractManager.address, { from: owner, gas: 1600000, gasPrice: web3.toWei(10, 'gwei') });
  }).then(function () {
    return FidaToken.deployed();
  }).then(function (instance) {
    fidaToken = instance;

    return deployer.deploy(MemberManager, "Whitelist", contractManager.address, { from: owner, gas: 710000, gasPrice: web3.toWei(10, 'gwei') });
  }).then(function () {
    return MemberManager.deployed();
  }).then(function (instance) {
    whitelist = instance;

    return contractManager.addContract("FidaToken", fidaToken.address, { from: owner, gas: 50000, gasPrice: web3.toWei(10, 'gwei') });
  }).then(function () {
    return contractManager.addContract("Whitelist", whitelist.address, { from: owner, gas: 50000, gasPrice: web3.toWei(10, 'gwei')});
  }).then(function () {
    return deployer.deploy(FidaSale, "FidaSale", wallet, bountyAddress, btcTokenBoughtAddress, whitelistingAddress, priceCheckerAddress, contractManager.address, "FidaToken", "Whitelist", { from: owner, gas: 4300000, gasPrice: web3.toWei(10, 'gwei') });
  }).then(function () {
    return FidaSale.deployed();
  }).then(async function (instance) {
    fidaSale = instance;
    
    await contractManager.addContract("FidaSale", fidaSale.address, { from: owner, gas: 50000, gasPrice: web3.toWei(10, 'gwei') });
    await contractManager.setAuthorizedContract("FidaSale", owner, true, { from: owner, gas: 51000, gasPrice: web3.toWei(10, 'gwei') });
    await contractManager.setAuthorizedContract("FidaToken", fidaSale.address, true, { from: owner, gas: 51000, gasPrice: web3.toWei(10, 'gwei') });
    await contractManager.setAuthorizedContract("FidaToken", owner, true, { from: owner, gas: 51000, gasPrice: web3.toWei(10, 'gwei') });
    await contractManager.setAuthorizedContract("Whitelist", fidaSale.address, true, { from: owner, gas: 51000, gasPrice: web3.toWei(10, 'gwei') });
    await contractManager.setAuthorizedContract("Whitelist", owner, true, { from: owner, gas: 51000, gasPrice: web3.toWei(10, 'gwei') });
  });
};
