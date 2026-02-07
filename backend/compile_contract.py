# backend/compile_contract.py
import json
import os
from solcx import compile_standard, set_solc_version

BASE_DIR = os.path.dirname(__file__)

CONTRACT_PATH = os.path.join(BASE_DIR, "contracts", "ScamRegistry.sol")
ABI_DIR = os.path.join(BASE_DIR, "abi")
BYTECODE_DIR = os.path.join(BASE_DIR, "bytecode")

os.makedirs(ABI_DIR, exist_ok=True)
os.makedirs(BYTECODE_DIR, exist_ok=True)

set_solc_version("0.8.20")

with open(CONTRACT_PATH, "r") as f:
    source = f.read()

compiled = compile_standard(
    {
        "language": "Solidity",
        "sources": {
            "ScamRegistry.sol": {"content": source}
        },
        "settings": {
            "outputSelection": {
                "*": {
                    "*": ["abi", "evm.bytecode"]
                }
            }
        },
    }
)

contract = compiled["contracts"]["ScamRegistry.sol"]["ScamRegistry"]

abi = contract["abi"]
bytecode = contract["evm"]["bytecode"]["object"]

abi_path = os.path.join(ABI_DIR, "ScamRegistry.json")
bytecode_path = os.path.join(BYTECODE_DIR, "ScamRegistry.bin")

with open(abi_path, "w") as f:
    json.dump(abi, f, indent=2)

with open(bytecode_path, "w") as f:
    f.write(bytecode)

print("Compiled successfully")
print("ABI →", abi_path)
print("Bytecode →", bytecode_path)
