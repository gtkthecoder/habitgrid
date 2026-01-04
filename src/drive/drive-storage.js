import { DRIVE_FILE_NAME, DRIVE_FOLDER_NAME, STORAGE_KEYS } from '../utils/constants.js';

export class DriveStorage {
    constructor(auth) {
        this.auth = auth;
        this.fileId = null;
        this.folderId = null;
        this.autoSaveInterval = null;
        this.lastSyncTime = null;
    }

    async initialize() {
        await this.ensureInitialized();
        return true;
    }

    async ensureInitialized() {
        if (!this.auth.isAuthenticated()) {
            throw new Error('Not authenticated with Google');
        }

        // Find or create HabitGrid folder
        await this.findOrCreateFolder();
        
        // Find or create data file
        await this.findOrCreateFile();
    }

    async findOrCreateFolder() {
        try {
            // Search for existing folder
            const response = await gapi.client.drive.files.list({
                q: `name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: 'files(id, name)',
                spaces: 'drive'
            });

            if (response.result.files && response.result.files.length > 0) {
                this.folderId = response.result.files[0].id;
                return this.folderId;
            }

            // Create new folder
            const folder = await gapi.client.drive.files.create({
                resource: {
                    name: DRIVE_FOLDER_NAME,
                    mimeType: 'application/vnd.google-apps.folder'
                },
                fields: 'id'
            });

            this.folderId = folder.result.id;
            return this.folderId;
        } catch (error) {
            console.error('Error finding/creating folder:', error);
            throw error;
        }
    }

    async findOrCreateFile() {
        try {
            // Search for existing file
            const response = await gapi.client.drive.files.list({
                q: `name='${DRIVE_FILE_NAME}' and '${this.folderId}' in parents and trashed=false`,
                fields: 'files(id, name, modifiedTime)',
                spaces: 'drive'
            });

            if (response.result.files && response.result.files.length > 0) {
                const file = response.result.files[0];
                this.fileId = file.id;
                this.lastSyncTime = file.modifiedTime;
                return this.fileId;
            }

            // Create new file
            const file = await gapi.client.drive.files.create({
                resource: {
                    name: DRIVE_FILE_NAME,
                    mimeType: 'application/json',
                    parents: [this.folderId]
                },
                fields: 'id, modifiedTime'
            });

            this.fileId = file.result.id;
            this.lastSyncTime = file.result.modifiedTime;
            return this.fileId;
        } catch (error) {
            console.error('Error finding/creating file:', error);
            throw error;
        }
    }

    async save(data) {
        await this.ensureInitialized();

        try {
            const jsonData = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            
            // Update file content
            await gapi.client.drive.files.update({
                fileId: this.fileId,
                uploadType: 'media',
                media: {
                    mimeType: 'application/json',
                    body: blob
                }
            });

            // Update last sync time
            const file = await gapi.client.drive.files.get({
                fileId: this.fileId,
                fields: 'modifiedTime'
            });

            this.lastSyncTime = file.result.modifiedTime;
            this.updateSyncStatus('success');
            
            return true;
        } catch (error) {
            console.error('Error saving to Drive:', error);
            this.updateSyncStatus('error');
            throw error;
        }
    }

    async load() {
        await this.ensureInitialized();

        try {
            const response = await gapi.client.drive.files.get({
                fileId: this.fileId,
                alt: 'media'
            });

            this.updateSyncStatus('success');
            return response.result;
        } catch (error) {
            if (error.status === 404) {
                // File doesn't exist yet, return empty data
                return { habits: [], version: '1.0.0' };
            }
            
            console.error('Error loading from Drive:', error);
            this.updateSyncStatus('error');
            throw error;
        }
    }

    async deleteFile() {
        if (!this.fileId) return;

        try {
            await gapi.client.drive.files.delete({
                fileId: this.fileId
            });

            this.fileId = null;
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }

    async getFileInfo() {
        if (!this.fileId) return null;

        try {
            const response = await gapi.client.drive.files.get({
                fileId: this.fileId,
                fields: 'id, name, size, modifiedTime, createdTime'
            });

            return response.result;
        } catch (error) {
            console.error('Error getting file info:', error);
            return null;
        }
    }

    async listBackups() {
        await this.ensureInitialized();

        try {
            const response = await gapi.client.drive.files.list({
                q: `name contains '${DRIVE_FILE_NAME.replace('.json', '')}' and '${this.folderId}' in parents and trashed=false`,
                fields: 'files(id, name, modifiedTime, size)',
                orderBy: 'modifiedTime desc',
                spaces: 'drive'
            });

            return response.result.files || [];
        } catch (error) {
            console.error('Error listing backups:', error);
            return [];
        }
    }

    async createBackup() {
        await this.ensureInitialized();

        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = `habitgrid-backup-${timestamp}.json`;
            
            const file = await gapi.client.drive.files.create({
                resource: {
                    name: backupName,
                    mimeType: 'application/json',
                    parents: [this.folderId]
                },
                fields: 'id'
            });

            return file.result.id;
        } catch (error) {
            console.error('Error creating backup:', error);
            throw error;
        }
    }

    async restoreFromBackup(fileId) {
        try {
            const response = await gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });

            return response.result;
        } catch (error) {
            console.error('Error restoring from backup:', error);
            throw error;
        }
    }

    startAutoSave(callback, interval = 30000) {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveInterval = setInterval(async () => {
            if (this.auth.isAuthenticated()) {
                try {
                    const data = callback();
                    if (data) {
                        await this.save(data);
                    }
                } catch (error) {
                    console.error('Auto-save failed:', error);
                }
            }
        }, interval);
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    updateSyncStatus(status) {
        const syncElement = document.getElementById('sync-status');
        if (!syncElement) return;

        const lastSavedElement = document.getElementById('last-saved');
        
        switch (status) {
            case 'success':
                syncElement.innerHTML = '<i class="fas fa-cloud-check"></i> Synced';
                syncElement.style.color = '#34A853';
                
                if (lastSavedElement) {
                    const now = new Date();
                    lastSavedElement.innerHTML = `
                        <i class="fas fa-save"></i> 
                        Saved ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    `;
                }
                break;
                
            case 'error':
                syncElement.innerHTML = '<i class="fas fa-cloud-slash"></i> Sync failed';
                syncElement.style.color = '#EA4335';
                break;
                
            case 'syncing':
                syncElement.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Syncing...';
                syncElement.style.color = '#4285F4';
                break;
                
            default:
                syncElement.innerHTML = '<i class="fas fa-cloud"></i> Ready to sync';
                syncElement.style.color = '#5F6368';
        }
    }

    getLastSyncTime() {
        return this.lastSyncTime;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize Google Drive API
export async function initializeDriveAPI() {
    return new Promise((resolve, reject) => {
        gapi.load('client', async () => {
            try {
                await gapi.client.init({
                    apiKey: 'YOUR_API_KEY', // Replace with your API key
                    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                    scope: 'https://www.googleapis.com/auth/drive.file'
                });
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}
