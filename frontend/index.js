import { backend } from "declarations/backend";
import { HttpAgent } from "@dfinity/agent";

let currentPhotoBlob = null;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const TIMEOUT_DURATION = 120000; // 2 minutes in milliseconds

// Configure agent with timeout
const agent = new HttpAgent({
    host: process.env.DFX_NETWORK === "ic" ? "https://ic0.app" : "http://localhost:4943",
    fetchOptions: {
        timeout: TIMEOUT_DURATION,
    },
});

document.getElementById('photoInput').addEventListener('change', handlePhotoSelect);
document.getElementById('uploadBtn').addEventListener('click', handleUpload);

async function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Maximum dimensions
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, file.type, 0.7); // 0.7 quality for compression
            };
        };
    });
}

function handlePhotoSelect(event) {
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

    showMessage('Processing image...', 'info');

    compressImage(file).then(compressedBlob => {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('originalPreview').src = e.target.result;
            currentPhotoBlob = compressedBlob;
            showMessage('Image ready for upload', 'success');
        };
        reader.onerror = function(error) {
            console.error('Error reading file:', error);
            showMessage('Error processing image. Please try again.', 'error');
        };
        reader.readAsDataURL(compressedBlob);
    }).catch(error => {
        console.error('Error compressing image:', error);
        showMessage('Error processing image. Please try again.', 'error');
    });
}

async function handleUpload() {
    if (!currentPhotoBlob) {
        showMessage('Please select a photo first', 'error');
        return;
    }

    const uploadBtn = document.getElementById('uploadBtn');
    uploadBtn.disabled = true;
    showMessage('Uploading to Internet Computer...', 'info');

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_DURATION);

        const arrayBuffer = await currentPhotoBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        const result = await Promise.race([
            backend.uploadAvatar(uint8Array),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_DURATION)
            )
        ]);

        clearTimeout(timeoutId);

        switch (result.tag) {
            case 'ok': {
                const avatarId = result._0;
                showMessage('Retrieving avatar...', 'info');
                
                const avatarResult = await backend.getAvatar(avatarId);
                
                switch (avatarResult.tag) {
                    case 'ok': {
                        const avatarBlob = avatarResult._0;
                        const blob = new Blob([avatarBlob], { type: currentPhotoBlob.type });
                        const imageUrl = URL.createObjectURL(blob);
                        document.getElementById('avatarPreview').src = imageUrl;
                        showMessage('Avatar created successfully!', 'success');
                        break;
                    }
                    case 'err': {
                        throw new Error(avatarResult._0);
                    }
                }
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
            showMessage(error.message || 'Error creating avatar. Please try again.', 'error');
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
