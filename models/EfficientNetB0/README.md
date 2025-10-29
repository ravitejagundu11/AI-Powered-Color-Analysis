# Model: EfficientNetB0

## Performance

| Metric | Value |
|--------|-------|
| **Top-1 Accuracy** | 50.22% |
| **Top-2 Accuracy** | 79.17% |
| **Training Epochs** | 25  |
| **Architecture** | EfficientNetB0 |
| **Input Format** | RGB-M (RGB + Mask) |

### Architecture Comparison

| Aspect | EfficientNetB0 | FaRL64 (Research Paper) |
|--------|------------------------|---------------------------|
| **Top-1 Accuracy** | 50.22% | 55.4% |
| **Top-2 Accuracy** | 79.17% | 80.8% |
| **Architecture Type** | CNN with MBConv | Vision Transformer |
| **Training Epochs** | 25 | 50 |
| **Test Loss** | 0.0753 | ~1.1 (estimated) |


## Per-Class Performance

| Season | Correct Predictions | Total Samples | Accuracy |
|--------|-------------------|---------------|----------|
| **Winter** | 145 | 259 | 55.98% |
| **Autumn** | 88 | 203 | 43.35% |
| **Summer** | 89 | 186 | 47.85% |
| **Spring** | 136 | 264 | 51.52% |

### Misclassification Patterns
- **Winter (55.98%)**: Moderate performance; 114 misclassified samples primarily confused with Spring

-**Summer (47.85%)**: Weak-to-moderate; 97 misclassified samples mostly confused with Autumn

-**Autumn (43.35%)**: Low performance; 115 misclassified samples mainly confused with Summer and Winter

-**Spring (51.52%)**: Moderate; 128 misclassified samples largely confused with Winter


### Key Confusion Paths

| True / Predicted | Winter | Autumn | Summer | Spring |
|-----------------|--------|--------|--------|--------|
| Winter          | 145    | 37     | 23     | 54     |
| Autumn          | 42     | 88     | 58     | 15     |
| Summer          | 20     | 56     | 89     | 21     |
| Spring          | 83     | 16     | 29     | 136    |


## Comparison with Deep Armocromia Research Paper

### Performance Analysis

**Strengths vs. Research Paper:**
- **Matches Top-1 Accuracy**: Our 50.22% is slightly below the paper's 55.4% FaRL64 result
- **Top-2 Accuracy Competitive**: Our 79.17% is slightly below the paper's 80.8%  
- **Efficient Convergence**: Achieved 25 epochs vs. paper's 50 epochs

**Class-by-Class Alignment:**
- **Winter**: 55.98% accuracy; moderate performance, misclassifications mainly with Spring
- **Autumn**: 43.35% accuracy; low performance, misclassified mostly as Summer and Winter
- **Summer**: 47.85% accuracy; weak-to-moderate, confused with Autumn
- **Spring**: 51.52% accuracy; moderate, large confusion with Winter

### Key Insights
### Performance Analysis

**Overfitting Evidence**: High training accuracies (season: 97.09%, subclass: 97.99%) vs. moderate test accuracies (Top-1: 50.22%) indicate the model overfits the training data and undergeneralizes to unseen samples. Test predictions show **diffuse probabilities across multiple classes** (e.g., Summer 29.2%, Spring 24.9%, Winter 24.6%, Autumn 21.3% or Winter 34.3%, Autumn 22.9%, Spring 21.7%, Summer 21.1%), highlighting low confidence in distinguishing the correct season.

**Top-2 Accuracy Advantage**: 79.17% Top-2 accuracy shows some robustness in alternative predictions but is slightly below the research baseline.

**Class Confusion Patterns**: Spring and Winter remain the main bottleneck; ambiguous or overlapping visual features contribute to misclassification. The model struggles to **confidently differentiate between similar classes** (e.g., Winter vs. Autumn or Spring vs. Summer) across multiple test samples.

**Implications**:  
- The model may **underfit the subtle differences** between classes despite high training accuracy.  
- High overlap in prediction probabilities reflects **ambiguity in learned features**, particularly for visually or contextually similar seasons.  
- While not definitive overfitting on a single sample, the trend of high training vs. moderate test accuracy suggests **limited generalization**.

## Future Improvements

1. **Reduce Overfitting**: Apply regularization techniques such as dropout or weight decay  
2. **Data Augmentation**: Target ambiguous classes (Spring, Winter, Summer) to improve generalization  
3. **Feature Enhancement**: Incorporate attention mechanisms or SE blocks to better distinguish subtle seasonal cues  
