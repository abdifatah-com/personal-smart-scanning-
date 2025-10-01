import qrcode

url = "http://172.20.10.4:8000"
img = qrcode.make(url)
img.save("site_qr.png")
print("✅ QR code saved as site_qr.png")
