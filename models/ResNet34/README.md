# Model: ResNet-34

## Performance

| Metric | ResNet-34 |
|--------|------------------------|
| **Top-1 Accuracy** | 53.7% |
| **Top-2 Accuracy** | 81.4% |
| **Training Epochs** | 18 (Early Stopping) |
| **Architecture** | ResNet-34 |
| **Input** | RGB-M (RGB + Mask) |

## Comparison with Deep Armocromia Research Paper

### Model Architecture Comparison

| Aspect | Our Model | Research Paper |
|--------|-----------|-----------------|
| **Primary Backbone** | ResNet-34 | FaRL64 (Vision Transformer) |
| **Best Season Accuracy** | 53.7% | 55.4% (FaRL64) |
| **Best Top-2 Accuracy** | 81.4% | 80.8% (FaRL64) |
| **Training Epochs** | 18 | 50 |
| **Optimizer** | AdamW (lr=1e-3) | AdamW (lr=1e-3) |
| **Batch Size** | 32 | 64 |

### Key Findings

**Our Model Strengths:**
- **Comparable Top-1 Performance**: Our 53.7% accuracy is only 1.7 percentage points below the research paper's best result (55.4% with FaRL64)
- **Superior Top-2 Accuracy**: Our model achieves 81.4% vs. the paper's 80.8%, indicating better ranking of alternative predictions
- **Efficient Training**: Converged at 18 epochs vs. paper's 50 epochs, suggesting effective early stopping and no overfitting

**Class-Specific Comparison:**

From the paper's confusion matrix (FaRL64 - best model):
- Winter: Strong performer (193 correct) - **Our model: 68.2% accuracy**
- Autumn: Moderate performer - **Our model: 56.0% accuracy**
- Summer: Weak performer (frequent Spring confusion) - **Our model: 49.5% accuracy**
- Spring: Weakest performer - **Our model: 36.0% accuracy**

Our model's per-class distribution aligns with the paper's findings, with Winter performing best and Spring struggling most.

### Critical Insights

**Spring Classification Challenge:**
Both models struggle with Spring classification. The research paper attributes this to overlapping features between Spring-Summer and Spring-Light confusions, exactly matching our 59 Spring-Summer misclassifications.

**RGB-M Preprocessing Impact:**
Our use of RGB-M (masked faces) aligns with the paper's methodology. Both extract face segmentation masks to isolate pixels for color analysis, explaining our competitive accuracy despite using a simpler architecture (ResNet vs. Vision Transformer).

## Future Improvements

1. **Extend Training**: Try 30-40 epochs instead of 18 to match the paper's convergence pattern
2. **Spring Data Augmentation**: Both models identify Spring as the bottleneck—targeted augmentation could help
3. **Class Weighting**: Apply higher weights to underperforming classes (Spring, Summer) during training
