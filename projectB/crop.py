from pathlib import Path
from PIL import Image
from tqdm import tqdm

TARGET_SIZE = 512  # square dimension (pixels)
BASE_DIR = Path("assets")

# Define city input and naming
CITY_SOURCES = {
    "shanghai": BASE_DIR / "shanghai_memories_ccl",
    "abudhabi": BASE_DIR / "abu_dhabi_memories_ccl",
}

def process_city(city_name, src_folder):
    out_prefix = city_name
    files = sorted(src_folder.glob("*"))

    if len(files) < 66:
        raise ValueError(f"❌ Only found {len(files)} files in {src_folder}, need at least 66.")

    print(f"✅ Processing {city_name.title()} from: {src_folder}")
    for i, fp in enumerate(tqdm(files[:66], desc=f"Cropping {city_name}")):
        try:
            img = Image.open(fp).convert("RGB")
            w, h = img.size
            # Center crop to square
            side = min(w, h)
            left = (w - side) // 2
            top = (h - side) // 2
            img_sq = img.crop((left, top, left + side, top + side))
            img_sq = img_sq.resize((TARGET_SIZE, TARGET_SIZE), Image.LANCZOS)

            out_path = BASE_DIR / f"{out_prefix}-{i + 1:02d}.jpg"
            img_sq.save(out_path, quality=90)
        except Exception as e:
            print(f"⚠️ Error with {fp.name}: {e}")

if __name__ == "__main__":
    for city, folder in CITY_SOURCES.items():
        process_city(city, folder)

    print("\n✅ Done! Cropped images saved in assets/ as shanghai-01.jpg and abudhabi-01.jpg …")
