"""
Download Tanishq Jewellery Dataset from Kaggle
"""

import kagglehub
import os
import shutil
from pathlib import Path

def download_dataset(use_kaggle_api=True):
    print("🚀 Downloading Tanishq Jewellery Dataset from Kaggle...")
    print("📦 This may take a few minutes on first run...\n")
    
    try:
        # Download using kagglehub
        print("📥 Starting download via kagglehub...")
        path = kagglehub.dataset_download("sapnilpatel/tanishq-jewellery-dataset")
        print(f"✅ Dataset downloaded to: {path}\n")
        
        # Create target directory
        project_root = Path(__file__).parent
        target_dir = project_root / "data" / "Jewellery_Data"
        target_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy dataset to project data directory
        source_path = Path(path)
        print(f"📁 Organizing dataset structure...")
        
        # List contents of downloaded dataset
        print(f"\n📂 Contents of {source_path}:")
        for item in source_path.iterdir():
            print(f"   - {item.name}")
        
        # Check for nested Jewellery_Data folder (common in Kaggle datasets)
        if (source_path / "Jewellery_Data").exists():
            print("\n✅ Found nested Jewellery_Data folder")
            source_path = source_path / "Jewellery_Data"
            print(f"📂 Using: {source_path}")
        
        # Check for common dataset structures
        # Option 1: Images already organized by category
        if (source_path / "ring").exists():
            print("\n✅ Found 'ring' category")
            ring_dest = target_dir / "ring"
            ring_dest.mkdir(exist_ok=True)
            
            # Copy all ring images
            for img in (source_path / "ring").glob("*"):
                if img.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                    shutil.copy2(img, ring_dest / img.name)
        
        if (source_path / "necklace").exists():
            print("✅ Found 'necklace' category")
            necklace_dest = target_dir / "necklace"
            necklace_dest.mkdir(exist_ok=True)
            
            # Copy all necklace images
            for img in (source_path / "necklace").glob("*"):
                if img.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                    shutil.copy2(img, necklace_dest / img.name)
        
        # Option 2: All images in one folder - need to organize
        if not (source_path / "ring").exists() and not (source_path / "necklace").exists():
            print("\n⚠️  Dataset not pre-organized by category")
            print("📋 Copying all images - you may need to organize them manually")
            
            # Create categories if they don't exist
            (target_dir / "ring").mkdir(exist_ok=True)
            (target_dir / "necklace").mkdir(exist_ok=True)
            
            # Copy all images to a temp folder for manual sorting
            temp_dir = target_dir / "unsorted"
            temp_dir.mkdir(exist_ok=True)
            
            for item in source_path.rglob("*.jpg"):
                shutil.copy2(item, temp_dir / item.name)
            for item in source_path.rglob("*.jpeg"):
                shutil.copy2(item, temp_dir / item.name)
            for item in source_path.rglob("*.png"):
                shutil.copy2(item, temp_dir / item.name)
            
            print(f"📁 Images copied to: {temp_dir}")
            print("📝 Please manually organize images into ring/ and necklace/ folders")
        
        # Count images
        ring_count = len(list((target_dir / "ring").glob("*.jpg"))) + \
                     len(list((target_dir / "ring").glob("*.jpeg"))) + \
                     len(list((target_dir / "ring").glob("*.png")))
        
        necklace_count = len(list((target_dir / "necklace").glob("*.jpg"))) + \
                        len(list((target_dir / "necklace").glob("*.jpeg"))) + \
                        len(list((target_dir / "necklace").glob("*.png")))
        
        print(f"\n✅ Dataset setup complete!")
        print(f"📊 Statistics:")
        print(f"   - Ring images: {ring_count}")
        print(f"   - Necklace images: {necklace_count}")
        print(f"   - Total: {ring_count + necklace_count}")
        print(f"\n📁 Dataset location: {target_dir}")
        print(f"\n🚀 You can now start the backend server!")
        
        return str(target_dir)
        
    except Exception as e:
        print(f"\n❌ Error downloading dataset: {e}")
        print("\n💡 Troubleshooting:")
        print("   1. Make sure you have Kaggle API credentials configured")
        print("   2. Run: kaggle datasets download -d sapnilpatel/tanishq-jewellery-dataset")
        print("   3. Or download manually from: https://www.kaggle.com/datasets/sapnilpatel/tanishq-jewellery-dataset")
        raise

if __name__ == "__main__":
    download_dataset()
