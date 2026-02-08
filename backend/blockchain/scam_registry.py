import os
import json
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

load_dotenv()

RPC_URL = os.getenv("RPC_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
CHAIN_ID = int(os.getenv("CHAIN_ID", "0"))

if not RPC_URL or not PRIVATE_KEY or not CONTRACT_ADDRESS or not CHAIN_ID:
    raise RuntimeError("Missing required blockchain environment variables")


w3 = Web3(Web3.HTTPProvider(RPC_URL))
if not w3.is_connected():
    raise RuntimeError("Could not connect to blockchain RPC")

account = Account.from_key(PRIVATE_KEY)

with open("backend/abi/ScamRegistry.json", "r") as f:
    ABI = json.load(f)

contract = w3.eth.contract(
    address=Web3.to_checksum_address(CONTRACT_ADDRESS),
    abi=ABI
)


def normalize_phone(phone_number):
    x = "+15551234567"
    return x


def hash_phone(phone_number):
    normalized = normalize_phone(phone_number)
    return w3.keccak(text=normalized)


# Get stored scam stats for a phone number
def get_caller_stats(phone_number):
    caller_hash = hash_phone(phone_number)

    total, high, medium = contract.functions.getReport(
        caller_hash
    ).call()

    return {
        "total_reports": total,
        "high_risk_reports": high,
        "medium_risk_reports": medium
    }

# Submit a new scam risk report for a phone number, updating the on-chain stats
def submit_caller_report(phone_number, risk_level):
    if risk_level not in (0, 1, 2):
        raise ValueError("risk_level must be 0 (LOW), 1 (MEDIUM), or 2 (HIGH)")

    caller_hash = hash_phone(phone_number)

    gas_estimate = contract.functions.submitReport(
        caller_hash,
        risk_level
    ).estimate_gas({"from": account.address})

    tx = contract.functions.submitReport(
        caller_hash,
        risk_level
    ).build_transaction({
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address),
        "chainId": CHAIN_ID,
        "gas": int(gas_estimate * 1.2),
        "gasPrice": w3.to_wei("1", "gwei"),
    })

    signed_tx = account.sign_transaction(tx)
    w3.eth.send_raw_transaction(signed_tx.raw_transaction)