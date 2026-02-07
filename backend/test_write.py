import os
import json
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

load_dotenv()

RPC_URL = os.getenv("RPC_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
CHAIN_ID = int(os.getenv("CHAIN_ID"))

assert RPC_URL
assert PRIVATE_KEY
assert CONTRACT_ADDRESS

w3 = Web3(Web3.HTTPProvider(RPC_URL))
assert w3.is_connected(), "Not connected to RPC"

acct = Account.from_key(PRIVATE_KEY)

print("Writer:", acct.address)
print("Contract:", CONTRACT_ADDRESS)

with open("backend/abi/ScamRegistry.json") as f:
    abi = json.load(f)

contract = w3.eth.contract(
    address=Web3.to_checksum_address(CONTRACT_ADDRESS),
    abi=abi
)

# --- Test payload ---
phone = "+15551234567"
caller_hash = w3.keccak(text=phone)
risk_level = 2

print("Phone:", phone)
print("Hash:", caller_hash.hex())


gas_estimate = contract.functions.submitReport(
    caller_hash,
    risk_level
).estimate_gas({"from": acct.address})

# --- Build tx ---
tx = contract.functions.submitReport(
    caller_hash,
    risk_level
).build_transaction({
    "from": acct.address,
    "nonce": w3.eth.get_transaction_count(acct.address),
    "chainId": CHAIN_ID,
    "gas": int(gas_estimate * 1.2),
    "gasPrice": w3.to_wei("1", "gwei"),
})


signed = acct.sign_transaction(tx)
tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)

print("Sent tx:", tx_hash.hex())


receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
print("Mined in block:", receipt.blockNumber)
