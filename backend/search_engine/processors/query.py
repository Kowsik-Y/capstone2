"""
Query Processor for Search Query Enhancement and Filtering
Handles negations, category extraction, and decoration filtering
"""

from typing import List


class QueryProcessor:
    """Processes search queries for enhanced semantic search"""
    
    def __init__(self, categories: List[str]):
        self.categories = categories
    
    def extract_categories(self, query: str) -> List[str]:
        """Extract categories from query"""
        q = query.lower()
        found = [c for c in self.categories if c in q]
        return found if found else self.categories
    
    def extract_negations(self, query: str) -> List[str]:
        """Extract negation terms from query"""
        q = query.lower()
        negations = []
        
        # Pattern: "no X"
        words = q.split()
        for i, word in enumerate(words):
            if word == "no" and i + 1 < len(words):
                next_word = words[i + 1]
                if next_word not in self.categories:
                    negations.append(next_word)
        
        # Pattern: "without X"
        if "without" in q:
            parts = q.split("without")
            if len(parts) > 1:
                after_without = parts[1].strip().split()
                if after_without and after_without[0] not in self.categories:
                    negations.append(after_without[0])
        
        return list(set(negations))
    
    def get_decoration_terms(self, category: str, negations: List[str]) -> List[str]:
        """Generate decoration detection terms based on what was negated"""
        decoration_terms = []
        
        for neg in negations:
            # Add variations of the negated term with the category
            decoration_terms.extend([
                f"{category} with {neg}",
                f"{neg} {category}",
                f"{category} featuring {neg}",
                f"{neg}s on {category}",
                f"{category} set with {neg}s"
            ])
            
            # Add specific variations based on common jewelry terms
            if "diamond" in neg or "stone" in neg or "gem" in neg:
                decoration_terms.extend([
                    f"jeweled {category}", f"sparkly {category}",
                    f"{category} with stones", f"{category} with gems"
                ])
            if "pendant" in neg or "charm" in neg:
                decoration_terms.extend([
                    f"{category} with pendant", f"{category} with charm",
                    f"pendant {category}", f"charm {category}"
                ])
            if "pattern" in neg or "design" in neg or "engraving" in neg:
                decoration_terms.extend([
                    f"patterned {category}", f"engraved {category}",
                    f"ornate {category}", f"{category} with design"
                ])
        
        return list(set(decoration_terms))
    
    def get_plain_terms(self, category: str) -> List[str]:
        """Generate plain/simple detection terms"""
        if category == "ring":
            return [
                "plain gold ring", "simple ring band", "smooth metal ring",
                "minimalist ring", "wedding band", "plain ring"
            ]
        elif category == "necklace":
            return [
                "plain gold necklace", "simple chain necklace", "minimalist necklace",
                "basic necklace chain", "smooth necklace"
            ]
        return [f"plain simple {category}"]
    
    def enhance_query(self, query: str, category: str, negations: List[str]) -> str:
        """Enhance query with positive terms"""
        enhanced = query.lower()
        
        if negations:
            for neg in negations:
                enhanced = enhanced.replace(f"no {neg}", "plain simple")
                enhanced = enhanced.replace(f"without {neg}", "minimalist smooth")
        
        return enhanced
