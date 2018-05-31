pragma solidity ^0.4.23;

import "../interfaces/BurnableTokenInterface.sol";

import "./MintableToken.sol";

/**
 * @title Burnable Token
 * @author Bram Hoven
 * @notice Contract for a token which can be burned during the sale or after
 */
contract BurnableToken is BurnableTokenInterface, MintableToken {

  /**
   * @notice Constructor for creating burnable token
   * @param _depositAddress Address on which minted coins will be deposited
   * @param _contractName Name of this contract for lookup in contract manager
   * @param _contractManager Address where the contract manager is located
   */
  constructor(address _depositAddress, string _contractName, address _contractManager) public MintableToken(_depositAddress, _contractName, _contractManager) {
  }

  /**
   * @notice Called when tokens have to be burned (only after sale)
   * @param _tokens Amount of tokens to be burned
   */
  function burnTokens(uint256 _tokens) external {
    require(!locked);
    require(contractManager.authorize(contractName, msg.sender));

    require(depositAddress != address(0));
    require(_tokens != 0);
    require(_tokens <= balances[depositAddress]);

    balances[depositAddress] = balances[depositAddress].sub(_tokens);
    totalSupply_ = totalSupply_.sub(_tokens);

    emit TokensBurned(msg.sender, depositAddress, _tokens);
  }
}