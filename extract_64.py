import cv2
import os
import sys

def main():
    video_path = 'public/character.mp4'
    output_dir = 'public/frames'
    
    os.makedirs(output_dir, exist_ok=True)
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("Error: Could not open video.")
        sys.exit(1)
        
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"Total frames: {total_frames}")
    
    # We need 64 frames. Assuming the rotation is the first N frames.
    # We will sample 64 frames evenly from the first 200 frames (or we can just use total_frames - 20)
    # Let's just use the whole video up to the last 10 frames to be safe.
    
    # Actually, we can just map 0-63 to evenly spaced frames in [0, total_frames * 0.9]
    rotation_frames = int(total_frames * 0.9)
    step = rotation_frames / 64
    
    for i in range(64):
        frame_idx = int(i * step)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if ret:
            cv2.imwrite(f"{output_dir}/{i}.webp", frame, [cv2.IMWRITE_WEBP_QUALITY, 90])
            
    # center.webp from the very last frame
    cap.set(cv2.CAP_PROP_POS_FRAMES, total_frames - 1)
    ret, frame = cap.read()
    if ret:
        cv2.imwrite(f"{output_dir}/center.webp", frame, [cv2.IMWRITE_WEBP_QUALITY, 90])
        
    cap.release()
    print("64 frames and center.webp extracted successfully.")

if __name__ == '__main__':
    main()
