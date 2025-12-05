#!/usr/bin/env python3
"""
Test script for confidence-weighted color recommendation system.

This script demonstrates how the weighted palette algorithm works
with different probability distributions.
"""

import sys
import os

# Add parent directory to path to import our module
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from color_recommendation_engine import ColorRecommendationEngineV2

def print_separator():
    print("\n" + "="*80 + "\n")

def print_palette(palette_data, title="Palette"):
    """Pretty print a palette"""
    print(f"\n{title}:")
    print(f"  PRIMARY COLORS ({len(palette_data['primary'])}):")
    for i, color in enumerate(palette_data['primary'], 1):
        print(f"    {i}. {color['name']:20s} {color['hex']}")
    
    print(f"\n  SECONDARY COLORS ({len(palette_data['secondary'])}):")
    for i, color in enumerate(palette_data['secondary'], 1):
        print(f"    {i}. {color['name']:20s} {color['hex']}")

def test_scenario(engine, scenario_name, probabilities, description):
    """Test a specific probability scenario"""
    print_separator()
    print(f"SCENARIO: {scenario_name}")
    print(f"  {description}")
    print(f"\n  Probabilities:")
    for season, prob in sorted(probabilities.items(), key=lambda x: x[1], reverse=True):
        print(f"    {season:10s}: {prob:6.1%}")
    
    # Get weighted palette
    palette = engine.get_weighted_palette_for_probabilities(probabilities)
    
    # Print result
    print_palette(palette, "WEIGHTED PALETTE RESULT")
    
    # Compare with legacy method (using top season)
    top_season = max(probabilities.items(), key=lambda x: x[1])[0]
    legacy_palette = engine.get_palette_for_season(top_season)
    print_palette(legacy_palette, f"LEGACY PALETTE (Fixed {top_season})")
    
    return palette

def main():
    print("CONFIDENCE-WEIGHTED COLOR RECOMMENDATION SYSTEM TEST")
    print("="*80)
    
    # Initialize engine
    palette_path = "color_palette_v2.json"
    if not os.path.exists(palette_path):
        print(f"❌ Error: {palette_path} not found!")
        print(f"   Current directory: {os.getcwd()}")
        return
    
    engine = ColorRecommendationEngineV2(palette_path)
    
    # Test Scenario 1: High Confidence (Clear Winner)
    test_scenario(
        engine,
        "High Confidence - Clear Summer",
        {
            'Summer': 0.88,
            'Spring': 0.07,
            'Autumn': 0.03,
            'Winter': 0.02
        },
        "User is clearly Summer type with 88% confidence"
    )
    
    # Test Scenario 2: Medium Confidence (Two Strong Seasons)
    test_scenario(
        engine,
        "Medium Confidence - Summer/Spring Mix",
        {
            'Summer': 0.55,
            'Spring': 0.30,
            'Autumn': 0.10,
            'Winter': 0.05
        },
        "Borderline case between Summer and Spring"
    )
    
    # Test Scenario 3: Low Confidence (Very Close Call)
    test_scenario(
        engine,
        "Low Confidence - Summer/Spring Nearly Equal",
        {
            'Summer': 0.42,
            'Spring': 0.38,
            'Autumn': 0.12,
            'Winter': 0.08
        },
        "Very uncertain - Summer and Spring almost tied"
    )
    
    # Test Scenario 4: Different Season, Similar Confidence
    test_scenario(
        engine,
        "High Confidence - Clear Winter",
        {
            'Winter': 0.92,
            'Summer': 0.05,
            'Autumn': 0.02,
            'Spring': 0.01
        },
        "User is clearly Winter type with 92% confidence"
    )
    
    # Test Scenario 5: Testing Threshold (15%)
    test_scenario(
        engine,
        "Threshold Test - Spring Dominant",
        {
            'Spring': 0.65,
            'Summer': 0.18,  # Above threshold
            'Autumn': 0.12,  # Below threshold (should be excluded)
            'Winter': 0.05   # Below threshold (should be excluded)
        },
        "Testing 15% threshold - only Spring and Summer should be included"
    )
    
    print_separator()
    print("TEST COMPLETE!")
    print("\nKEY OBSERVATIONS:")
    print("  1. High confidence -> Palette is almost entirely from primary season")
    print("  2. Low confidence -> Palette blends multiple seasons")
    print("  3. Same season + different confidence -> DIFFERENT palettes")
    print("  4. Seasons below 15% threshold are excluded")
    print("  5. Colors appearing in multiple seasons get boosted weights")
    print_separator()

if __name__ == "__main__":
    main()
