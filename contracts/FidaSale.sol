pragma solidity ^0.4.23;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol";

import "./interfaces/MemberManagerInterface.sol";
import "./interfaces/MintableTokenInterface.sol";
import "./interfaces/ContractManagerInterface.sol";

import "./BonusProgram.sol";
import "./BountyProgram.sol";
import "./PriceChecker.sol";

/**
 * @title Fida Sale
 * @author Bram Hoven
 * @notice Contract which will run the fida sale
 */
contract FidaSale is BonusProgram, BountyProgram, PriceChecker {
  using SafeMath for uint256;

  // Wownity wallet
  address public wallet;

  // Address which can buy tokens that have been bought with btc
  address public btcTokenBoughtAddress;
  // Address which can add addresses to the whitelist
  address public whitelistingAddress;

  // Contract Manager
  ContractManagerInterface private contractManager;
  // Name of this contract
  string private contractName;

  // The fida ERC20 token
  ERC20Basic private fidaToken;
  // The fida mintable token
  MintableTokenInterface private mintableFida;
  // Address on which the fida ERC20 contract is deployed
  address public fidaTokenAddress;
  // Amount of decimals specified for the ERC20 token
  uint256 public DECIMALS = 18;

  // Contract for earlybird check
  MemberManagerInterface public earlybird;

  // Total amount of investors
  uint256 public investorCount;

  // Investor whitelist
  mapping(address => bool) public whitelist;
  // Mapping of all our investors and amount they invested
  mapping(address => uint256) public investors;

  // Initial amount of bonus program tokens
  uint256 public INITIAL_BONUSLIST_TOKENS = 150 * 10**5 * 10**DECIMALS; // 15,000,000 fida
  // Initial amount of earlybird program tokens
  uint256 public INITIAL_EARLYBIRD_TOKENS = 50 * 10**5 * 10**DECIMALS; // 5,000,000 fida
  // Tokens that have been bought in early bird program
  uint256 public tokensBoughtInEarlybird = 0;

  // Shows the state of the bonus program
  bool public bonusProgramEnded = false;
  // Shows the state of the earlybird progran
  bool public earlybirdEnded = false;

  // Shows whether the fida sale has started
  bool public started = false;
  // Shows the state of the fida sale
  bool public finished = false;

  /**
   * @notice Triggered when token address is changed
   * @param _oldAddress Address where the ERC20 contract used to be
   * @param _newAddress Address where the new ERC20 contract is now deployed
   */
  event TokenAddressChanged(address indexed _oldAddress, address indexed _newAddress);

  /**
   * @notice Triggered when wallet address is changed
   * @param _oldAddress Address where the wallet used to be
   * @param _newAddress Address where the new wallet is
   */
  event WalletAddressChanged(address indexed _oldAddress, address indexed _newAddress);

  /**
   * @notice Triggered when btc token bought address is changed
   * @param _oldAddress Address what the authorized address used to be
   * @param _newAddress Address what the authorized address 
   */
  event BtcTokenBoughtAddressChanged(address indexed _oldAddress, address indexed _newAddress);

  /**
   * @notice Triggered when the whitelisting address is changed
   * @param _oldAddress Address what the authorized address used to be
   * @param _newAddress Address what the authorized address 
   */
  event WhitelistingAddressChanged(address indexed _oldAddress, address indexed _newAddress);

  /**
   * @notice Triggered when the whitelisting has changed for an address
   * @param _address Address which whitelisting status has changed
   * @param _whitelisted Status of his whitelisting (true = whitelisted)
   */
  event WhitelistChanged(address indexed _address, bool _whitelisted);

  /**
   * @notice Triggered when sale has started
   */
  event StartedSale();

  /**
   * @notice Triggered when sale has ended
   */
  event FinishedSale();

  /**
   * @notice Triggered when a early bird purchase has been made
   * @param _buyer Address who bought the tokens
   * @param _tokens Amount of tokens that have been bought
   */
  event BoughtEarlyBird(address indexed _buyer, uint256 _tokens);

  /**
   * @notice Triggered when a bonus program purchase has been made
   * @param _buyer Address who bought the tokens
   * @param _tokens Amount of tokens bought excl. bonus tokens
   * @param _bonusTokens Amount of bonus tokens received
   */
  event BoughtBonusProgram(address indexed _buyer, uint256 _tokens, uint256 _bonusTokens);

  /**
   * @notice Contructor for creating the fida sale
   * @param _contractName Name of this contract in the contract manager
   * @param _wallet Address of wallet where funds will be send
   * @param _bountyAddress Address of wallet where bounty tokens will be send to
   * @param _btcTokenBoughtAddress Address which is authorized to send tokens bought with btc
   * @param _whitelistingAddress Address which is authorized to add address to the whitelist
   * @param _priceCheckerAddress Address which is allow to call `updatePrice()`
   * @param _contractManager Address where the contract manager is deployed
   * @param _tokenContractName Name of the token contract in the contract manager
   * @param _memberContractName Name of the member manager contract in the contract manager
   */
  constructor(string _contractName, address _wallet, address _bountyAddress, address _btcTokenBoughtAddress, address _whitelistingAddress, address _priceCheckerAddress, address _contractManager, string _tokenContractName, string _memberContractName) public payable 
    BonusProgram(INITIAL_BONUSLIST_TOKENS) 
    BountyProgram(_contractName, _bountyAddress, _bountyAddress, _contractManager) 
    PriceChecker(_priceCheckerAddress) {

    contractName = _contractName;
    wallet = _wallet;
    btcTokenBoughtAddress = _btcTokenBoughtAddress;
    whitelistingAddress = _whitelistingAddress;
    contractManager = ContractManagerInterface(_contractManager);

    _changeTokenAddress(contractManager.getContract(_tokenContractName));
    earlybird = MemberManagerInterface(contractManager.getContract(_memberContractName));
  }

  /**
   * @notice Internal function for changing the token address
   * @param _tokenAddress Address where the new ERC20 contract is deployed
   */
  function _changeTokenAddress(address _tokenAddress) internal {
    require(_tokenAddress != address(0));

    address oldAddress = fidaTokenAddress;
    fidaTokenAddress = _tokenAddress;
    fidaToken = ERC20Basic(_tokenAddress);
    mintableFida = MintableTokenInterface(_tokenAddress);

    emit TokenAddressChanged(oldAddress, _tokenAddress);
  }

  /**
   * @notice Change the wallet where ether will be sent to when tokens are bought
   * @param _walletAddress Address of the wallet
   */
  function setWalletAddress(address _walletAddress) external {
    require(contractManager.authorize(contractName, msg.sender));
    require(_walletAddress != address(0));
    require(_walletAddress != wallet);

    address oldAddress = wallet;
    wallet = _walletAddress;

    emit WalletAddressChanged(oldAddress, _walletAddress);
  }
  
  /**
   * @notice Change the address which is authorized to send bought tokens with BTC
   * @param _address Address of the authorized btc tokens bought client
   */
  function setBtcTokenBoughtAddress(address _address) external {
    require(contractManager.authorize(contractName, msg.sender));
    require(_address != address(0));
    require(_address != btcTokenBoughtAddress);

    address oldAddress = btcTokenBoughtAddress;
    btcTokenBoughtAddress = _address;

    emit BtcTokenBoughtAddressChanged(oldAddress, _address);
  }

  /**
   * @notice Change the address that is authorized to change whitelist
   * @param _address The authorized address
   */
  function setWhitelistingAddress(address _address) external {
    require(contractManager.authorize(contractName, msg.sender));
    require(_address != address(0));
    require(_address != whitelistingAddress);

    address oldAddress = whitelistingAddress;
    whitelistingAddress = _address;

    emit WhitelistingAddressChanged(oldAddress, _address);
  }

  /**
   * @notice Set the whitelist status for an address
   * @param _address Address which will have his status changed
   * @param _whitelisted True or False whether whitelisted or not
   */
  function setWhitelistStatus(address _address, bool _whitelisted) external {
    require(msg.sender == whitelistingAddress);
    require(whitelist[_address] != _whitelisted);

    whitelist[_address] = _whitelisted;

    emit WhitelistChanged(_address, _whitelisted);
  }

  /**
   * @notice Get the whitelist status for an address
   * @param _address Address which is or isn't whitelisted
   */
  function getWhitelistStatus(address _address) external view returns (bool _whitelisted) {
    require(msg.sender == whitelistingAddress);

    return whitelist[_address];
  }

  /**
   * @notice Amount of fida you would get for any amount in wei
   * @param _weiAmount Amount of wei you want to know the amount of fida for
   */
  function getAmountFida(uint256 _weiAmount) public view returns (uint256 _fidaAmount) {
    require(_weiAmount != 0);

    // fidaPerEther has been mutliplied by 10**5 because of decimals
    // so we have to divide by 100000
    _fidaAmount = _weiAmount.mul(fidaPerEther).div(100000);

    return _fidaAmount;
  }

  /**
   * @notice Internal function for investing as a earlybird member
   * @param _beneficiary Address on which tokens will be deposited
   * @param _amountTokens Amount of tokens that will be bought
   */
  function _investAsEarlybird(address _beneficiary, uint256 _amountTokens) internal {
    tokensBoughtInEarlybird = tokensBoughtInEarlybird.add(_amountTokens);

    earlybird.addAmountBoughtAsMember(_beneficiary, _amountTokens);
    _depositTokens(_beneficiary, _amountTokens);

    emit BoughtEarlyBird(_beneficiary, _amountTokens);

    if (tokensBoughtInEarlybird >= INITIAL_EARLYBIRD_TOKENS) {
      earlybirdEnded = true;
    }
  }

  /**
   * @notice Internal function for invest as a bonusprogram member
   * @param _beneficiary Address on which tokens will be deposited
   * @param _amountTokens Amount of tokens that will be bought
   */
  function _investAsBonusProgram(address _beneficiary, uint256 _amountTokens) internal {
    uint256 bonusTokens = _calculateBonus(_amountTokens, tokensBoughtInBonusProgram);
    uint256 amountTokensWithBonus = _amountTokens.add(bonusTokens);

    tokensBoughtInBonusProgram = tokensBoughtInBonusProgram.add(_amountTokens);

    _depositTokens(_beneficiary, amountTokensWithBonus);

    emit BoughtBonusProgram(_beneficiary, _amountTokens, bonusTokens);

    if (tokensBoughtInBonusProgram >= INITIAL_BONUSLIST_TOKENS) {
      bonusProgramEnded = true;
    }
  }

  /**
   * @notice Internal function for depositing tokens after they had been bought
   * @param _beneficiary Address on which the tokens will be deposited
   * @param _amountTokens Amount of tokens that have been bought
   */
  function _depositTokens(address _beneficiary, uint256 _amountTokens) internal {
    require(_amountTokens != 0);

    if (investors[_beneficiary] == 0) {
      investorCount++;
    }

    investors[_beneficiary] = investors[_beneficiary].add(_amountTokens);

    mintableFida.sendBoughtTokens(_beneficiary, _amountTokens);
  }

  /**
   * @notice Public payable function to buy tokens during sale or emission
   * @param _beneficiary Address to which tokens will be deposited
   */
  function buyTokens(address _beneficiary) public payable {
    require(started);
    require(!finished);
    require(_beneficiary != address(0));
    require(msg.value != 0);
    require(whitelist[msg.sender] && whitelist[_beneficiary]);
    require(fidaToken.totalSupply() < 24750 * 10**3 * 10**DECIMALS);

    uint256 amountTokens = getAmountFida(msg.value);
    require(amountTokens >= 50 * 10**DECIMALS);

    if (!earlybirdEnded) {
      _investAsEarlybird(_beneficiary, amountTokens);
    } else {
      _investAsBonusProgram(_beneficiary, amountTokens);
    }

    wallet.transfer(msg.value);
  }

  /**
   * @notice Public payable function to buy tokens during sale or emission
   * @param _beneficiary Address to which tokens will be deposited
   * @param _tokens Amount of tokens that will be bought
   */
  function tokensBoughtWithBTC(address _beneficiary, uint256 _tokens) public payable {
    require(msg.sender == btcTokenBoughtAddress);
    require(started);
    require(!finished);
    require(_beneficiary != address(0));
    require(whitelist[_beneficiary]);
    require(fidaToken.totalSupply() < 24750 * 10**3 * 10**DECIMALS);
    require(_tokens >= 50 * 10**DECIMALS);

    if (!earlybirdEnded) {
      _investAsEarlybird(_beneficiary, _tokens);
    } else {
      _investAsBonusProgram(_beneficiary, _tokens);
    }
  }

  /**
   * @notice Anonymous payable function, this makes it easier for people to buy their tokens
   */
  function () public payable {
    buyTokens(msg.sender);
  }

  /**
   * @notice Function to start this sale
   */
  function startSale() public {
    require(contractManager.authorize(contractName, msg.sender));
    require(!started);
    require(!finished);

    started = true;

    emit StartedSale();
  }

  /**
   * @notice Function to finish this sale
   */
  function finishedSale() public {
    require(contractManager.authorize(contractName, msg.sender));
    require(started);
    require(!finished);

    finished = true;

    emit FinishedSale();
  }
}
