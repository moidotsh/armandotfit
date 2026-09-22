#!/usr/bin/env python3
"""Fast plate aligner: downsample to 128px, then SSD search."""
import json, os, struct, subprocess, sys, tempfile, time

PLATES_DIR = '/Users/koba/Documents/Code/arman/armandotfit/public/exercise-plates'
SEARCH_RADIUS = 12
THUMB_W = 128

def decode_gray_bmp(path, resize_w=None):
    """Decode JPEG to grayscale. Optionally resize first via sips."""
    steps = []
    if resize_w:
        # Resize to thumbnail width
        fd, resized = tempfile.mkstemp(suffix='.jpg'); os.close(fd)
        subprocess.run(['sips', '-Z', str(resize_w), path, '--out', resized],
                       capture_output=True, timeout=10)
        path = resized
    else:
        resized = None

    fd, tmp = tempfile.mkstemp(suffix='.bmp'); os.close(fd)
    subprocess.run(['sips', '-s', 'format', 'bmp', path, '--out', tmp],
                   capture_output=True, timeout=10)
    try:
        data = open(tmp, 'rb').read()
        if len(data) < 60: return None
        offset = struct.unpack('<I', data[10:14])[0]
        width = struct.unpack('<i', data[18:22])[0]
        h_raw = struct.unpack('<i', data[22:26])[0]
        height = abs(h_raw)
        if width == 0 or height == 0: return None
        row_size = (width * 3 + 3) & ~3
        gray = [0.0] * (width * height)
        for y in range(height):
            row_start = offset + (height - 1 - y if h_raw > 0 else y) * row_size
            base = y * width
            for x in range(width):
                bi = row_start + x * 3
                gray[base + x] = (data[bi] * 0.114 + data[bi+1] * 0.587 + data[bi+2] * 0.299)
        return gray, width, height
    except Exception:
        return None
    finally:
        os.unlink(tmp)
        if resized: os.unlink(resized)

def ssd(a, aw, ah, b, bw, bh, dx, dy):
    # BORDER-BAND SSD — compare only the outer strips (where the
    # static background lives), skipping the center where the moving
    # subject would pull the alignment away from the camera offset.
    band = max(8, min(aw, ah) // 6)  # ~1/6 of the smaller dimension
    x0, y0 = max(0, dx), max(0, dy)
    x1, y1 = min(aw, bw + dx), min(ah, bh + dy)
    if x1 - x0 < 10 or y1 - y0 < 10: return float('inf')

    total, count = 0.0, 0
    for y in range(y0, y1, 2):
        in_top = y < y0 + band
        in_bottom = y >= y1 - band
        ai = y * aw
        bi = (y - dy) * bw
        for x in range(x0, x1, 2):
            # Skip the center — only compare if in a border band
            if not (in_top or in_bottom or x < x0 + band or x >= x1 - band):
                continue
            d = a[ai + x] - b[bi + x - dx]
            total += d * d
            count += 1
    return total / count if count else float('inf')

def find_offset(a, aw, ah, b, bw, bh):
    best_dx, best_dy, best = 0, 0, float('inf')
    for dy in range(-SEARCH_RADIUS, SEARCH_RADIUS + 1):
        for dx in range(-SEARCH_RADIUS, SEARCH_RADIUS + 1):
            s = ssd(a, aw, ah, b, bw, bh, dx, dy)
            if s < best:
                best, best_dx, best_dy = s, dx, dy
    return best_dx, best_dy, best

def main():
    apply = '--apply' in sys.argv
    files = sorted(f for f in os.listdir(PLATES_DIR) if f.endswith('.jpg') and '-b.jpg' not in f)
    b_frames = {f for f in os.listdir(PLATES_DIR) if f.endswith('-b.jpg')}

    print(f"Scanning {len(files)} A-frames ({len(b_frames)} B-frames)...")
    results = []
    offsets = {}
    t0 = time.time()

    for i, file in enumerate(files):
        b_file = file.replace('.jpg', '-b.jpg')
        if b_file not in b_frames: continue
        slug = file.replace('.jpg', '')

        try:
            ra = decode_gray_bmp(os.path.join(PLATES_DIR, file), THUMB_W)
            rb = decode_gray_bmp(os.path.join(PLATES_DIR, b_file), THUMB_W)
        except Exception:
            continue
        if not ra or not rb: continue

        # Scale the search radius to thumbnail size
        scale = THUMB_W / 640.0
        radius = max(2, int(SEARCH_RADIUS * scale))

        dx, dy, score = find_offset(ra[0], ra[1], ra[2], rb[0], rb[1], rb[2])
        # Scale back to full resolution
        full_dx = round(dx / scale)
        full_dy = round(dy / scale)
        is_aligned = full_dx == 0 and full_dy == 0

        results.append({'slug': slug, 'dx': full_dx, 'dy': full_dy,
                        'ssd': int(score), 'aligned': is_aligned})
        if not is_aligned:
            offsets[slug] = {'dx': full_dx, 'dy': full_dy}

        if (i + 1) % 100 == 0:
            elapsed = time.time() - t0
            print(f"  ... {i+1}/{len(files)} ({elapsed:.0f}s)")

    aligned = sum(1 for r in results if r['aligned'])
    shifted = [r for r in results if not r['aligned']]
    significant = [r for r in shifted if abs(r['dx']) > 2 or abs(r['dy']) > 2]

    print(f"\n=== ALIGNMENT REPORT ({time.time()-t0:.0f}s) ===")
    print(f"Total: {len(results)} | aligned(0,0): {aligned} | shifted: {len(shifted)} | significant(>2px): {len(significant)}")
    print(f"\nTop shifts:")
    for r in sorted(significant, key=lambda r: abs(r['dx'])+abs(r['dy']), reverse=True)[:15]:
        print(f"  {r['slug']:<44} dx={r['dx']:>3} dy={r['dy']:>3}")

    out = '/Users/koba/Documents/Code/arman/armandotfit/shared/exercises/plateOffsets.json'
    with open(out, 'w') as f:
        json.dump(offsets, f, indent=2)
    print(f"\nOffsets → {out} ({len(offsets)} entries)")
    print("DRY RUN" if not apply else "APPLIED")

if __name__ == '__main__':
    main()
