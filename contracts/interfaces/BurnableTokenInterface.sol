pragma solidity ^0.4.23;

/**
 * @title Burnable Token Interface
 * @author Bram Hoven
 * @notice Interface for communicating with the burnable token
 */
interface BurnableTokenInterface {
  /**
   * @notice Triggered when tokens are burned
   * @param _triggerer Address which triggered the burning
   * @param _from Address from which the tokens are burned
   * @param _tokens Amount of tokens burned
   */
  event TokensBurned(address indexed _triggerer, address indexed _from, uint256 _tokens);

  /**
   * @notice Called when tokens have to be burned
   * @param _tokens Amount of tokens to be burned
   */
  function burnTokens(uint256 _tokens) external;
}