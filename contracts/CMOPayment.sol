// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IUSDC {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract CMOPayment {
    address public owner;
    IUSDC public usdc;

    uint256 public analysisPrice = 5000000;
    uint256 public auditPrice = 15000000;
    uint256 public pricePerAnalysis = 5000000;

    uint256 public FREE_ANALYSIS_LIMIT = 3;
    mapping(address => uint256) public analysisCount;

    uint256 public FREE_AUDIT_LIMIT = 0;
    mapping(address => uint256) public auditCount;

    event AnalysisPaymentReceived(address user, uint256 amount);
    event AuditPaymentReceived(address user, uint256 amount);
    event AnalysisUsed(address user, uint256 count);
    event AuditUsed(address user, uint256 count);

    constructor(address _usdc) {
        owner = msg.sender;
        usdc = IUSDC(_usdc);
    }

    function useAnalysis(address user) external returns (bool) {
        if (analysisCount[user] < FREE_ANALYSIS_LIMIT) {
            analysisCount[user]++;
            emit AnalysisUsed(user, analysisCount[user]);
            return true;
        }
        return false;
    }

    function payForAnalysis(address user) external returns (bool) {
        require(
            usdc.transferFrom(user, owner, analysisPrice),
            "Analysis payment failed"
        );
        emit AnalysisPaymentReceived(user, analysisPrice);
        return true;
    }

    function useAudit(address user) external returns (bool) {
        return false;
    }

    function payForAudit(address user) external returns (bool) {
        require(
            usdc.transferFrom(user, owner, auditPrice),
            "Audit payment failed"
        );
        emit AuditPaymentReceived(user, auditPrice);
        return true;
    }

    function getRemainingFree(address user) external view returns (uint256) {
        if (analysisCount[user] >= FREE_ANALYSIS_LIMIT) return 0;
        return FREE_ANALYSIS_LIMIT - analysisCount[user];
    }

    function getRemainingFreeAnalyses(address user) external view returns (uint256) {
        if (analysisCount[user] >= FREE_ANALYSIS_LIMIT) return 0;
        return FREE_ANALYSIS_LIMIT - analysisCount[user];
    }

    function getRemainingFreeAudits(address user) external view returns (uint256) {
        return 0;
    }

    function setAnalysisPrice(uint256 _price) external {
        require(msg.sender == owner, "Not owner");
        analysisPrice = _price;
        pricePerAnalysis = _price;
    }

    function setAuditPrice(uint256 _price) external {
        require(msg.sender == owner, "Not owner");
        auditPrice = _price;
    }
}