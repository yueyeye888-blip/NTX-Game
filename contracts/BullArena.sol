// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// 注意：实际部署时需要集成 Chainlink VRF，这里先定义接口
// import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

/**
 * @title BullArena (疯牛竞技场)
 * @notice 1分钟一轮的博弈游戏
 */
contract BullArena is ReentrancyGuard, Ownable {
    
    // --- 游戏配置 ---
    IERC20 public ntxToken;           // 参与代币
    uint256 public constant ROUND_DURATION = 60; // 1分钟 (60秒)
    uint256 public constant BARN_COUNT = 8;      // 8个牛栏
    uint256 public constant FEE_PERCENT = 50;    // 0.5% (基数 10000)
    address public treasury;          // 接收 0.5% 奖励的地址

    // --- 游戏状态 ---
    enum GameState { BETTING, CALCULATING, CLAIMING }
    
    struct Round {
        uint256 id;
        uint256 startTime;
        uint256 endTime;
        uint256 totalPool;           // 本轮总奖池
        uint256[8] barnPools;        // 每个牛栏的总资金
        uint8 hitBarnId;             // 被疯牛撞击的牛栏 (0-7)
        bool resolved;               // 是否已结算
        uint256 rewardPerShare;      // 幸存者每单位资金分得的奖励 (精度 1e18)
    }

    struct PlayerInfo {
        uint256 deposited;           // 投入金额
        uint8 barnId;                // 选择的牛栏
        bool claimed;                // 是否已领取奖励
    }

    uint256 public currentRoundId;
    mapping(uint256 => Round) public rounds;
    // roundId => userAddress => PlayerInfo
    mapping(uint256 => mapping(address => PlayerInfo)) public playerBets;

    // --- 事件 ---
    event RoundStarted(uint256 indexed roundId, uint256 endTime);
    event Deposit(uint256 indexed roundId, address indexed player, uint8 barnId, uint256 amount);
    event RoundEnded(uint256 indexed roundId, uint8 hitBarnId, uint256 destroyedAmount, uint256 survivorReward);
    event RewardClaimed(uint256 indexed roundId, address indexed player, uint256 amount);

    constructor(address _token, address _treasury) {
        ntxToken = IERC20(_token);
        treasury = _treasury;
        startNewRound();
    }

    // --- 核心逻辑 ---

    /**
     * @dev 开启新一轮
     */
    function startNewRound() internal {
        currentRoundId++;
        rounds[currentRoundId].id = currentRoundId;
        rounds[currentRoundId].startTime = block.timestamp;
        rounds[currentRoundId].endTime = block.timestamp + ROUND_DURATION;
        
        emit RoundStarted(currentRoundId, rounds[currentRoundId].endTime);
    }

    /**
     * @dev 玩家下注
     * @param barnId 选择的牛栏 (0-7)
     * @param amount 投入金额
     */
    function deposit(uint8 barnId, uint256 amount) external nonReentrant {
        require(barnId < BARN_COUNT, "Invalid barn ID");
        require(amount > 0, "Amount must be > 0");
        
        Round storage round = rounds[currentRoundId];
        require(block.timestamp < round.endTime, "Round is closed");

        // 记录玩家下注
        PlayerInfo storage player = playerBets[currentRoundId][msg.sender];
        require(player.deposited == 0, "Already bet in this round"); // 简单起见，每轮限投一次

        // 转移代币
        ntxToken.transferFrom(msg.sender, address(this), amount);

        // 更新状态
        player.deposited = amount;
        player.barnId = barnId;
        player.claimed = false;

        round.totalPool += amount;
        round.barnPools[barnId] += amount;

        emit Deposit(currentRoundId, msg.sender, barnId, amount);
    }

    /**
     * @dev 结算轮次 (在生产环境中，这应该由 Chainlink Keepers 自动调用)
     * 这里为了演示，使用简单的伪随机数 (生产环境必须换成 Chainlink VRF!)
     */
    function resolveRound() external nonReentrant {
        Round storage round = rounds[currentRoundId];
        require(block.timestamp >= round.endTime, "Round not finished");
        require(!round.resolved, "Already resolved");

        // --- ⚠️ 警告: 伪随机数，仅用于演示逻辑 ⚠️ ---
        // 真实项目请使用 Chainlink VRF
        uint256 randomness = uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty, round.totalPool)));
        uint8 hitBarnId = uint8(randomness % BARN_COUNT);
        // -------------------------------------------

        round.hitBarnId = hitBarnId;
        round.resolved = true;

        uint256 destroyedAmount = round.barnPools[hitBarnId];
        uint256 survivorPool = round.totalPool - destroyedAmount;

        if (destroyedAmount > 0 && survivorPool > 0) {
            // 计算分配
            uint256 fee = (destroyedAmount * FEE_PERCENT) / 10000; // 0.5%
            uint256 rewardToSurvivors = destroyedAmount - fee;

            // 发送手续费给项目方
            ntxToken.transfer(treasury, fee);

            // 计算每单位幸存资金分得的奖励 (精度 1e18)
            // 幸存者不仅拿回本金，还瓜分 rewardToSurvivors
            round.rewardPerShare = (rewardToSurvivors * 1e18) / survivorPool;
        }

        emit RoundEnded(currentRoundId, hitBarnId, destroyedAmount, round.rewardPerShare);

        // 开启下一轮
        startNewRound();
    }

    /**
     * @dev 玩家领取奖励
     * @param roundId 轮次ID
     */
    function claim(uint256 roundId) external nonReentrant {
        require(roundId < currentRoundId, "Round not finished");
        Round storage round = rounds[roundId];
        require(round.resolved, "Round not resolved");

        PlayerInfo storage player = playerBets[roundId][msg.sender];
        require(player.deposited > 0, "No deposit");
        require(!player.claimed, "Already claimed");

        uint256 payout = 0;

        if (player.barnId == round.hitBarnId) {
            // 😭 被撞了，血本无归
            payout = 0; 
        } else {
            // 🎉 幸存！
            // 1. 拿回本金
            payout = player.deposited;
            // 2. 瓜分奖励
            if (round.rewardPerShare > 0) {
                uint256 reward = (player.deposited * round.rewardPerShare) / 1e18;
                payout += reward;
            }
        }

        player.claimed = true;
        
        if (payout > 0) {
            ntxToken.transfer(msg.sender, payout);
        }

        emit RewardClaimed(roundId, msg.sender, payout);
    }
    
    // 获取当前轮次信息
    function getCurrentRoundInfo() external view returns (
        uint256 id, 
        uint256 endTime, 
        uint256 totalPool, 
        uint256[8] memory barnPools
    ) {
        Round storage round = rounds[currentRoundId];
        return (round.id, round.endTime, round.totalPool, round.barnPools);
    }
}
