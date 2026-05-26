# Benchmark Data Notes

The benchmark page reads one JSON file per operation category from this folder. Values are rendered in milliseconds.

## Active Experiment Computer

- Machine: CCRL dual Xeon 6240R workstation
- CPU: 2 x Intel Xeon Gold 6240R @ 2.40GHz
- Cores / threads: 48 cores / 96 threads
- Memory: 251 GiB RAM
- GPU: NVIDIA RTX A5000
- OS: Ubuntu 24.04, Linux 6.17
- ISA: AVX2 / AVX-512

## Data Correction Log

- 2026-05-26: Corrected one isolated `ADD_VER2` sample at input `65` from `316.796` ms to `81.076` ms. The value was a single-point logging typo; adjacent samples are `64: 81.394` ms and `66: 80.758` ms.
