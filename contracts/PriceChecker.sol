pragma solidity ^0.4.23;

import "./oraclizeAPI_0.5.sol";

/**
 * @title Price Checker
 * @author Bram Hoven
 * @notice Retrieves the current Ether price in euros and converts it to the amount of fida per ether
 */
contract PriceChecker is usingOraclize {

  // The address that is allowed to call the `updatePrice()` function
  address priceCheckerAddress;
  // Current price of ethereum in euros
  string public ETHEUR = "571.85000";
  // Amount of fida per ether
  uint256 public fidaPerEther = 57185000;
  // Latest callback id
  mapping(bytes32 => bool) public ids;
  // Gaslimit to be used by oraclize
  uint256 gasLimit = 58598;

  /**
   * @notice Triggered when price is updated
   * @param _id Oraclize query id
   * @param _price Price of 1 ether in euro's
   */
  event PriceUpdated(bytes32 _id, string _price);
  /**
   * @notice Triggered when updatePrice() is called
   * @param _id Oraclize query id
   * @param _fees The price of the oraclize call in ether
   */
  event NewOraclizeQuery(bytes32 _id, uint256 _fees);

  /**
   * @notice Triggered when fee is lower than this.balance
   * @param _description String with message
   * @param _fees The amount of wei it cost to perform this query
   */
  event OraclizeQueryNotSend(string _description, uint256 _fees);

  /**
   * @notice Contructor for initializing the pricechecker
   * @param _priceCheckerAddress Address which is allow to call `updatePrice()`
   */
  constructor(address _priceCheckerAddress) public payable {
    priceCheckerAddress = _priceCheckerAddress;

    _updatePrice();
  }

  /**
   * @notice Function for updating the price stored in this contract
   */
  function updatePrice() public payable {
    require(msg.sender == priceCheckerAddress);

    _updatePrice();
  }

  function _updatePrice() private {
    if (oraclize_getPrice("URL", gasLimit) > address(this).balance) {
      emit OraclizeQueryNotSend("Oraclize query was NOT sent, please add some ETH to cover for the query fee", oraclize_getPrice("URL"));
    } else {
      bytes32 id = oraclize_query("URL", "json(https://api.kraken.com/0/public/Ticker?pair=ETHEUR).result.XETHZEUR.a[0]", gasLimit);
      ids[id] = true;
      emit NewOraclizeQuery(id, oraclize_getPrice("URL"));
    }
  }

  /**
   * @notice Oraclize callback function
   * @param _id The id of the query
   * @param _result Result of the query
   */
  function __callback(bytes32 _id, string _result) public {
    require(msg.sender == oraclize_cbAddress());
    require(ids[_id] == true);

    ETHEUR = _result;
    // Save price of ether as an uint without the 5 decimals (350.00000 * 10**5 = 35000000)
    fidaPerEther = parseInt(_result, 5);

    emit PriceUpdated(_id, _result);
  }

  /**
   * @notice Change gasLimit
   */
  function changeGasLimit(uint256 _gasLimit) public {
    require(msg.sender == priceCheckerAddress);

    gasLimit = _gasLimit;
  }
}
