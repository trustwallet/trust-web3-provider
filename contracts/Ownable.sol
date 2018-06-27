pragma solidity 0.4.24;


contract Ownable {

    address public owner;

    event NewOwner(address indexed owner);

    constructor () public {
        owner = msg.sender;
    }

    modifier restricted () {
        if (owner != msg.sender) revert();
        _;
    }

    function setOwner (address candidate) public restricted {
        if (candidate == address(0)) revert();
        owner = candidate;
        emit NewOwner(owner);
    }
}
