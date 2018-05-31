pragma solidity ^0.4.23;

import "../interfaces/MintableTokenInterface.sol";
import "../interfaces/ContractManagerInterface.sol";

import "./BasicToken.sol";

/**
 * @title Mintable Token
 * @author Bram Hoven
 * @notice Contract for a token which can be minted during the sale or after
 */
contract MintableToken is MintableTokenInterface, BasicToken {
  // Address on which minted coins will be deposited (and burned if needed)
  address public depositAddress;
  // Name of this contract
  string public contractName;
  // Contract Manager
  ContractManagerInterface internal contractManager;

  /**
   * @notice Constructor for creating mintable token
   * @param _depositAddress Address on which minted coins will be deposited
   * @param _contractName Name of this contract for lookup in contract manager
   * @param _contractManager Address where the contract manager is located
   */
  constructor(address _depositAddress, string _contractName, address _contractManager) public {
    depositAddress = _depositAddress;
    contractName = _contractName;
    contractManager = ContractManagerInterface(_contractManager);
  }

  /**
   * @notice Called when new tokens are needed in circulation
   * @param _tokens Amount for tokens to be created
   */
  function mintTokens(uint256 _tokens) external {
    require(!locked);
    require(contractManager.authorize(contractName, msg.sender));
    require(_tokens != 0);

    totalSupply_ = totalSupply_.add(_tokens);
    balances[depositAddress] = balances[depositAddress].add(_tokens);

    emit TokensMinted(msg.sender, depositAddress, _tokens);
  }
  
  /**
   * @notice Called when tokens are bought in token sale
   * @param _beneficiary Address on which tokens are deposited
   * @param _tokens Amount of tokens to be created
   */
  function sendBoughtTokens(address _beneficiary, uint256 _tokens) external {
    require(locked);
    require(contractManager.authorize(contractName, msg.sender));
    require(_beneficiary != address(0));
    require(_tokens != 0);

    totalSupply_ = totalSupply_.add(_tokens);
    balances[depositAddress] = balances[depositAddress].add(_tokens);

    emit TokensMinted(msg.sender, depositAddress, _tokens);

    _transfer(depositAddress, _beneficiary, _tokens);
  }

  /**
   * @notice Called when deposit address needs to change
   * @param _depositAddress Address on which minted tokens are deposited
   */
  function changeDepositAddress(address _depositAddress) external {
    require(contractManager.authorize(contractName, msg.sender));
    require(_depositAddress != address(0));
    require(_depositAddress != depositAddress);

    address oldDepositAddress = depositAddress;
    depositAddress = _depositAddress;

    emit DepositAddressChanged(oldDepositAddress, _depositAddress);
  }
}