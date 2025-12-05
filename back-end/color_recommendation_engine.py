# color_recommendation_engine.py
"""
Color Recommendation Engine V2
Loads color palettes from color_palette_v2.json and provides personalized recommendations
"""

import json
import numpy as np
from typing import Dict, List, Optional, Any


class ColorRecommendationEngineV2:
    """
    Personalized color recommendations using color_palette_v2.json
    """
    
    def __init__(self, json_path: str):
        """
        Initialize the engine with color palette JSON
        
        Args:
            json_path: Path to color_palette_v2.json file
        """
        with open(json_path, 'r') as f:
            self.data = json.load(f)
        
        # Season mapping (API uses capitalized names)
        self.seasons = ['Autumn', 'Summer', 'Winter', 'Spring']
        self.season_map = {
            'Autumn': 'autumn',
            'Summer': 'summer',
            'Winter': 'winter',
            'Spring': 'spring'
        }
        
        print(f"✅ Color Recommendation Engine initialized with {len(self.data)} seasons")
    
    def get_season_data(self, season_name: str) -> Dict[str, Any]:
        """
        Get complete season data from JSON
        
        Args:
            season_name: Season name (e.g., 'Spring', 'Summer')
            
        Returns:
            Dictionary with season data
        """
        season_key = self.season_map.get(season_name)
        if not season_key:
            raise ValueError(f"Unknown season: {season_name}")
        
        return self.data.get(season_key, {})
    
    def get_palette_for_season(self, season_name: str) -> Dict[str, Any]:
        """
        [LEGACY METHOD - Kept for backward compatibility]
        Get color palette formatted for API response
        
        NOTE: This method returns fixed palettes for each season.
        For personalized recommendations based on confidence, use:
        get_weighted_palette_for_probabilities() instead.
        
        Args:
            season_name: Season name (e.g., 'Spring', 'Summer')
            
        Returns:
            Dictionary with primary and secondary colors
        """
        season_data = self.get_season_data(season_name)
        
        primary_colors = season_data.get('primary_colors', [])
        neutral_colors = season_data.get('neutral_colors', [])
        
        # Format primary colors (top 6)
        primary = [
            {
                "name": color['name'],
                "hex": color['hex']
            }
            for color in primary_colors[:6]
        ]
        
        # Format secondary colors (next 6 from primary + neutrals)
        secondary_from_primary = primary_colors[6:9] if len(primary_colors) > 6 else []
        secondary = [
            {
                "name": color['name'],
                "hex": color['hex']
            }
            for color in secondary_from_primary
        ]
        
        # Add neutrals to secondary
        for neutral in neutral_colors[:3]:
            secondary.append({
                "name": neutral['name'],
                "hex": neutral['hex']
            })
        
        return {
            "primary": primary,
            "secondary": secondary
        }
    
    def get_weighted_palette_for_probabilities(
        self,
        all_probabilities: Dict[str, float],
        primary_count: int = 6,
        secondary_count: int = 6,
        min_probability_threshold: float = 0.05,
        secondary_boost_factor: float = 1.5
    ) -> Dict[str, Any]:
        """
        Get personalized color palette based on probability distribution.
        
        Uses full probability distribution to create personalized palettes:
        - Primary season (highest probability)
        - Secondary influences (other seasons with significant probability)
        - Confidence level (affects color blending)
        
        Colors appearing in multiple high-probability seasons get boosted weights.
        
        Args:
            all_probabilities: Season probabilities, e.g. {'Spring': 0.65, 'Summer': 0.25, ...}
            primary_count: Number of colors for primary palette (default: 6)
            secondary_count: Number of colors for secondary palette (default: 6)
            min_probability_threshold: Minimum probability to include season (default: 0.05)
            secondary_boost_factor: Boost multiplier for secondary season colors (default: 1.5)
                                   Higher values create more variation between similar classifications
        
        Returns:
            Dictionary with primary and secondary color lists
        """
        print(f"\nWeighted Palette Generation")
        print(f"  Probabilities: {all_probabilities}")
        print(f"  Min threshold: {min_probability_threshold * 100}%")
        
        # Identify primary and secondary seasons
        sorted_probs = sorted(all_probabilities.items(), key=lambda x: x[1], reverse=True)
        primary_season = sorted_probs[0][0] if sorted_probs else None
        secondary_season = sorted_probs[1][0] if len(sorted_probs) > 1 else None
        
        # Step 1: Collect colors from seasons above threshold
        weighted_colors = []
        seasons_included = []
        
        for season_name, probability in all_probabilities.items():
            if probability < min_probability_threshold:
                print(f"  Skipping {season_name} ({probability:.1%}) - below threshold")
                continue
            
            seasons_included.append(season_name)
            print(f"  Including {season_name} ({probability:.1%})")
            
            season_data = self.get_season_data(season_name)
            primary_colors = season_data.get('primary_colors', [])
            
            for color in primary_colors:
                multiplier = color.get('confidence_multiplier', 1.0)
                
                # Boost secondary season colors to create more variation
                if season_name == secondary_season and probability > 0.20:
                    # Apply boost factor to secondary season when it has significant probability
                    weight = probability * multiplier * secondary_boost_factor
                    print(f"  Boosting {season_name} color '{color['name']}' (secondary season, {secondary_boost_factor}x)")
                else:
                    weight = probability * multiplier
                
                weighted_colors.append({
                    'name': color['name'],
                    'hex': color['hex'],
                    'rgb': color.get('rgb', []),
                    'weight': weight,
                    'primary_season': season_name,
                    'use_for': color.get('use_for', []),
                    'confidence_multiplier': multiplier
                })
        
        print(f"  Total colors collected: {len(weighted_colors)}")
        
        # Step 2: Aggregate duplicate colors (sum weights for same hex)
        color_map = {}
        for item in weighted_colors:
            hex_code = item['hex']
            if hex_code in color_map:
                old_weight = color_map[hex_code]['weight']
                color_map[hex_code]['weight'] += item['weight']
                
                if 'seasons' not in color_map[hex_code]:
                    color_map[hex_code]['seasons'] = [color_map[hex_code]['primary_season']]
                color_map[hex_code]['seasons'].append(item['primary_season'])
                
                print(f"  Boosted '{item['name']}' ({hex_code}): {old_weight:.3f} -> {color_map[hex_code]['weight']:.3f}")
            else:
                color_map[hex_code] = item
                color_map[hex_code]['seasons'] = [item['primary_season']]
        
        print(f"  Unique colors after aggregation: {len(color_map)}")
        
        # Step 3: Sort by weight (descending)
        sorted_colors = sorted(
            color_map.values(),
            key=lambda x: x['weight'],
            reverse=True
        )
        
        # Step 4: Format output
        primary = [
            {'name': c['name'], 'hex': c['hex']}
            for c in sorted_colors[:primary_count]
        ]
        
        secondary = [
            {'name': c['name'], 'hex': c['hex']}
            for c in sorted_colors[primary_count:primary_count + secondary_count]
        ]
        
        print(f"\n  Result:")
        print(f"    Primary palette: {len(primary)} colors")
        print(f"    Secondary palette: {len(secondary)} colors")
        print(f"    Seasons included: {', '.join(seasons_included)}")
        
        return {
            "primary": primary,
            "secondary": secondary
        }
    
    def get_recommendations(
        self, 
        predictions: np.ndarray, 
        use_case: Optional[str] = None, 
        top_n: int = 20
    ) -> Dict[str, Any]:
        """
        Get personalized color recommendations based on ML predictions
        
        Args:
            predictions: Array of probabilities [autumn_prob, summer_prob, winter_prob, spring_prob]
            use_case: Filter by use case (e.g., 'tops', 'dresses', 'accessories', 'all')
            top_n: Number of colors to return
            
        Returns:
            Dictionary with seasonal analysis and recommended colors
        """
        # Normalize predictions
        predictions = predictions / predictions.sum()
        
        # Get seasonal scores
        scores = {
            season: float(pred * 100) 
            for season, pred in zip(self.seasons, predictions)
        }
        
        # Sort to get primary and secondary
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        primary_season, primary_score = sorted_scores[0]
        secondary_season, secondary_score = sorted_scores[1]
        
        print(f"\n📊 SEASONAL ANALYSIS:")
        print(f"   Primary: {primary_season} ({primary_score:.1f}%)")
        print(f"   Secondary: {secondary_season} ({secondary_score:.1f}%)")
        
        # Collect all colors with fit scores
        all_colors = []
        
        for season_name in self.seasons:
            season_key = self.season_map[season_name]
            season_data = self.data.get(season_key, {})
            
            primary_colors = season_data.get('primary_colors', [])
            
            for color in primary_colors:
                # Calculate fit score
                if season_name == primary_season:
                    base_score = primary_score
                elif season_name == secondary_season:
                    base_score = secondary_score * 0.7
                else:
                    base_score = min(primary_score, secondary_score) * 0.2
                
                # Apply confidence multiplier
                multiplier = color.get('confidence_multiplier', 1.0)
                fit_score = base_score * multiplier
                
                # Filter by use case
                if use_case and use_case != 'all':
                    use_for_list = color.get('use_for', [])
                    if use_case not in use_for_list and 'all' not in use_for_list:
                        continue
                
                all_colors.append({
                    'name': color['name'],
                    'hex': color['hex'],
                    'rgb': color.get('rgb', []),
                    'season': season_name,
                    'fit_score': min(fit_score, 100.0),
                    'use_for': color.get('use_for', []),
                    'confidence_multiplier': multiplier
                })
        
        # Sort by fit score
        all_colors.sort(key=lambda x: x['fit_score'], reverse=True)
        
        # Get top N
        top_colors = all_colors[:top_n]
        
        print(f"\n🎨 COLOR RECOMMENDATIONS:")
        print(f"   Total colors analyzed: {len(all_colors)}")
        print(f"   Returning top {len(top_colors)} colors")
        
        return {
            'seasonal_analysis': {
                'primary_season': primary_season,
                'primary_score': round(primary_score, 2),
                'secondary_season': secondary_season,
                'secondary_score': round(secondary_score, 2),
                'all_scores': scores
            },
            'recommended_colors': top_colors
        }
    
    def get_season_description(self, season_name: str) -> Dict[str, Any]:
        """
        Get detailed season description
        
        Args:
            season_name: Season name (e.g., 'Spring', 'Summer')
            
        Returns:
            Dictionary with season description, characteristics, and recommendations
        """
        season_data = self.get_season_data(season_name)
        
        return {
            'name': season_data.get('display_name', season_name),
            'code': season_data.get('season_code', ''),
            'description': season_data.get('description', ''),
            'characteristics': season_data.get('characteristics', {}),
            'hair_colors': season_data.get('hair_colors', []),
            'makeup_recommendations': season_data.get('makeup_recommendations', {}),
            'avoid_colors': [
                {'name': color['name'], 'hex': color['hex']} 
                for color in season_data.get('avoid_colors', [])
            ]
        }
    
    def get_all_seasons_info(self) -> Dict[str, Any]:
        """Get information about all available seasons"""
        return {
            season: self.get_season_description(season)
            for season in self.seasons
        }
