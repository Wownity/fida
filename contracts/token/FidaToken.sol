pragma solidity ^0.4.23;

import "./BurnableToken.sol";

/**
 * @title Fida Token
 * @author Bram Hoven
 * @notice Token contract for the fida token
 */
contract FidaToken is BurnableToken {
  string public name = "fida";
  string public symbol = "fida";
  uint8 public decimals = 18;
  
  /**
   * @notice Constructor which creates the fida token
   * @param _depositAddress Address on which minted tokens are deposited
   * @param _contractName Name of this contract for lookup in contract manager
   * @param _contractManager Address where the contract manager is located
   */
  constructor(address _depositAddress, string _contractName, address _contractManager) public BurnableToken(_depositAddress, _contractName, _contractManager) {}

  /**
   * @notice Unlock tokens, hereafter they will be tradable
   */
  function unlockTokens() public {
    require(contractManager.authorize(contractName, msg.sender));

    BasicToken.unlockTokens();
  }
}