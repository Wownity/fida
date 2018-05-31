pragma solidity ^0.4.23;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/math/Math.sol";

contract BonusProgram {
  using SafeMath for uint256;

  // Amount of decimals specified for the ERC20 token
  uint constant DECIMALS = 18;

  // Initial amount of bonus program tokens
  uint256 public initialBonuslistTokens;
  // Tokens that have been bought in bonus program
  uint256 public tokensBoughtInBonusProgram = 0;

  constructor(uint256 _initialBonuslistTokens) public {
    initialBonuslistTokens = _initialBonuslistTokens;
  }

  /**
   * @dev Calculates the amount of bonus tokens a buyer gets, based on how much the buyer bought and in which bonus threshold the purchase falls.
   *      Note that this function does not modify any variables besides the _totalTokensSold, the responsibility for that lies with the caller.
   * @param _tokensBought Number of tokens a buyer bought
   * @param _totalTokensSold Number of tokens sold prior to the buyer buying their tokens
   * @return The amount of tokens the buyer should receive as bonus
   */
  function _calculateBonus(uint256 _tokensBought, uint256 _totalTokensSold) internal pure returns (uint) {
    uint _bonusTokens = 0;
    // This checks if the bonus cap has been reached.
    if (_totalTokensSold > 150 * 10**5 * 10**DECIMALS) {
      return _bonusTokens;
    }
    // Bonus tranches: [ 15%, 10%, 5%, 2.5% ]
    uint8[4] memory _bonusPattern = [ 150, 100, 50, 25 ];
    // Bonus tranche thresholds in millions
    uint256[5] memory _thresholds = [ 0, 25 * 10**5 * 10**DECIMALS, 50 * 10**5 * 10**DECIMALS, 100 * 10**5 * 10**DECIMALS, 150 * 10**5 * 10**DECIMALS ];

    for(uint8 i = 0; _tokensBought > 0 && i < _bonusPattern.length; ++i) {
      uint _min = _thresholds[i];
      uint _max = _thresholds[i+1];

      if(_totalTokensSold >= _min && _totalTokensSold < _max) {
        uint _bonusedPart = Math.min256(_tokensBought, _max - _totalTokensSold);
        _bonusTokens = _bonusTokens.add(_bonusedPart * _bonusPattern[i] / 1000);
        _tokensBought = _tokensBought.sub(_bonusedPart);
        _totalTokensSold  = _totalTokensSold.add(_bonusedPart);
      }
    }
    return _bonusTokens;
  }
}
