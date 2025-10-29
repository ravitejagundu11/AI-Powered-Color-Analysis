# Deep Armocromia: 4-Season Classification  
**Top-1 & Top-2 Accuracy Comparison**

---

## 4-Season Classification Results
> **Overall Top-1 Accuracy**: **54.06%**  
> **Overall Top-2 Accuracy**: **83.11%**

---

## Per-Class Breakdown (Test Set)

| Season  | Correct / Total | Acc | Notes |
|--------|------------------|-----|-------|
| **Autumn** | 144 / 259 | **55.60%** | Strong, balanced |
| **Spring** | 79 / 203  | **38.92%** | Weakest — warm tones confused |
| **Summer** | 83 / 186  | **44.62%** | Improved but still low |
| **Winter** | 187 / 264 | **70.83%** | **Best** — high contrast helps |

---
**Insight**:  
- **Top-2 is highly reliable** (83.11%) — model rarely misses both correct seasons.  
- **Confusion patterns**:  
  - **Spring ↔ Summer** (warm/cool overlap)  
  - **Autumn ↔ Winter** (deep vs. cool)  
  - **Summer ↔ Autumn** (warm depth confusion)

---

## Summary

| Metric | Value |
|-------|-------|
| **Top-1 Accuracy (4 Seasons)** | **54.06%** |
| **Top-2 Accuracy (4 Seasons)** | **83.11%** |
| **Best Season** | **Winter (70.83%)** |
| **Hardest Season** | **Spring (38.92%)** |

**Top-2 is a robust fallback** — 83.11% of the time, the correct season is **in the top 2 predictions**.

---

**Model**: DenseNet-121 (fine-tuned)  
**Dataset**: Deep Armocromia (masked face crops)  
**Paper Reference**: [Stacchio et al., 2024](https://www.researchgate.net/publication/383463705)