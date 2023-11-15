import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract Aviator is ERC1155 {

    address public owner;
    bool public on;

    modifier onlyOwner(){
        require(msg.sender == owner);
        _;
    }
    
    constructor() ERC1155("https://bafybeichphvz2atadcr7byqlyryep6atser2n6efotnct6hqphhmkph6sy.ipfs.nftstorage.link/{id}.json") {
        owner = msg.sender;
        on = true;
    }

    function mint(uint256 tokenId) public {
        require(tokenId >= 0 && tokenId <= 4, "TokenId out of range");
        require(on, "Minting not on");
        _mint(msg.sender, tokenId, 1, "");
    }

    function updateOwner(address _newOwner) onlyOwner external {
        owner = _newOwner;
    }

    function toggle(bool _state) onlyOwner external {
        on = _state;
    }
}