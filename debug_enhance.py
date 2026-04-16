"""
Debug-enhanced IC card image — saves intermediate steps for inspection
"""
import cv2
import numpy as np
import sys

def debug_enhance_ic(input_path: str, output_dir: str = None):
    img = cv2.imread(input_path)
    h, w = img.shape[:2]

    # Crop IC number region — IC number is in top 30% of card
    # (below header "KAD PENGENALAN", above the photo area)
    top = img[:int(h * 0.38), :]
    gray = cv2.cvtColor(top, cv2.COLOR_BGR2GRAY)

    fname = input_path.split('\\')[-1].replace('.', '_')
    out_dir = output_dir or "C:\\Users\\000\\Downloads"

    cv2.imwrite(f"{out_dir}\\{fname}_1_gray.jpg", gray)

    # Horizontal kernel
    hor_k = cv2.getStructuringElement(cv2.MORPH_RECT, (w // 6, 1))
    tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, hor_k)
    blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, hor_k)
    cv2.imwrite(f"{out_dir}\\{fname}_2_tophat.jpg", tophat)
    cv2.imwrite(f"{out_dir}\\{fname}_3_blackhat.jpg", blackhat)

    combined = cv2.add(tophat, blackhat)
    _, binary_mask = cv2.threshold(combined, 12, 255, cv2.THRESH_BINARY)
    cv2.imwrite(f"{out_dir}\\{fname}_4_line_mask.jpg", binary_mask)

    # Dilate mask
    k3 = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    dilated = cv2.dilate(binary_mask, k3, iterations=2)
    cv2.imwrite(f"{out_dir}\\{fname}_5_dilated.jpg", dilated)

    # Inpaint
    inpainted = cv2.inpaint(gray, dilated, inpaintRadius=5, flags=cv2.INPAINT_TELEA)
    cv2.imwrite(f"{out_dir}\\{fname}_6_inpainted.jpg", inpainted)

    # CLAHE
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(inpainted)
    cv2.imwrite(f"{out_dir}\\{fname}_7_clahe.jpg", enhanced)

    # Otsu binarization instead of adaptive (more stable)
    blur = cv2.GaussianBlur(enhanced, (3, 3), 0)
    _, binarized = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    cv2.imwrite(f"{out_dir}\\{fname}_8_binarized.jpg", binarized)

    # Scale up 2x
    scaled = cv2.resize(binarized, (w * 2, int(h * 0.38 * 2)), interpolation=cv2.INTER_CUBIC)
    cv2.imwrite(f"{out_dir}\\{fname}_9_final.jpg", scaled)

    # Now test tesseract on the final image
    import subprocess
    result = subprocess.run(
        ['C:\\Program Files\\Tesseract-OCR\\tesseract.exe',
         f"{out_dir}\\{fname}_9_final.jpg", 'stdout',
         '--oem', '1', '--psm', '6', '-l', 'mal+eng'],
        capture_output=True, text=True
    )
    print("=== ENHANCED IMAGE OCR ===", file=sys.stderr)
    print(result.stdout, file=sys.stderr)
    print("STDERR:", result.stderr, file=sys.stderr)
    print(f"White ratio: {np.count_nonzero(scaled) / scaled.size:.3f}", file=sys.stderr)

    return scaled

if __name__ == '__main__':
    input_img = sys.argv[1] if len(sys.argv) > 1 else "C:\\Users\\000\\Downloads\\Dummy IC 7.png"
    debug_enhance_ic(input_img)