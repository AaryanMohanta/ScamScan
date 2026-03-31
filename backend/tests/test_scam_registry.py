"""
Tests for blockchain/scam_registry.py — phone normalization, hash, and mocked Web3.
"""
import os
import pytest
from unittest.mock import patch, MagicMock, PropertyMock

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

os.environ.setdefault("RPC_URL", "http://localhost:8545")
os.environ.setdefault("PRIVATE_KEY", "0x" + "a" * 64)
os.environ.setdefault("CONTRACT_ADDRESS", "0x" + "b" * 40)
os.environ.setdefault("CHAIN_ID", "11155111")
os.environ.setdefault("REPORTER_ADDRESS", "0x" + "c" * 40)


# ---------------------------------------------------------------------------
# Build a full Web3 mock before importing the module
# ---------------------------------------------------------------------------

mock_contract = MagicMock()
mock_contract.functions.getReport.return_value.call.return_value = (5, 3, 1)
mock_contract.functions.submitReport.return_value.estimate_gas.return_value = 50000
mock_contract.functions.submitReport.return_value.build_transaction.return_value = {
    "to": "0x" + "b" * 40, "data": "0x", "gas": 60000,
    "gasPrice": 1000000000, "nonce": 1, "chainId": 11155111,
}

mock_w3 = MagicMock()
mock_w3.is_connected.return_value = True
mock_w3.eth.contract.return_value = mock_contract
mock_w3.eth.get_transaction_count.return_value = 1
mock_w3.eth.send_raw_transaction.return_value = b"\xab" * 32
mock_w3.to_hex.return_value = "0x" + "ab" * 32
mock_w3.to_wei.return_value = 1000000000
# keccak returns different bytes per call so hash tests work
mock_w3.keccak.side_effect = lambda text="": bytes([hash(text) % 256] * 32)

mock_signed_tx = MagicMock()
mock_signed_tx.raw_transaction = b"\xcd" * 32

mock_account = MagicMock()
mock_account.address = "0x" + "c" * 40
mock_account.sign_transaction.return_value = mock_signed_tx

with patch("web3.Web3", return_value=mock_w3):
    with patch("web3.Web3.HTTPProvider", return_value=MagicMock()):
        with patch("eth_account.Account.from_key", return_value=mock_account):
            from blockchain.scam_registry import normalize_phone, hash_phone, get_caller_stats, submit_caller_report


# ---------------------------------------------------------------------------
# normalize_phone()
# ---------------------------------------------------------------------------

class TestNormalizePhone:
    def test_ten_digit_gets_plus1(self):
        assert normalize_phone("5551234567") == "+15551234567"

    def test_eleven_digit_with_1(self):
        assert normalize_phone("15551234567") == "+15551234567"

    def test_already_e164(self):
        assert normalize_phone("+15551234567") == "+15551234567"

    def test_formatted_with_dashes(self):
        assert normalize_phone("555-123-4567") == "+15551234567"

    def test_formatted_with_parens(self):
        assert normalize_phone("(555) 123-4567") == "+15551234567"

    def test_international_uk(self):
        result = normalize_phone("+441234567890")
        assert result.startswith("+")
        assert "1234567890" in result

    def test_strips_spaces(self):
        assert normalize_phone("555 123 4567") == "+15551234567"


# ---------------------------------------------------------------------------
# hash_phone()
# ---------------------------------------------------------------------------

class TestHashPhone:
    def test_returns_bytes32(self):
        h = hash_phone("+15551234567")
        assert isinstance(h, bytes)
        assert len(h) == 32

    def test_same_number_same_hash(self):
        h1 = hash_phone("+15551234567")
        h2 = hash_phone("+15551234567")
        assert h1 == h2

    def test_different_numbers_different_hash(self):
        h1 = hash_phone("+15551234567")
        h2 = hash_phone("+15559999999")
        assert h1 != h2

    def test_equivalent_formats_same_hash(self):
        """Normalized forms should produce the same hash."""
        h1 = hash_phone("5551234567")
        h2 = hash_phone("+15551234567")
        assert h1 == h2


# ---------------------------------------------------------------------------
# get_caller_stats()
# ---------------------------------------------------------------------------

class TestGetCallerStats:
    def test_returns_expected_structure(self):
        stats = get_caller_stats("+15551234567")
        assert "total_reports" in stats
        assert "high_risk_reports" in stats
        assert "medium_risk_reports" in stats

    def test_contract_values_mapped_correctly(self):
        # Mock returns (5, 3, 1) — total, high, medium
        mock_contract.functions.getReport.return_value.call.return_value = (5, 3, 1)
        stats = get_caller_stats("+15551234567")
        assert stats["total_reports"] == 5
        assert stats["high_risk_reports"] == 3
        assert stats["medium_risk_reports"] == 1

    def test_handles_web3_error_gracefully(self):
        mock_contract.functions.getReport.return_value.call.side_effect = Exception("RPC error")
        stats = get_caller_stats("+15551234567")
        # Should return safe defaults, not crash
        assert stats["total_reports"] == 0
        mock_contract.functions.getReport.return_value.call.side_effect = None
        mock_contract.functions.getReport.return_value.call.return_value = (5, 3, 1)


# ---------------------------------------------------------------------------
# submit_caller_report()
# ---------------------------------------------------------------------------

class TestSubmitCallerReport:
    def _patched_get_web3(self):
        """Return mocked (w3, contract, account) with a fully mocked account."""
        return mock_w3, mock_contract, mock_account

    def test_returns_tx_hash_string(self):
        with patch("blockchain.scam_registry._get_web3", self._patched_get_web3):
            tx = submit_caller_report("+15551234567", "High")
        assert isinstance(tx, str)
        assert tx.startswith("0x")

    def test_accepts_all_risk_levels(self):
        with patch("blockchain.scam_registry._get_web3", self._patched_get_web3):
            for level in ("Low", "Medium", "High"):
                tx = submit_caller_report("+15551234567", level)
                assert isinstance(tx, str)
