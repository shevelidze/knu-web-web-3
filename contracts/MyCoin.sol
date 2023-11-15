// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

contract MyCoin {
	mapping (address => uint) balances;

	constructor() {
		balances[tx.origin] = 1000;
	}

	function transfer(address receiverAddress, uint amount) public returns(bool sufficient) {
		if (balances[msg.sender] < amount) {
			return false;
		}

		balances[msg.sender] -= amount;
		balances[receiverAddress] += amount;

		return true;
	}

	function getBalance() public view returns(uint) {
		return balances[msg.sender];
	}
}
