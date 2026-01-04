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

            if (response.result.files &&
