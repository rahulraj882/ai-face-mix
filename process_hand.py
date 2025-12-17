from PIL import Image

def process():
    try:
        print("Processing hand...")
        # Open source image
        img = Image.open("assets/hand_overlay.png").convert("RGBA")
        datas = img.getdata()
        newData = []
        
        for item in datas:
            # Calculate brightness (sum of RGB)
            brightness = item[0] + item[1] + item[2]
            
            # Threshold: Remove if very dark (Black background)
            # 80/765 is about 10% brightness.
            if brightness < 80:
                newData.append((0, 0, 0, 0))
            else:
                newData.append(item)
                
        img.putdata(newData)
        img.save("assets/hand_overlay_transparent.png", "PNG")
        print("Done. Saved to assets/hand_overlay_transparent.png")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    process()
