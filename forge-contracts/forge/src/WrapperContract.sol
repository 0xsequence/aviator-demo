// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

interface SequenceMarketInterface {
  struct RequestParams {
    bool isListing;
    bool isERC1155;
    address tokenContract;
    uint256 tokenId;
    uint256 quantity;
    address currency;
    uint256 pricePerToken;
    uint256 expiry;
  }

  function createRequest(
    RequestParams calldata request
  ) external returns (uint256 requestId);
}

interface IERC20 {
  function allowance(
    address owner,
    address spender
  ) external view returns (uint256);
  function approve(address spender, uint256 amount) external returns (bool);
}

contract WrapperContract {
  address public sequenceMarketAddress;
  address public owner;
  address[] public sponsoredAddresses; // Corrected declaration

  modifier onlyOwner() {
    require(msg.sender == owner, 'Caller is not the owner');
    _;
  }

  constructor(address _sequenceMarketAddress) {
    sequenceMarketAddress = _sequenceMarketAddress;
    owner = msg.sender;
  }

  function addToSponsoredAddresses(address _contract) external onlyOwner {
    sponsoredAddresses.push(_contract);
  }

  function removeFromSponsoredAddresses(uint index) external onlyOwner {
    require(index < sponsoredAddresses.length, 'Index out of bounds');

    // Move the last element into the place to delete
    sponsoredAddresses[index] = sponsoredAddresses[
      sponsoredAddresses.length - 1
    ];
    // Remove the last element
    sponsoredAddresses.pop();
  }

  function createRequestThroughWrapper(
    SequenceMarketInterface.RequestParams calldata request
  ) external returns (uint256 requestId) {
    require(isSponsored(request.tokenContract), 'Not a Sponsored Contract');

    // Check current allowance
    uint256 currentAllowance = IERC20(request.currency).allowance(
      msg.sender,
      sequenceMarketAddress
    );
    uint256 requiredAllowance = request.quantity * request.pricePerToken;

    if (currentAllowance < requiredAllowance) {
      // Prepare the data for the approve delegatecall
      bytes memory approveData = abi.encodeWithSelector(
        IERC20.approve.selector,
        sequenceMarketAddress,
        requiredAllowance
      );

      // Perform the delegatecall to the ERC20 token's approve function
      (bool approveSuccess, ) = request.currency.delegatecall(approveData);
      require(approveSuccess, 'Approve delegatecall failed');
    }

    // Prepare the data for delegatecall
    bytes memory data = abi.encodeWithSelector(
      SequenceMarketInterface.createRequest.selector,
      request
    );

    // Perform the delegatecall to SequenceMarket's createRequest
    (bool success, bytes memory returnData) = sequenceMarketAddress
      .delegatecall(data);
    require(success, 'Delegatecall failed');

    // Decode the returned requestId
    requestId = abi.decode(returnData, (uint256));

    return requestId;
  }

  function isSponsored(address _contract) public view returns (bool) {
    for (uint i = 0; i < sponsoredAddresses.length; i++) {
      if (sponsoredAddresses[i] == _contract) {
        return true;
      }
    }
    return false;
  }
}
