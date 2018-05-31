pragma solidity ^0.4.23;

/**
 * @title Contract Manager Interface
 * @author Bram Hoven
 * @notice Interface for communicating with the contract manager
 */
interface ContractManagerInterface {
  /**
   * @notice Triggered when contract is added
   * @param _address Address of the new contract
   * @param _contractName Name of the new contract
   */
  event ContractAdded(address indexed _address, string _contractName);

  /**
   * @notice Triggered when contract is removed
   * @param _contractName Name of the contract that is removed
   */
  event ContractRemoved(string _contractName);

  /**
   * @notice Triggered when contract is updated
   * @param _oldAddress Address where the contract used to be
   * @param _newAddress Address where the new contract is deployed
   * @param _contractName Name of the contract that has been updated
   */
  event ContractUpdated(address indexed _oldAddress, address indexed _newAddress, string _contractName);

  /**
   * @notice Triggered when authorization status changed
   * @param _address Address who will gain or lose authorization to _contractName
   * @param _authorized Boolean whether or not the address is authorized
   * @param _contractName Name of the contract
   */
  event AuthorizationChanged(address indexed _address, bool _authorized, string _contractName);

  /**
   * @notice Check whether the accessor is authorized to access that contract
   * @param _contractName Name of the contract that is being accessed
   * @param _accessor Address who wants to access that contract
   */
  function authorize(string _contractName, address _accessor) external view returns (bool);

  /**
   * @notice Add a new contract to the manager
   * @param _contractName Name of the new contract
   * @param _address Address of the new contract
   */
  function addContract(string _contractName, address _address) external;

  /**
   * @notice Get a contract by its name
   * @param _contractName Name of the contract
   */
  function getContract(string _contractName) external view returns (address _contractAddress);

  /**
   * @notice Remove an existing contract
   * @param _contractName Name of the contract that will be removed
   */
  function removeContract(string _contractName) external;

  /**
   * @notice Update an existing contract (changing the address)
   * @param _contractName Name of the existing contract
   * @param _newAddress Address where the new contract is deployed
   */
  function updateContract(string _contractName, address _newAddress) external;

  /**
   * @notice Change whether an address is authorized to use a specific contract or not
   * @param _contractName Name of the contract to which the accessor will gain authorization or not
   * @param _authorizedAddress Address which will have its authorisation status changed
   * @param _authorized Boolean whether the address will have access or not
   */
  function setAuthorizedContract(string _contractName, address _authorizedAddress, bool _authorized) external;
}
