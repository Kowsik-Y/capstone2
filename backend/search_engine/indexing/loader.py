"""
Image Loader - Loads jewelry images from dataset directories
"""

import os


async def load_images(engine):
    """Load image paths and categories from the dataset directory"""
    image_dir = os.path.join(engine.data_root, "Jewellery_Data")
    
    if not os.path.exists(image_dir):
        print(f"⚠️  Image directory not found: {image_dir}")
        print(f"ℹ️  Please create the directory and add your jewelry images")
        print(f"ℹ️  Expected structure: {image_dir}/{{category}}/{{image.jpg}}")
    
    for category in engine.categories:
        cat_dir = os.path.join(image_dir, category)
        if not os.path.isdir(cat_dir):
            print(f"⚠️  Category directory not found: {cat_dir}")
            continue
        
        count_before = len(engine.image_paths)
        for f in os.listdir(cat_dir):
            if f.lower().endswith((".jpg", ".jpeg", ".png")):
                engine.image_paths.append(os.path.join(cat_dir, f))
                engine.image_categories.append(category)
        
        images_added = len(engine.image_paths) - count_before
        if images_added > 0:
            print(f"✅ Loaded {images_added} {category} images")
    
    engine.total_images = len(engine.image_paths)
    print(f"✅ Total: {engine.total_images} images across {len(engine.categories)} categories")
