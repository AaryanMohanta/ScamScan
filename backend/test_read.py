# backend/test_read.py
import json, os
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

w3 = Web3(Web3.HTTPProvider(os.getenv("RPC_URL")))

with open("backend/abi/ScamRegistry.json") as f:
    abi = json.load(f)

contract = w3.eth.contract(
    address=Web3.to_checksum_address(os.getenv("CONTRACT_ADDRESS")),
    abi=abi
)

caller_hash = w3.keccak(text="+15551234567")

print(contract.functions.getReport(caller_hash).call())
