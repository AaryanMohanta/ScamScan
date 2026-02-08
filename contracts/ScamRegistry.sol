// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ScamRegistry
/// @notice On-chain registry of scam stats per caller hash
/// @dev Stores aggregated stats keyed by keccak256(normalised phone number)
contract ScamRegistry {
    /// @dev Stats stored per caller hash
    struct CallerStats {
        uint256 totalReports;       // total number of reports
        uint256 highRiskReports;    // number of HIGH risk reports
        uint256 mediumRiskReports;  // number of MEDIUM risk reports
        uint256 lastUpdated;        // timestamp of last update / report
    }

    /// @dev Mapping from caller hash (bytes32) to stats
    mapping(bytes32 => CallerStats) private stats;

    /// @dev Address allowed to submit reports (your backend / reporter wallet)
    address public reporter;

    /// @notice Emitted whenever a new report is submitted
    /// @param callerHash Hash of the normalised phone number
    /// @param riskLevel  0 = LOW, 1 = MEDIUM, 2 = HIGH
    /// @param timestamp  Block timestamp of the report
    event ScamReported(
        bytes32 indexed callerHash,
        uint8 riskLevel,
        uint256 timestamp
    );

    /// @param _reporter The address allowed to submit reports
    constructor(address _reporter) {
        require(_reporter != address(0), "Invalid reporter");
        reporter = _reporter;
    }


    /// @notice Submit a new scam risk report for a caller
    /// @dev Called by your backend via the Python/web3 bridge
    /// @param callerHash Hash of normalised phone number (keccak256)
    /// @param riskLevel  0 = LOW, 1 = MEDIUM, 2 = HIGH
    function submitReport(bytes32 callerHash, uint8 riskLevel) external {
        require(msg.sender == reporter, "Not authorized");
        require(riskLevel <= 2, "Invalid risk level"); // 0,1,2 only

        CallerStats storage s = stats[callerHash];

        // Increment total reports
        s.totalReports += 1;

        // Increment counters for MEDIUM / HIGH risk
        if (riskLevel == 2) {
            s.highRiskReports += 1;
        } else if (riskLevel == 1) {
            s.mediumRiskReports += 1;
        }

        // Update timestamp to now
        s.lastUpdated = block.timestamp;

        emit ScamReported(callerHash, riskLevel, block.timestamp);
    }

    /// @notice Get aggregated stats for a caller hash
    /// @param callerHash Hash of normalised phone number (keccak256)
    /// @return totalReports       Total number of reports
    /// @return highRiskReports    Number of HIGH risk reports
    /// @return mediumRiskReports  Number of MEDIUM risk reports
    function getReport(bytes32 callerHash)
        external
        view
        returns (
            uint256 totalReports,
            uint256 highRiskReports,
            uint256 mediumRiskReports
        )
    {
        CallerStats storage s = stats[callerHash];
        return (
            s.totalReports,
            s.highRiskReports,
            s.mediumRiskReports
        );
    }
}