import os
import re
import json
from pathlib import Path
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

load_dotenv()

RPC_URL = os.getenv("RPC_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
CHAIN_ID = int(os.getenv("CHAIN_ID", "0"))

_RISK_INT = {"Low": 0, "Medium": 1, "High": 2}

# Load ABI relative to this file so it works regardless of cwd
_ABI_PATH = Path(__file__).resolve().parent.parent / "abi" / "ScamRegistry.json"

try:
    with open(_ABI_PATH, "r") as f:
        ABI = json.load(f)
except FileNotFoundError:
    ABI = []

# Lazy-init Web3 so missing env vars don't crash on import (e.g. during tests)
_w3 = None
_contract = None
_account = None


def _get_web3():
    global _w3, _contract, _account
    if _w3 is not None:
        return _w3, _contract, _account

    if not RPC_URL or not PRIVATE_KEY or not CONTRACT_ADDRESS or not CHAIN_ID:
        raise RuntimeError("Missing required blockchain environment variables")

    _w3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not _w3.is_connected():
        raise RuntimeError("Could not connect to blockchain RPC")

    _account = Account.from_key(PRIVATE_KEY)
    _contract = _w3.eth.contract(
        address=Web3.to_checksum_address(CONTRACT_ADDRESS),
        abi=ABI,
    )
    return _w3, _contract, _account


def normalize_phone(phone_number: str) -> str:
    """Normalize to E.164 format (best-effort, no external library)."""
    digits = re.sub(r'\D', '', phone_number)
    if len(digits) == 10:
        return f'+1{digits}'
    if len(digits) >= 11:
        return f'+{digits}'
    return phone_number if phone_number.startswith('+') else f'+{phone_number}'


def hash_phone(phone_number: str) -> bytes:
    w3, _, _ = _get_web3()
    normalized = normalize_phone(phone_number)
    return w3.keccak(text=normalized)


def get_caller_stats(phone_number: str) -> dict:
    try:
        _, contract, _ = _get_web3()
        caller_hash = hash_phone(phone_number)
        total, high, medium = contract.functions.getReport(caller_hash).call()
        return {"total_reports": total, "high_risk_reports": high, "medium_risk_reports": medium}
    except Exception:
        return {"total_reports": 0, "high_risk_reports": 0, "medium_risk_reports": 0}


def submit_caller_report(phone_number: str, risk_level) -> str:
    """risk_level can be int (0/1/2) or string ('Low'/'Medium'/'High')."""
    w3, contract, account = _get_web3()

    if isinstance(risk_level, str):
        risk_int = _RISK_INT.get(risk_level, 0)
    else:
        risk_int = int(risk_level)

    if risk_int not in (0, 1, 2):
        raise ValueError("risk_level must be 0/1/2 or Low/Medium/High")

    caller_hash = hash_phone(phone_number)

    gas_estimate = contract.functions.submitReport(caller_hash, risk_int).estimate_gas(
        {"from": account.address}
    )
    tx = contract.functions.submitReport(caller_hash, risk_int).build_transaction({
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address),
        "chainId": CHAIN_ID,
        "gas": int(gas_estimate * 1.2),
        "gasPrice": w3.to_wei("1", "gwei"),
    })
    signed_tx = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    return w3.to_hex(tx_hash)
