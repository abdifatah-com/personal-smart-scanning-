import cv2
import numpy as np
import tkinter as tk
from tkinter import ttk, messagebox
import threading
import time
from pyzbar import pyzbar
import qrcode
from PIL import Image, ImageTk
import sys

class QRScannerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("QR Code Scanner - Enhanced")
        self.root.geometry("800x600")
        self.root.configure(bg='#2c3e50')
        
        # Scanner variables
        self.cap = None
        self.scanning = False
        self.cameras = []
        self.selected_camera = 0
        self.last_scan_time = 0
        self.scan_cooldown = 1.0  # 1 second cooldown between scans
        
        # UI variables
        self.scanning_var = tk.BooleanVar()
        self.camera_var = tk.StringVar()
        
        self.setup_ui()
        self.detect_cameras()
        
    def setup_ui(self):
        # Main frame
        main_frame = tk.Frame(self.root, bg='#2c3e50', padx=20, pady=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        title_label = tk.Label(main_frame, text="QR Code Scanner", 
                              font=('Arial', 24, 'bold'), 
                              fg='white', bg='#2c3e50')
        title_label.pack(pady=(0, 20))
        
        # Camera selection frame
        camera_frame = tk.Frame(main_frame, bg='#34495e', relief=tk.RAISED, bd=2)
        camera_frame.pack(fill=tk.X, pady=(0, 20))
        
        tk.Label(camera_frame, text="Select Camera:", 
                font=('Arial', 12, 'bold'), 
                fg='white', bg='#34495e').pack(side=tk.LEFT, padx=10, pady=10)
        
        self.camera_combo = ttk.Combobox(camera_frame, textvariable=self.camera_var, 
                                        state="readonly", width=30)
        self.camera_combo.pack(side=tk.LEFT, padx=10, pady=10)
        self.camera_combo.bind('<<ComboboxSelected>>', self.on_camera_change)
        
        # Control buttons frame
        control_frame = tk.Frame(main_frame, bg='#2c3e50')
        control_frame.pack(fill=tk.X, pady=(0, 20))
        
        self.start_button = tk.Button(control_frame, text="Start Scanning", 
                                     command=self.start_scanning,
                                     font=('Arial', 12, 'bold'),
                                     bg='#27ae60', fg='white',
                                     relief=tk.RAISED, bd=3,
                                     padx=20, pady=10)
        self.start_button.pack(side=tk.LEFT, padx=10)
        
        self.stop_button = tk.Button(control_frame, text="Stop Scanning", 
                                    command=self.stop_scanning,
                                    font=('Arial', 12, 'bold'),
                                    bg='#e74c3c', fg='white',
                                    relief=tk.RAISED, bd=3,
                                    padx=20, pady=10,
                                    state=tk.DISABLED)
        self.stop_button.pack(side=tk.LEFT, padx=10)
        
        # Settings frame
        settings_frame = tk.Frame(main_frame, bg='#34495e', relief=tk.RAISED, bd=2)
        settings_frame.pack(fill=tk.X, pady=(0, 20))
        
        tk.Label(settings_frame, text="Enhancement Settings:", 
                font=('Arial', 12, 'bold'), 
                fg='white', bg='#34495e').pack(anchor=tk.W, padx=10, pady=(10, 5))
        
        # Brightness control
        brightness_frame = tk.Frame(settings_frame, bg='#34495e')
        brightness_frame.pack(fill=tk.X, padx=10, pady=5)
        
        tk.Label(brightness_frame, text="Brightness:", 
                fg='white', bg='#34495e').pack(side=tk.LEFT)
        self.brightness_var = tk.DoubleVar(value=1.0)
        self.brightness_scale = tk.Scale(brightness_frame, from_=0.1, to=3.0, 
                                        resolution=0.1, orient=tk.HORIZONTAL,
                                        variable=self.brightness_var,
                                        bg='#34495e', fg='white',
                                        highlightbackground='#34495e')
        self.brightness_scale.pack(side=tk.LEFT, padx=10, fill=tk.X, expand=True)
        
        # Contrast control
        contrast_frame = tk.Frame(settings_frame, bg='#34495e')
        contrast_frame.pack(fill=tk.X, padx=10, pady=5)
        
        tk.Label(contrast_frame, text="Contrast:", 
                fg='white', bg='#34495e').pack(side=tk.LEFT)
        self.contrast_var = tk.DoubleVar(value=1.0)
        self.contrast_scale = tk.Scale(contrast_frame, from_=0.1, to=3.0, 
                                      resolution=0.1, orient=tk.HORIZONTAL,
                                      variable=self.contrast_var,
                                      bg='#34495e', fg='white',
                                      highlightbackground='#34495e')
        self.contrast_scale.pack(side=tk.LEFT, padx=10, fill=tk.X, expand=True)
        
        # Video display frame
        video_frame = tk.Frame(main_frame, bg='#34495e', relief=tk.RAISED, bd=2)
        video_frame.pack(fill=tk.BOTH, expand=True)
        
        self.video_label = tk.Label(video_frame, text="Camera feed will appear here", 
                                   font=('Arial', 14), 
                                   fg='white', bg='#34495e')
        self.video_label.pack(expand=True)
        
        # Status frame
        status_frame = tk.Frame(main_frame, bg='#2c3e50')
        status_frame.pack(fill=tk.X, pady=(10, 0))
        
        self.status_label = tk.Label(status_frame, text="Ready to scan", 
                                    font=('Arial', 10), 
                                    fg='#95a5a6', bg='#2c3e50')
        self.status_label.pack()
        
    def detect_cameras(self):
        """Detect all available cameras"""
        self.cameras = []
        camera_names = []
        
        # Test cameras from 0 to 10
        for i in range(11):
            cap = cv2.VideoCapture(i)
            if cap.isOpened():
                ret, frame = cap.read()
                if ret:
                    self.cameras.append(i)
                    # Try to get camera name if possible
                    camera_name = f"Camera {i}"
                    if i == 0:
                        camera_name = "Default Camera"
                    elif "droidcam" in str(cap.getBackend()).lower():
                        camera_name = "DroidCam Video"
                    elif "obs" in str(cap.getBackend()).lower():
                        camera_name = "OBS Virtual Camera"
                    
                    camera_names.append(camera_name)
                cap.release()
        
        # Add some common virtual camera names
        common_cameras = [
            "DroidCam Video",
            "User Facing Right", 
            "World Facing Right",
            "LSVCam",
            "OBS Virtual Camera"
        ]
        
        for name in common_cameras:
            if name not in camera_names:
                camera_names.append(name)
        
        self.camera_combo['values'] = camera_names
        if camera_names:
            self.camera_combo.set(camera_names[0])
            self.selected_camera = 0
    
    def on_camera_change(self, event):
        """Handle camera selection change"""
        selection = self.camera_combo.get()
        if selection:
            try:
                # Find camera index
                for i, name in enumerate(self.camera_combo['values']):
                    if name == selection:
                        self.selected_camera = i if i < len(self.cameras) else 0
                        break
            except:
                self.selected_camera = 0
    
    def start_scanning(self):
        """Start the scanning process"""
        if self.scanning:
            return
            
        self.scanning = True
        self.start_button.config(state=tk.DISABLED)
        self.stop_button.config(state=tk.NORMAL)
        self.status_label.config(text="Starting camera...", fg='#f39c12')
        
        # Start scanning in a separate thread
        self.scan_thread = threading.Thread(target=self.scan_loop, daemon=True)
        self.scan_thread.start()
    
    def stop_scanning(self):
        """Stop the scanning process"""
        self.scanning = False
        self.start_button.config(state=tk.NORMAL)
        self.stop_button.config(state=tk.DISABLED)
        self.status_label.config(text="Scanning stopped", fg='#e74c3c')
        
        if self.cap:
            self.cap.release()
            self.cap = None
        
        # Clear video display
        self.video_label.config(image='', text="Camera feed stopped")
    
    def scan_loop(self):
        """Main scanning loop"""
        try:
            # Initialize camera
            self.cap = cv2.VideoCapture(self.selected_camera)
            if not self.cap.isOpened():
                self.root.after(0, lambda: self.status_label.config(text="Failed to open camera", fg='#e74c3c'))
                return
            
            self.root.after(0, lambda: self.status_label.config(text="Scanning... Point camera at QR code", fg='#27ae60'))
            
            while self.scanning:
                ret, frame = self.cap.read()
                if not ret:
                    break
                
                # Apply enhancements
                enhanced_frame = self.enhance_frame(frame)
                
                # Scan for QR codes
                qr_codes = pyzbar.decode(enhanced_frame)
                
                # Draw scanning overlay
                overlay_frame = self.draw_scanning_overlay(enhanced_frame.copy())
                
                # Process detected QR codes
                for qr_code in qr_codes:
                    current_time = time.time()
                    if current_time - self.last_scan_time > self.scan_cooldown:
                        self.process_qr_code(qr_code)
                        self.last_scan_time = current_time
                
                # Display frame
                self.display_frame(overlay_frame)
                
                # Small delay to prevent high CPU usage
                time.sleep(0.03)
                
        except Exception as e:
            self.root.after(0, lambda: self.status_label.config(text=f"Error: {str(e)}", fg='#e74c3c'))
        finally:
            if self.cap:
                self.cap.release()
                self.cap = None
    
    def enhance_frame(self, frame):
        """Apply brightness and contrast enhancements"""
        # Convert to float for processing
        enhanced = frame.astype(np.float32) / 255.0
        
        # Apply brightness
        enhanced = enhanced * self.brightness_var.get()
        
        # Apply contrast
        enhanced = (enhanced - 0.5) * self.contrast_var.get() + 0.5
        
        # Clip values to valid range
        enhanced = np.clip(enhanced, 0, 1)
        
        # Convert back to uint8
        enhanced = (enhanced * 255).astype(np.uint8)
        
        return enhanced
    
    def draw_scanning_overlay(self, frame):
        """Draw scanning overlay with targeting reticle"""
        height, width = frame.shape[:2]
        
        # Create overlay
        overlay = frame.copy()
        
        # Draw scanning reticle
        center_x, center_y = width // 2, height // 2
        reticle_size = min(width, height) // 4
        
        # Outer circle
        cv2.circle(overlay, (center_x, center_y), reticle_size, (0, 255, 0), 2)
        
        # Inner crosshair
        cv2.line(overlay, (center_x - reticle_size//2, center_y), 
                (center_x + reticle_size//2, center_y), (0, 255, 0), 2)
        cv2.line(overlay, (center_x, center_y - reticle_size//2), 
                (center_x, center_y + reticle_size//2), (0, 255, 0), 2)
        
        # Corner brackets
        bracket_size = 20
        # Top-left
        cv2.line(overlay, (center_x - reticle_size, center_y - reticle_size), 
                (center_x - reticle_size + bracket_size, center_y - reticle_size), (0, 255, 0), 3)
        cv2.line(overlay, (center_x - reticle_size, center_y - reticle_size), 
                (center_x - reticle_size, center_y - reticle_size + bracket_size), (0, 255, 0), 3)
        
        # Top-right
        cv2.line(overlay, (center_x + reticle_size, center_y - reticle_size), 
                (center_x + reticle_size - bracket_size, center_y - reticle_size), (0, 255, 0), 3)
        cv2.line(overlay, (center_x + reticle_size, center_y - reticle_size), 
                (center_x + reticle_size, center_y - reticle_size + bracket_size), (0, 255, 0), 3)
        
        # Bottom-left
        cv2.line(overlay, (center_x - reticle_size, center_y + reticle_size), 
                (center_x - reticle_size + bracket_size, center_y + reticle_size), (0, 255, 0), 3)
        cv2.line(overlay, (center_x - reticle_size, center_y + reticle_size), 
                (center_x - reticle_size, center_y + reticle_size - bracket_size), (0, 255, 0), 3)
        
        # Bottom-right
        cv2.line(overlay, (center_x + reticle_size, center_y + reticle_size), 
                (center_x + reticle_size - bracket_size, center_y + reticle_size), (0, 255, 0), 3)
        cv2.line(overlay, (center_x + reticle_size, center_y + reticle_size), 
                (center_x + reticle_size, center_y + reticle_size - bracket_size), (0, 255, 0), 3)
        
        # Add scanning text
        cv2.putText(overlay, "Scan QR Code", (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        return overlay
    
    def process_qr_code(self, qr_code):
        """Process detected QR code"""
        data = qr_code.data.decode('utf-8')
        qr_type = qr_code.type
        
        # Update status
        self.root.after(0, lambda: self.status_label.config(
            text=f"QR Code detected: {data[:50]}...", fg='#27ae60'))
        
        # Show result dialog
        self.root.after(0, lambda: self.show_qr_result(data, qr_type))
    
    def show_qr_result(self, data, qr_type):
        """Show QR code result in a dialog"""
        result_window = tk.Toplevel(self.root)
        result_window.title("QR Code Detected")
        result_window.geometry("500x300")
        result_window.configure(bg='#2c3e50')
        
        # Center the window
        result_window.transient(self.root)
        result_window.grab_set()
        
        # Content frame
        content_frame = tk.Frame(result_window, bg='#2c3e50', padx=20, pady=20)
        content_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        title_label = tk.Label(content_frame, text="QR Code Detected!", 
                              font=('Arial', 18, 'bold'), 
                              fg='#27ae60', bg='#2c3e50')
        title_label.pack(pady=(0, 20))
        
        # Type
        type_label = tk.Label(content_frame, text=f"Type: {qr_type}", 
                             font=('Arial', 12), 
                             fg='white', bg='#2c3e50')
        type_label.pack(pady=(0, 10))
        
        # Data
        data_label = tk.Label(content_frame, text="Data:", 
                             font=('Arial', 12, 'bold'), 
                             fg='white', bg='#2c3e50')
        data_label.pack(anchor=tk.W, pady=(0, 5))
        
        # Data text with scrollbar
        text_frame = tk.Frame(content_frame, bg='#34495e')
        text_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 20))
        
        text_widget = tk.Text(text_frame, wrap=tk.WORD, height=8, 
                             font=('Courier', 10), 
                             bg='#34495e', fg='white',
                             insertbackground='white')
        text_widget.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        scrollbar = tk.Scrollbar(text_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        text_widget.config(yscrollcommand=scrollbar.set)
        scrollbar.config(command=text_widget.yview)
        
        text_widget.insert(tk.END, data)
        text_widget.config(state=tk.DISABLED)
        
        # Buttons
        button_frame = tk.Frame(content_frame, bg='#2c3e50')
        button_frame.pack(fill=tk.X)
        
        copy_button = tk.Button(button_frame, text="Copy to Clipboard", 
                               command=lambda: self.copy_to_clipboard(data),
                               font=('Arial', 10, 'bold'),
                               bg='#3498db', fg='white',
                               padx=20, pady=5)
        copy_button.pack(side=tk.LEFT, padx=(0, 10))
        
        close_button = tk.Button(button_frame, text="Close", 
                                command=result_window.destroy,
                                font=('Arial', 10, 'bold'),
                                bg='#95a5a6', fg='white',
                                padx=20, pady=5)
        close_button.pack(side=tk.LEFT)
    
    def copy_to_clipboard(self, text):
        """Copy text to clipboard"""
        self.root.clipboard_clear()
        self.root.clipboard_append(text)
        messagebox.showinfo("Copied", "Text copied to clipboard!")
    
    def display_frame(self, frame):
        """Display frame in the UI"""
        try:
            # Resize frame to fit display
            height, width = frame.shape[:2]
            max_width, max_height = 640, 480
            
            if width > max_width or height > max_height:
                scale = min(max_width/width, max_height/height)
                new_width = int(width * scale)
                new_height = int(height * scale)
                frame = cv2.resize(frame, (new_width, new_height))
            
            # Convert BGR to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Convert to PIL Image
            pil_image = Image.fromarray(frame_rgb)
            
            # Convert to PhotoImage
            photo = ImageTk.PhotoImage(pil_image)
            
            # Update label
            self.video_label.config(image=photo, text="")
            self.video_label.image = photo  # Keep a reference
            
        except Exception as e:
            print(f"Error displaying frame: {e}")

def main():
    root = tk.Tk()
    app = QRScannerApp(root)
    
    # Handle window closing
    def on_closing():
        app.stop_scanning()
        root.destroy()
    
    root.protocol("WM_DELETE_WINDOW", on_closing)
    root.mainloop()

if __name__ == "__main__":
    main()