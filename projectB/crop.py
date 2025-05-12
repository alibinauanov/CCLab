from pathlib import Path
from PIL import Image
from tqdm import tqdm

TARGET_SIZE = 512  # Square output size
BASE_DIR = Path("assets")

def process_all_images(base_dir):
    # Get all JPG and jpg files recursively
    image_files = list(base_dir.rglob("*.jpg")) + list(base_dir.rglob("*.JPG"))

    print(f"✅ Found {len(image_files)} image(s) in {base_dir}")

    for fp in tqdm(image_files, desc="Cropping and resizing"):
        try:
            img = Image.open(fp).convert("RGB")
            w, h = img.size
            side = min(w, h)
            left = (w - side) // 2
            top = (h - side) // 2
            img_sq = img.crop((left, top, left + side, top + side))
            img_sq = img_sq.resize((TARGET_SIZE, TARGET_SIZE), Image.LANCZOS)
            img_sq.save(fp.with_suffix('.jpg'), quality=90)  # Ensure output is .jpg
        except Exception as e:
            print(f"⚠️ Error processing {fp.name}: {e}")

if __name__ == "__main__":
    process_all_images(BASE_DIR)
    print("\n✅ Done! All images in 'assets/' cropped and resized to 512x512 while keeping their original names.")