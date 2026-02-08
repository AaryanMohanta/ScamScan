import json
import os
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv

load_dotenv()

RPC_URL = os.getenv("RPC_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
CHAIN_ID = int(os.getenv("CHAIN_ID"))

assert RPC_URL, "Missing RPC_URL"
assert PRIVATE_KEY, "Missing PRIVATE_KEY"

w3 = Web3(Web3.HTTPProvider(RPC_URL))
assert w3.is_connected(), "Web3 not connected"

acct = Account.from_key(PRIVATE_KEY)

print("Deploying from:", acct.address)

with open("backend/abi/ScamRegistry.json", "r") as f:
    abi = json.load(f)

with open("backend/bytecode/ScamRegistry.bin", "r") as f:
    bytecode = f.read()

ScamRegistry = w3.eth.contract(
    abi=abi,
    bytecode=bytecode
)

tx = ScamRegistry.constructor(
    acct.address
).build_transaction({
    "from": acct.address,
    "nonce": w3.eth.get_transaction_count(acct.address),
    "chainId": CHAIN_ID,
    "gas": 1_000_000,
    "gasPrice": w3.to_wei("20", "gwei"),
})

signed_tx = acct.sign_transaction(tx)
tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

print("Deploying... tx hash:", tx_hash.hex())

receipt = w3.eth.wait_for_transaction_receipt(
    tx_hash,
    timeout=300
)

print("Contract deployed!")
print("Contract address:", receipt.contractAddress)
