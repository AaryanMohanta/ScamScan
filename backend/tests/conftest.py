"""
Shared pytest configuration and fixtures.
"""
import os
import struct

import pytest

# Ensure env vars are set before any module imports
os.environ.setdefault("GEMINI_API_KEY", "test-gemini-key")
os.environ.setdefault("RPC_URL", "http://localhost:8545")
os.environ.setdefault("PRIVATE_KEY", "0x" + "a" * 64)
os.environ.setdefault("CONTRACT_ADDRESS", "0x" + "b" * 40)
os.environ.setdefault("CHAIN_ID", "11155111")
os.environ.setdefault("REPORTER_ADDRESS", "0x" + "c" * 40)


@pytest.fixture
def minimal_wav(tmp_path):
    """Write a minimal but valid WAV file and return its path."""
    path = tmp_path / "test.wav"
    path.write_bytes(_make_wav())
    return path


@pytest.fixture
def wav_bytes():
    """Return raw bytes of a minimal valid WAV file."""
    return _make_wav()


def _make_wav(num_samples: int = 0, sample_rate: int = 16000) -> bytes:
    num_channels = 1
    bits_per_sample = 16
    byte_rate = sample_rate * num_channels * bits_per_sample // 8
    block_align = num_channels * bits_per_sample // 8
    data_size = num_samples * block_align
    return struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF", 36 + data_size, b"WAVE",
        b"fmt ", 16, 1, num_channels,
        sample_rate, byte_rate, block_align, bits_per_sample,
        b"data", data_size,
    )
