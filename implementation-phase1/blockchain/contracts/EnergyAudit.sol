// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract EnergyAudit {
    struct AuditRecord {
        bytes32 meterIdHash;
        bytes32 eventTypeHash;
        bytes32 payloadHash;
        uint256 recordedAt;
        address submitter;
    }

    mapping(bytes32 => bool) public registeredMeters;
    mapping(bytes32 => AuditRecord) private auditRecords;

    event MeterRegistered(
        bytes32 indexed meterIdHash,
        address indexed registrar,
        uint256 recordedAt
    );

    event AuditEventLogged(
        bytes32 indexed eventId,
        bytes32 indexed meterIdHash,
        bytes32 eventTypeHash,
        bytes32 payloadHash,
        address indexed submitter,
        uint256 recordedAt
    );

    function registerMeter(bytes32 meterIdHash) external {
        require(meterIdHash != bytes32(0), "meter hash required");
        require(!registeredMeters[meterIdHash], "meter already registered");

        registeredMeters[meterIdHash] = true;
        emit MeterRegistered(meterIdHash, msg.sender, block.timestamp);
    }

    function logAuditEvent(
        bytes32 meterIdHash,
        bytes32 eventTypeHash,
        bytes32 payloadHash
    ) external returns (bytes32 eventId) {
        require(registeredMeters[meterIdHash], "meter not registered");
        require(eventTypeHash != bytes32(0), "event type hash required");
        require(payloadHash != bytes32(0), "payload hash required");

        eventId = keccak256(
            abi.encode(meterIdHash, eventTypeHash, payloadHash)
        );
        require(auditRecords[eventId].recordedAt == 0, "event already logged");

        auditRecords[eventId] = AuditRecord({
            meterIdHash: meterIdHash,
            eventTypeHash: eventTypeHash,
            payloadHash: payloadHash,
            recordedAt: block.timestamp,
            submitter: msg.sender
        });

        emit AuditEventLogged(
            eventId,
            meterIdHash,
            eventTypeHash,
            payloadHash,
            msg.sender,
            block.timestamp
        );
    }

    function verifyAuditEvent(
        bytes32 meterIdHash,
        bytes32 eventTypeHash,
        bytes32 payloadHash
    ) external view returns (bool exists, bytes32 eventId) {
        eventId = keccak256(
            abi.encode(meterIdHash, eventTypeHash, payloadHash)
        );
        exists = auditRecords[eventId].recordedAt != 0;
    }

    function getAuditRecord(bytes32 eventId)
        external
        view
        returns (AuditRecord memory)
    {
        require(auditRecords[eventId].recordedAt != 0, "event not found");
        return auditRecords[eventId];
    }
}
