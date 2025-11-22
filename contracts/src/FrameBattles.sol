// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract FrameBattles is Ownable, ReentrancyGuard, Pausable {
    uint256 public platformFee = 25; // 2.5% platform fee (25/1000)
    uint256 public constant FEE_DENOMINATOR = 1000;

    enum BattleStatus { Open, Active, Resolved, Cancelled }

    struct Battle {
        uint256 id;
        string prediction;
        string description;
        uint256 stakeAmount;
        address challenger;
        address opponent;
        uint256 endTime;
        BattleStatus status;
        address winner;
        uint256 createdAt;
        bool challengerSaysYes; // true = challenger predicts YES, false = NO
    }

    struct UserStats {
        uint256 totalBattles;
        uint256 wins;
        uint256 losses;
        uint256 totalStaked;
        uint256 totalWinnings;
    }

    Battle[] public battles;
    mapping(address => UserStats) public userStats;
    mapping(address => uint256[]) public userBattles;
    
    uint256 public totalPlatformFees;

    event BattleCreated(uint256 indexed battleId, address indexed challenger, string prediction, uint256 stakeAmount, uint256 endTime);
    event BattleAccepted(uint256 indexed battleId, address indexed opponent);
    event BattleResolved(uint256 indexed battleId, address indexed winner, uint256 payout);
    event BattleCancelled(uint256 indexed battleId);

    constructor() Ownable(msg.sender) {}

    function createBattle(
        string memory _prediction,
        string memory _description,
        uint256 _endTime,
        bool _challengerSaysYes,
        address _specificOpponent
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        require(msg.value > 0, "Stake must be greater than 0");
        require(_endTime > block.timestamp + 1 hours, "Battle must last at least 1 hour");
        require(bytes(_prediction).length > 0, "Prediction cannot be empty");

        uint256 battleId = battles.length;
        battles.push(Battle({
            id: battleId,
            prediction: _prediction,
            description: _description,
            stakeAmount: msg.value,
            challenger: msg.sender,
            opponent: _specificOpponent,
            endTime: _endTime,
            status: BattleStatus.Open,
            winner: address(0),
            createdAt: block.timestamp,
            challengerSaysYes: _challengerSaysYes
        }));

        userBattles[msg.sender].push(battleId);
        if (_specificOpponent != address(0)) {
            userBattles[_specificOpponent].push(battleId);
        }

        emit BattleCreated(battleId, msg.sender, _prediction, msg.value, _endTime);
        return battleId;
    }

    function acceptBattle(uint256 _battleId) external payable whenNotPaused nonReentrant {
        require(_battleId < battles.length, "Battle does not exist");
        Battle storage battle = battles[_battleId];
        
        require(battle.status == BattleStatus.Open, "Battle not open");
        require(msg.sender != battle.challenger, "Cannot accept your own battle");
        
        if (battle.opponent != address(0)) {
            require(msg.sender == battle.opponent, "Battle is for specific opponent");
        }
        
        require(block.timestamp < battle.endTime, "Battle has expired");
        require(msg.value == battle.stakeAmount, "Must match stake amount");

        battle.opponent = msg.sender;
        battle.status = BattleStatus.Active;
        
        userStats[battle.challenger].totalBattles++;
        userStats[battle.challenger].totalStaked += battle.stakeAmount;
        userStats[msg.sender].totalBattles++;
        userStats[msg.sender].totalStaked += battle.stakeAmount;

        if (userBattles[msg.sender].length == 0 || userBattles[msg.sender][userBattles[msg.sender].length - 1] != _battleId) {
            userBattles[msg.sender].push(_battleId);
        }

        emit BattleAccepted(_battleId, msg.sender);
    }

    function resolveBattle(uint256 _battleId, bool _predictionCameTrue) external nonReentrant {
        require(_battleId < battles.length, "Battle does not exist");
        Battle storage battle = battles[_battleId];
        
        require(battle.status == BattleStatus.Active, "Battle not active");
        require(msg.sender == battle.challenger || msg.sender == owner(), "Only challenger or owner can resolve");
        require(block.timestamp >= battle.endTime, "Battle has not ended yet");

        battle.status = BattleStatus.Resolved;
        
        address winner;
        if (_predictionCameTrue == battle.challengerSaysYes) {
            winner = battle.challenger;
        } else {
            winner = battle.opponent;
        }
        
        battle.winner = winner;
        
        uint256 totalPool = battle.stakeAmount * 2;
        uint256 feeAmount = (totalPool * platformFee) / FEE_DENOMINATOR;
        uint256 payout = totalPool - feeAmount;
        
        totalPlatformFees += feeAmount;
        
        userStats[winner].wins++;
        userStats[winner].totalWinnings += payout;
        
        address loser = winner == battle.challenger ? battle.opponent : battle.challenger;
        userStats[loser].losses++;
        
        (bool success, ) = payable(winner).call{value: payout}("");
        require(success, "Transfer failed");

        emit BattleResolved(_battleId, winner, payout);
    }

    function cancelBattle(uint256 _battleId) external nonReentrant {
        require(_battleId < battles.length, "Battle does not exist");
        Battle storage battle = battles[_battleId];
        
        require(battle.status == BattleStatus.Open, "Can only cancel open battles");
        require(msg.sender == battle.challenger, "Only challenger can cancel");
        
        battle.status = BattleStatus.Cancelled;
        
        (bool success, ) = payable(battle.challenger).call{value: battle.stakeAmount}("");
        require(success, "Transfer failed");

        emit BattleCancelled(_battleId);
    }

    function getBattle(uint256 _battleId) external view returns (
        uint256 id,
        string memory prediction,
        string memory description,
        uint256 stakeAmount,
        address challenger,
        address opponent,
        uint256 endTime,
        BattleStatus status,
        address winner,
        uint256 createdAt,
        bool challengerSaysYes
    ) {
        Battle storage battle = battles[_battleId];
        return (
            battle.id,
            battle.prediction,
            battle.description,
            battle.stakeAmount,
            battle.challenger,
            battle.opponent,
            battle.endTime,
            battle.status,
            battle.winner,
            battle.createdAt,
            battle.challengerSaysYes
        );
    }

    struct BattleView {
        uint256 id;
        string prediction;
        string description;
        uint256 stakeAmount;
        address challenger;
        address opponent;
        uint256 endTime;
        BattleStatus status;
        address winner;
        uint256 createdAt;
        bool challengerSaysYes;
    }

    function getAllBattles() external view returns (BattleView[] memory) {
        BattleView[] memory allBattles = new BattleView[](battles.length);
        
        for (uint256 i = 0; i < battles.length; i++) {
            Battle storage battle = battles[i];
            allBattles[i] = BattleView({
                id: battle.id,
                prediction: battle.prediction,
                description: battle.description,
                stakeAmount: battle.stakeAmount,
                challenger: battle.challenger,
                opponent: battle.opponent,
                endTime: battle.endTime,
                status: battle.status,
                winner: battle.winner,
                createdAt: battle.createdAt,
                challengerSaysYes: battle.challengerSaysYes
            });
        }
        
        return allBattles;
    }

    function getUserBattles(address _user) external view returns (uint256[] memory) {
        return userBattles[_user];
    }

    function getUserStats(address _user) external view returns (UserStats memory) {
        return userStats[_user];
    }

    function getBattlesCount() external view returns (uint256) {
        return battles.length;
    }

    function getLeaderboard(uint256 _limit) external view returns (address[] memory, UserStats[] memory) {
        uint256 limit = _limit > battles.length ? battles.length : _limit;
        address[] memory topUsers = new address[](limit);
        UserStats[] memory topStats = new UserStats[](limit);
        
        // Simple leaderboard implementation - in production, use off-chain sorting
        uint256 count = 0;
        for (uint256 i = 0; i < battles.length && count < limit; i++) {
            address user = battles[i].challenger;
            if (userStats[user].totalBattles > 0) {
                topUsers[count] = user;
                topStats[count] = userStats[user];
                count++;
            }
        }
        
        return (topUsers, topStats);
    }

    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 50, "Fee cannot exceed 5%");
        platformFee = _newFee;
    }

    function withdrawPlatformFees() external onlyOwner nonReentrant {
        uint256 amount = totalPlatformFees;
        totalPlatformFees = 0;
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Transfer failed");
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw(uint256 _amount) external onlyOwner nonReentrant {
        (bool success, ) = payable(owner()).call{value: _amount}("");
        require(success, "Transfer failed");
    }

    receive() external payable {}
}
