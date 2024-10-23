import { backend } from "declarations/backend";

let currentPhotoBlob = null;

document.getElementById('photoInput').addEventListener('change', handlePhotoSelect);
document.getElementById('uploadBtn').addEventListener('click', handleUpload);

function handlePhotoSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Display original preview
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('originalPreview').src = e.target.result;
        
        // Convert to Blob for upload
        fetch(e.target.result)
            .then(res => res.blob())
            .then(blob => {
                currentPhotoBlob = blob;
            });
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
        const avatarId = await backend.uploadAvatar(uint8Array);
        
        // Retrieve and display the avatar
        const avatarBlob = await backend.getAvatar(avatarId);
        if (avatarBlob) {
            const blob = new Blob([avatarBlob], { type: currentPhotoBlob.type });
            const imageUrl = URL.createObjectURL(blob);
            document.getElementById('avatarPreview').src = imageUrl;
            showMessage('Avatar created successfully!', 'success');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error creating avatar. Please try again.', 'error');
    }
}

function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
}
