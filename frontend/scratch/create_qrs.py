import os
import base64

# Small 100x100 pixel mock QR code base64 PNG
MOCK_QR_BASE64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkAQMAAABKLMIQAAAABlBMVEUAAAD///+l2Z/d"
    "AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAo0lEQVQ4jWNgQAX8D/6f/4Hh/8H/8T9IMn4w"
    "8D8w/MdhwD9IMt7A8P8/Bv6DJKMVDf/hYj8gH10x2Q+4GBn+wzQyMMDFfkA+utT4H10x"
    "WSHYDxerFQP/4WK1YeA/XKw2DPyHi9WGgYGBgYH/kHwGBojYDxerjUDsB+SjS81+QLbW"
    "kP1wqZkvEPvBxX5AtsYQ8gMuRgYGBgYG/oP/5wOpHwwMDADdI1tZ9aU+uQAAAABJRU5E"
    "rkJggg=="
)

qr_dir = os.path.join("src", "assets", "qr")
os.makedirs(qr_dir, exist_ok=True)

tables = ["01", "02", "03", "04", "05", "06", "08", "14"]

for t in tables:
    filepath = os.path.join(qr_dir, f"table-{t}.png")
    with open(filepath, "wb") as f:
        f.write(base64.b64decode(MOCK_QR_BASE64))
    print(f"Created QR mock at {filepath}")
