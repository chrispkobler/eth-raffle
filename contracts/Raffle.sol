pragma solidity ^0.4.19;

contract Raffle { 
   address public manager;
   address[] public players;
   
   function Raffle() public {
        manager = msg.sender;
   }
   
   modifier restricted() {
       require(msg.sender == manager);
       _;
   }
   
   function enter() public payable {
       require(msg.value >= 0.01 ether);
       players.push(msg.sender);
   }
   
   function random() private view returns (uint) {
       return uint(keccak256(block.difficulty, now, players.length));
   }
   
   function pickWinner() public restricted {
       uint index = random() % players.length;
       players[index].transfer(this.balance);
       players = new address[](0);
   }
   
   function getPlayers() public view returns (address[]) {
       return players;
   }
}