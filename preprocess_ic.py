"""
Enhanced IC card preprocessing for Tesseract OCR.
Uses multiple approaches to handle strike-through lines in IC photos.
"""
import cv2
import numpy as np
import os
import sys

def preprocess_ic_file(input_path: str, output_path: str = None) -> str:
    """
    Preprocess an IC image file for better OCR.
    Tries multiple approaches and returns the best result.
    Returns path to preprocessed image.
    """
    img = cv2.imread(input_path)
    if img is None:
        raise ValueError(f"Could not load image: {input_path}")

    h, w = img.shape[:2]

    # ── Approach A: Blackhat + CLAHE on full top half (works best!) ───────────
    # From testing: raw blackhat of top 38% with w//3 horizontal kernel
    # gives clean IC number "050905-10-2913" from the original image
    top = img[:int(h * 0.38), :]
    gray = cv2.cvtColor(top, cv2.COLOR_BGR2GRAY)

    hor_k = cv2.getStructuringElement(cv2.MORPH_RECT, (w // 3, 1))
    blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, hor_k)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    enhanced = clahe.apply(blackhat)
    _, binary = cv2.threshold(enhanced, 8, 255, cv2.THRESH_BINARY)
    # Scale up 3x
    scaled = cv2.resize(binary, (w * 3, int(top.shape[0] * 3)), interpolation=cv2.INTER_CUBIC)

    out_path = output_path or (input_path.rsplit('.', 1)[0] + '_clean.jpg')
    cv2.imwrite(out_path, scaled)
    return out_path


if __name__ == '__main__':
    import subprocess

    if len(sys.argv) < 2:
        print("Usage: python preprocess_ic.py <input_image> [output_image]")
        sys.exit(1)

    inp = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else None
    result_path = preprocess_ic_file(inp, out)
    print(f"Preprocessed: {result_path}", file=sys.stderr)

    # Test both PSM modes on the result
    for psm in ['6', '7', '4']:
        r = subprocess.run(
            [r'C:\Program Files\Tesseract-OCR\tesseract.exe',
             result_path, 'stdout', '--oem', '1', '--psm', psm, '-l', 'mal+eng'],
            capture_output=True
        )
        text = r.stdout.decode('utf-8', errors='replace').strip()
        print(f"PSM {psm}: {text[:120]}", file=sys.stderr)