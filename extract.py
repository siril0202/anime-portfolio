import cv2
import os
import math
import sys

def main():
    video_path = 'public/character.mp4'
    output_dir = 'public/frames'
    
    if not os.path.exists(video_path):
        print(f"Error: {video_path} not found.")
        sys.exit(1)
        
    os.makedirs(output_dir, exist_ok=True)
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("Error: Could not open video.")
        sys.exit(1)
        
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    print(f"Video Info: {fps} FPS, {total_frames} Frames, {width}x{height}")
    
    # Read the very first frame to find the background color
    ret, first_frame = cap.read()
    if ret:
        # Get background color from the top-left pixel (assuming uniform background)
        bg_color = first_frame[10, 10] # BGR
        print(f"Background Color (BGR): {bg_color}")
        with open('public/bg_color.txt', 'w') as f:
            f.write(f"#{bg_color[2]:02x}{bg_color[1]:02x}{bg_color[0]:02x}")
    else:
        print("Error reading first frame.")
        sys.exit(1)

    # Let's write a smaller script to just dump the timeline info so I can decide how to map the angles.
    # I don't know the video's timeline yet. Does it rotate sequentially? 
    # Let's save a few sample frames to see what's happening.
    
    # Save a frame every (total_frames // 8) frames
    step = total_frames // 8
    if step == 0:
        step = 1
        
    for i in range(8):
        frame_idx = i * step
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if ret:
            cv2.imwrite(f"{output_dir}/sample_{i}.webp", frame, [cv2.IMWRITE_WEBP_QUALITY, 90])
            
    # And the very last frame for center?
    cap.set(cv2.CAP_PROP_POS_FRAMES, total_frames - 1)
    ret, frame = cap.read()
    if ret:
        cv2.imwrite(f"{output_dir}/sample_last.webp", frame, [cv2.IMWRITE_WEBP_QUALITY, 90])
        
    cap.release()
    print("Samples extracted.")

if __name__ == '__main__':
    main()
