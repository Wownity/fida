pragma solidity ^0.4.23;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "./interfaces/ContractManagerInterface.sol";
import "./interfaces/MintableTokenInterface.sol";

contract BountyProgram {
  using SafeMath for uint256;

  // Wownity bounty address
  address public bountyAddress;

  // Amount of total tokens that were available
  uint256 TOKENS_IN_BOUNTY = 25 * 10**4 * 10**18;
  // Amount of tokens that are still available
  uint256 tokenAvailable = 25 * 10**4 * 10**18;

  // Name of this contract
  string private contractName;  
  // Contract Manager
  ContractManagerInterface private contractManager;
  // The fida mintable token
  MintableTokenInterface private mintableFida;

  /**
   * @notice Triggered when bounty wallet address is changed
   * @param _oldAddress Address where the bounty wallet used to be
   * @param _newAddress Address where the new bounty wallet is
   */
  event BountyWalletAddressChanged(address indexed _oldAddress, address indexed _newAddress);

  /**
   * @notice Triggered when a bounty is send
   * @param _bountyReceiver Address where the bounty is send to
   * @param _bountyTokens Amount of tokens that have been send
   */
  event BountySend(address indexed _bountyReceiver, uint256 _bountyTokens);

  /**
   * @notice Contructor for creating the fida bounty program
   * @param _contractName Name of this contract in the contract manager
   * @param _bountyAddress Address of where bounty tokens will be send from
   * @param _tokenAddress Address where ERC20 token is located
   * @param _contractManager Address where the contract manager is deployed
   */
  constructor(string _contractName, address _bountyAddress, address _tokenAddress, address _contractManager) public {
    contractName = _contractName;
    bountyAddress = _bountyAddress;
    mintableFida = MintableTokenInterface(_tokenAddress);
    contractManager = ContractManagerInterface(_contractManager);
  }

  /**
   * @notice Change the address to where the bounty will be send when sale starts
   * @param _walletAddress Address of the wallet
   */
  function setBountyWalletAddress(address _walletAddress) external {
    require(contractManager.authorize(contractName, msg.sender));
    require(_walletAddress != address(0));
    require(_walletAddress != bountyAddress);

    address oldAddress = bountyAddress;
    bountyAddress = _walletAddress;

    emit BountyWalletAddressChanged(oldAddress, _walletAddress);
  }

  /**
   * @notice Give out a bounty
   * @param _tokens Amount of tokens to be given out
   * @param _address Address whom will receive the bounty
   */
  function giveBounty(uint256 _tokens, address _address) external {
    require(msg.sender == bountyAddress);

    tokenAvailable = tokenAvailable.sub(_tokens);

    mintableFida.sendBoughtTokens(_address, _tokens);
  }
}