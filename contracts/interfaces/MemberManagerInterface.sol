pragma solidity ^0.4.23;

/**
 * @title Member Manager Interface
 * @author Bram Hoven
 */
interface MemberManagerInterface {
  /**
   * @notice Triggered when member is added
   * @param member Address of newly added member
   */
  event MemberAdded(address indexed member);

  /**
   * @notice Triggered when member is removed
   * @param member Address of removed member
   */
  event MemberRemoved(address indexed member);

  /**
   * @notice Triggered when member has bought tokens
   * @param member Address of member
   * @param tokensBought Amount of tokens bought
   * @param tokens Amount of total tokens bought by member
   */
  event TokensBought(address indexed member, uint256 tokensBought, uint256 tokens);

  /**
   * @notice Remove a member from this contract
   * @param _member Address of member that will be removed
   */
  function removeMember(address _member) external;

  /**
   * @notice Add to the amount this member has bought
   * @param _member Address of the corresponding member
   * @param _amountBought Amount of tokens this member has bought
   */
  function addAmountBoughtAsMember(address _member, uint256 _amountBought) external;
}