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

function create3DEffect(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Create depth map
    const depthMap = new Uint8ClampedArray(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            depthMap[y * width + x] = brightness;
        }
    }
    
    // Apply 3D lighting effect
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const depth = depthMap[y * width + x];
            
            // Add highlights
            if (depth > 200) {
                data[i] = Math.min(255, data[i] * 1.2);
                data[i + 1] = Math.min(255, data[i + 1] * 1.2);
                data[i + 2] = Math.min(255, data[i + 2] * 1.2);
            }
            
            // Add shadows
            if (depth < 50) {
                data[i] = data[i] * 0.8;
                data[i + 1] = data[i + 1] * 0.8;
                data[i + 2] = data[i + 2] * 0.8;
            }
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}

function applyComicalEffect(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Vibrant color palette
    const colors = [
        [255, 89, 94],   // Vibrant Red
        [255, 202, 58],  // Vibrant Yellow
        [138, 201, 38],  // Vibrant Green
        [25, 130, 196],  // Vibrant Blue
        [106, 76, 147],  // Vibrant Purple
    ];
    
    for (let i = 0; i < data.length; i += 4) {
        // Find closest vibrant color
        let minDistance = Infinity;
        let closestColor = colors[0];
        
        for (const color of colors) {
            const distance = Math.sqrt(
                Math.pow(data[i] - color[0], 2) +
                Math.pow(data[i + 1] - color[1], 2) +
                Math.pow(data[i + 2] - color[2], 2)
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = color;
            }
        }
        
        // Apply color with smooth transition
        const blend = 0.7;
        data[i] = data[i] * (1 - blend) + closestColor[0] * blend;
        data[i + 1] = data[i + 1] * (1 - blend) + closestColor[1] * blend;
        data[i + 2] = data[i + 2] * (1 - blend) + closestColor[2] * blend;
    }
    
    ctx.putImageData(imageData, 0, 0);
}

function cartoonizeImage(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw original image
    ctx.drawImage(img, 0, 0);
    
    // Apply edge detection
    ctx.filter = 'blur(1px)';
    ctx.drawImage(canvas, 0, 0);
    
    // Enhance edges
    const edgeCanvas = document.createElement('canvas');
    const edgeCtx = edgeCanvas.getContext('2d');
    edgeCanvas.width = canvas.width;
    edgeCanvas.height = canvas.height;
    edgeCtx.drawImage(canvas, 0, 0);
    edgeCtx.filter = 'contrast(400%) brightness(100%)';
    edgeCtx.drawImage(canvas, 0, 0);
    
    // Apply cel-shading effect
    ctx.filter = 'none';
    ctx.drawImage(canvas, 0, 0);
    applyComicalEffect(ctx, canvas.width, canvas.height);
    
    // Add 3D effect
    create3DEffect(ctx, canvas.width, canvas.height);
    
    // Blend edges
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(edgeCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    
    // Final adjustments
    ctx.filter = 'contrast(110%) saturate(130%)';
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
                    
                    const cartoonCanvas = cartoonizeImage(canvas);
                    
                    cartoonCanvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/png', 0.9);
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

// Rest of the code remains the same (handlePhotoSelect, handleUpload, showMessage functions)
