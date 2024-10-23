import { backend } from "declarations/backend";
import { HttpAgent } from "@dfinity/agent";

let currentPhotoBlob = null;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const TIMEOUT_DURATION = 120000;

const agent = new HttpAgent({
    host: process.env.DFX_NETWORK === "ic" ? "https://ic0.app" : "http://localhost:4943",
    fetchOptions: { timeout: TIMEOUT_DURATION }
});

document.getElementById('photoInput').addEventListener('change', handlePhotoSelect);
document.getElementById('uploadBtn').addEventListener('click', handleUpload);

function cartoonizeImage(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw original image
    ctx.drawImage(img, 0, 0);
    
    // Apply edge detection
    ctx.filter = 'blur(1px) contrast(150%)';
    ctx.drawImage(canvas, 0, 0);
    
    // Apply color quantization effect
    ctx.filter = 'saturate(150%) brightness(110%)';
    ctx.drawImage(canvas, 0, 0);
    
    // Apply posterize effect
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const levels = 5;
    
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.floor(data[i] / 255 * levels) / levels * 255;     // R
        data[i + 1] = Math.floor(data[i + 1] / 255 * levels) / levels * 255; // G
        data[i + 2] = Math.floor(data[i + 2] / 255 * levels) / levels * 255; // B
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Apply final smoothing
    ctx.filter = 'brightness(105%) contrast(110%)';
    ctx.drawImage(canvas, 0, 0);
    
    return canvas;
}

async function processImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = function(e) {
            img.src = e.target.result;
            img.onload = function() {
                try {
                    // Resize image if too large
                    const MAX_DIMENSION = 800;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
                        width *= ratio;
                        height *= ratio;
                    }
                    
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Create cartoon effect
                    const cartoonCanvas = cartoonizeImage(canvas);
                    
                    cartoonCanvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/png', 0.8);
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = () => reject(new Error('Failed to load image'));
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

async function handlePhotoSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
        showMessage('Please select a valid image file (JPEG, PNG, or GIF)', 'error');
        return;
    }

    if (file.size > MAX_FILE_SIZE) {
        showMessage('File size must be less than 10MB', 'error');
        return;
    }

    showMessage('Creating avatar...', 'info');

    try {
        // Display original image
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('originalPreview').src = e.target.result;
        };
        reader.readAsDataURL(file);

        // Process and display cartoon version
        const cartoonBlob = await processImage(file);
        currentPhotoBlob = cartoonBlob;
        
        const cartoonUrl = URL.createObjectURL(cartoonBlob);
        document.getElementById('avatarPreview').src = cartoonUrl;
        showMessage('Avatar ready! Click upload to save.', 'success');
    } catch (error) {
        console.error('Error processing image:', error);
        showMessage('Error creating avatar. Please try again.', 'error');
    }
}

async function handleUpload() {
    if (!currentPhotoBlob) {
        showMessage('Please select a photo first', 'error');
        return;
    }

    const uploadBtn = document.getElementById('uploadBtn');
    uploadBtn.disabled = true;
    showMessage('Saving avatar...', 'info');

    try {
        const arrayBuffer = await currentPhotoBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        const result = await Promise.race([
            backend.uploadAvatar(uint8Array),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_DURATION)
            )
        ]);

        switch (result.tag) {
            case 'ok': {
                showMessage('Avatar saved successfully!', 'success');
                break;
            }
            case 'err': {
                throw new Error(result._0);
            }
        }
    } catch (error) {
        console.error('Error details:', error);
        if (error.name === 'AbortError' || error.message === 'Request timed out') {
            showMessage('Request timed out. Please try again with a smaller image.', 'error');
        } else {
            showMessage(error.message || 'Error saving avatar. Please try again.', 'error');
        }
    } finally {
        uploadBtn.disabled = false;
    }
}

function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
}
