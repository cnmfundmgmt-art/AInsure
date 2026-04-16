"""
Enhance IC card image to remove horizontal strike-through lines
and improve OCR accuracy for the IC number region.
"""
import cv2
import numpy as np
import sys

def enhance_ic_image(input_path: str, output_path: str = None):
    """
    Preprocess IC card image to remove horizontal interference lines
    and enhance the IC number region for Tesseract OCR.
    """
    img = cv2.imread(input_path)
    if img is None:
        print(f"Error: Could not load image from {input_path}", file=sys.stderr)
        sys.exit(1)

    h, w = img.shape[:2]
    print(f"Image size: {w}x{h}", file=sys.stderr)

    # ── Step 1: Crop to top IC number region (top 25% of card) ───────────────
    # IC number is in the top ~15-20% of a standard MyKad layout
    top_region = img[:int(h * 0.22), :]

    # Convert to grayscale
    gray = cv2.cvtColor(top_region, cv2.COLOR_BGR2GRAY)

    # ── Step 2: Remove horizontal strike-through lines ─────────────────────────
    # Create a horizontal kernel to detect and remove uniform-width lines
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (w // 8, 1))

    # Top-hat extracts bright horizontal lines on dark background
    # (the strike-through line appears as a thin dark or light stripe)
    morph = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, horizontal_kernel)

    # Also use black-hat to catch dark lines on bright background
    blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, horizontal_kernel)

    # Combine both to catch strike-through regardless of polarity
    line_mask = cv2.add(morph, blackhat)

    # Threshold to isolate the line pixels
    _, binary_line = cv2.threshold(line_mask, 15, 255, cv2.THRESH_BINARY)

    # Dilate the mask slightly to ensure full coverage of the line
    kernel_dilate = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    line_mask_dilated = cv2.dilate(binary_line, kernel_dilate, iterations=2)

    # Inpaint: restore the region under the line using nearby pixels
    # Use TELEA method (fast and good for text)
    inpainted = cv2.inpaint(gray, line_mask_dilated, inpaintRadius=3, flags=cv2.INPAINT_TELEA)

    # ── Step 3: Enhance text contrast ─────────────────────────────────────────
    # CLAHE for adaptive contrast enhancement (good for varied background)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    enhanced = clahe.apply(inpainted)

    # ── Step 4: Binarize for clean text edges ────────────────────────────────
    # Adaptive threshold handles varying background illumination
    binary = cv2.adaptiveThreshold(
        enhanced, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=11,
        C=3
    )

    # Dilate text slightly to merge broken characters
    text_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    binary = cv2.dilate(binary, text_kernel, iterations=1)

    # ── Step 5: Deskew in case card is slightly tilted ─────────────────────────
    coords = np.column_stack(np.where(binary > 0))
    if coords.shape[0] > 0:
        angle = cv2.minAreaRect(coords)[-1]
        if 5 < abs(angle) < 90:
            # Only deskew if angle is meaningful
            (h_, w_) = binary.shape
            center = (w_ // 2, h_ // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            binary = cv2.warpAffine(binary, M, (w_, h_), flags=cv2.INTER_CUBIC,
                                    borderMode=cv2.BORDER_REPLICATE)

    # ── Step 6: Scale up 2× for better OCR resolution ───────────────────────
    scale = 2.0
    binary_scaled = cv2.resize(binary, (int(w * scale), int(h * 0.22 * scale)),
                                interpolation=cv2.INTER_CUBIC)

    # Save
    out = output_path or input_path.replace('.', '_enhanced.')
    cv2.imwrite(out, binary_scaled)
    print(f"Saved enhanced image to: {out}", file=sys.stderr)
    print(f"Enhanced size: {binary_scaled.shape[1]}x{binary_scaled.shape[0]}", file=sys.stderr)

    # Quick quality check — print basic stats
    white_ratio = np.count_nonzero(binary_scaled) / binary_scaled.size
    print(f"White pixel ratio (should be ~0.2-0.6): {white_ratio:.3f}", file=sys.stderr)

    return out

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python enhance_ic.py <input_image> [output_image]")
        sys.exit(1)

    input_img = sys.argv[1]
    output_img = sys.argv[2] if len(sys.argv) > 2 else None
    enhance_ic_image(input_img, output_img)