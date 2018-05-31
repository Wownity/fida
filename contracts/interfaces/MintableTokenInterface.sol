pragma solidity ^0.4.23;

/**
 * @title Mintable Token Interface
 * @author Bram Hoven
 * @notice Interface for communicating with the mintable token
 */
interface MintableTokenInterface {
  /**
   * @notice Triggered when tokens are minted
   * @param _from Address which triggered the minting
   * @param _to Address on which the tokens are deposited
   * @param _tokens Amount of tokens minted
   */
  event TokensMinted(address indexed _from, address indexed _to, uint256 _tokens);

  /**
   * @notice Triggered when the deposit address changes
   * @param _old Old deposit address
   * @param _new New deposit address
   */
  event DepositAddressChanged(address indexed _old, address indexed _new);

  /**
   * @notice Called when new tokens are needed in circulation
   * @param _tokens Amount of tokens to be created
   */
  function mintTokens(uint256 _tokens) external;

  /**
   * @notice Called when tokens are bought in token sale
   * @param _beneficiary Address on which tokens are deposited
   * @param _tokens Amount of tokens to be created
   */
  function sendBoughtTokens(address _beneficiary, uint256 _tokens) external;

  /**
   * @notice Called when deposit address needs to change
   * @param _depositAddress Address on which minted tokens are deposited
   */
  function changeDepositAddress(address _depositAddress) external;
}