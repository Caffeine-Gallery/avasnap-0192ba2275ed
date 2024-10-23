import { backend } from "declarations/backend";

let currentPhotoBlob = null;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

document.getElementById('photoInput').addEventListener('change', handlePhotoSelect);
document.getElementById('uploadBtn').addEventListener('click', handleUpload);

function handlePhotoSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
        showMessage('Please select a valid image file (JPEG, PNG, or GIF)', 'error');
        return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
        showMessage('File size must be less than 10MB', 'error');
        return;
    }

    // Display original preview
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('originalPreview').src = e.target.result;
        
        // Convert to Blob for upload
        fetch(e.target.result)
            .then(res => res.blob())
            .then(blob => {
                currentPhotoBlob = blob;
            })
            .catch(error => {
                console.error('Error converting image:', error);
                showMessage('Error processing image. Please try again.', 'error');
            });
    };
    reader.onerror = function(error) {
        console.error('Error reading file:', error);
        showMessage('Error reading file. Please try again.', 'error');
    };
    reader.readAsDataURL(file);
}

async function handleUpload() {
    if (!currentPhotoBlob) {
        showMessage('Please select a photo first', 'error');
        return;
    }

    try {
        showMessage('Processing...', 'info');
        
        // Convert Blob to Uint8Array for Candid
        const arrayBuffer = await currentPhotoBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Upload to backend
        const result = await backend.uploadAvatar(uint8Array);
        
        switch (result.tag) {
            case 'ok': {
                const avatarId = result._0;
                // Retrieve the avatar
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
        showMessage(error.message || 'Error creating avatar. Please try again.', 'error');
    }
}

function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
}
