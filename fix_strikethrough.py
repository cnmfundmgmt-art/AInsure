"""
Enhanced IC card preprocessing - targets ONLY the horizontal strike-through
line at the specific y-position where the IC number sits.
No broad horizontal kernels that also destroy the text.
"""
import cv2
import numpy as np
import sys

def enhance_ic_strike_through(input_path: str, output_path: str = None):
    img = cv2.imread(input_path)
    h, w = img.shape[:2]

    # The IC number in a MyKad sits just below the header text.
    # We crop to the region where the IC number lives.
    ic_top = int(h * 0.10)   # below header
    ic_bot = int(h * 0.25)   # above photo
    ic_region = img[ic_top:ic_bot, :]
    gray = cv2.cvtColor(ic_region, cv2.COLOR_BGR2GRAY)

    fname = input_path.split('\\')[-1].replace('.', '_')
    out_dir = "C:\\Users\\000\\Downloads"

    # Save cropped region
    cv2.imwrite(f"{out_dir}\\{fname}_crop.jpg", ic_region)

    # ── Step 1: Find the strike-through line's y-position ─────────────────────
    # Sum pixels vertically to find rows with high horizontal line energy
    # (the strike-through creates a strong horizontal signal)
    row_energy = cv2.reduce(cv2.bitwise_not(gray), 1, cv2.REDUCE_AVG)  # darker rows = more black
    row_energy = row_energy.flatten()

    # Find the row with maximum energy (most horizontal dark content)
    strike_y = int(np.argmax(row_energy))
    print(f"Detected strike-through line at y={strike_y} (of {gray.shape[0]})", file=sys.stderr)

    if strike_y < 5 or strike_y > gray.shape[0] - 5:
        print("Strike-through line detection failed, falling back to center", file=sys.stderr)
        strike_y = gray.shape[0] // 2

    # Estimate strike-through thickness (typically 2-6 pixels after scaling)
    strike_thickness = gray.shape[0] // 22  # roughly 4-6% of region height
    print(f"Estimated strike thickness: {strike_thickness}px", file=sys.stderr)

    # ── Step 2: Build a surgical mask - only the line band ────────────────────
    mask = np.zeros(gray.shape[:2], dtype=np.uint8)
    mask_y0 = max(0, strike_y - strike_thickness)
    mask_y1 = min(gray.shape[0], strike_y + strike_thickness)
    mask[mask_y0:mask_y1, :] = 255

    # Also detect narrow isolated horizontal bars (like the strike-through)
    # Use thin horizontal morphology to detect the line
    thin_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (w // 4, 1))
    tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, thin_kernel)
    _, line_binary = cv2.threshold(tophat, 8, 255, cv2.THRESH_BINARY)

    # Combine with our y-position mask
    line_mask = cv2.bitwise_or(mask, line_binary)
    cv2.imwrite(f"{out_dir}\\{fname}_line_mask.jpg", line_mask)

    # ── Step 3: Inpaint only the line band ────────────────────────────────────
    inpainted = cv2.inpaint(gray, line_mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)
    cv2.imwrite(f"{out_dir}\\{fname}_inpainted.jpg", inpainted)

    # ── Step 4: Enhance for OCR ───────────────────────────────────────────────
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    enhanced = clahe.apply(inpainted)
    cv2.imwrite(f"{out_dir}\\{fname}_clahe.jpg", enhanced)

    # Otsu binarization
    blur = cv2.GaussianBlur(enhanced, (3, 3), 0)
    _, binary = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    cv2.imwrite(f"{out_dir}\\{fname}_binary.jpg", binary)

    # Scale up 2.5x
    scaled = cv2.resize(binary, (w * 3, int(gray.shape[0] * 2.5)), interpolation=cv2.INTER_CUBIC)
    cv2.imwrite(f"{out_dir}\\{fname}_final.jpg", scaled)

    # ── Step 5: Test Tesseract on blackhat (alternative - may work better) ─────
    blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, thin_kernel)
    _, bh_binary = cv2.threshold(blackhat, 8, 255, cv2.THRESH_BINARY)
    bh_scaled = cv2.resize(bh_binary, (w * 3, int(gray.shape[0] * 2.5)), interpolation=cv2.INTER_CUBIC)
    cv2.imwrite(f"{out_dir}\\{fname}_blackhat_final.jpg", bh_scaled)

    import subprocess
    for label, img_file in [
        ("ENHANCED", f"{out_dir}\\{fname}_final.jpg"),
        ("BLACKHAT", f"{out_dir}\\{fname}_blackhat_final.jpg"),
    ]:
        result = subprocess.run(
            ['C:\\Program Files\\Tesseract-OCR\\tesseract.exe',
             img_file, 'stdout', '--oem', '1', '--psm', '6', '-l', 'mal+eng'],
            capture_output=True, text=True
        )
        print(f"\n=== {label} OCR RESULT ===", file=sys.stderr)
        print(result.stdout.strip(), file=sys.stderr)

    print(f"White ratio final: {np.count_nonzero(scaled) / scaled.size:.3f}", file=sys.stderr)

if __name__ == '__main__':
    inp = sys.argv[1] if len(sys.argv) > 1 else "C:\\Users\\000\\Downloads\\Dummy IC 7.png"
    enhance_ic_strike_through(inp)