import { google } from 'googleapis';
import type { Issue } from '@shared/schema';

const GOOGLE_SHEETS_PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_SHEETS_CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;

// Gracefully handle missing Google Sheets credentials during development
if (!GOOGLE_SHEETS_PRIVATE_KEY || !GOOGLE_SHEETS_CLIENT_EMAIL || !GOOGLE_SHEETS_ID) {
  console.warn('Google Sheets credentials not configured. Google Sheets sync will be disabled.');
}

class GoogleSheetsService {
  private sheets: any;
  private auth: any;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = !!(GOOGLE_SHEETS_PRIVATE_KEY && GOOGLE_SHEETS_CLIENT_EMAIL && GOOGLE_SHEETS_ID);
    
    if (this.isEnabled) {
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          private_key: GOOGLE_SHEETS_PRIVATE_KEY,
          client_email: GOOGLE_SHEETS_CLIENT_EMAIL,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    }
  }

  async syncIssueToSheets(issue: Issue, action: 'create' | 'update' | 'delete') {
    if (!this.isEnabled) {
      console.log('Google Sheets sync skipped - credentials not configured');
      return;
    }
    
    try {
      const range = 'Issues!A:H'; // Columns: Title, Type, Description, Impact, Status, Expected Fix Date, Created By, Updated By
      
      if (action === 'create') {
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: GOOGLE_SHEETS_ID,
          range,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[
              issue.title,
              issue.type,
              issue.description,
              issue.impact,
              issue.status,
              issue.expectedFixDate ? issue.expectedFixDate.toISOString().split('T')[0] : '',
              issue.createdBy || '',
              issue.updatedBy || '',
            ]],
          },
        });
      } else if (action === 'update') {
        // For updates, we need to find the row and update it
        const response = await this.sheets.spreadsheets.values.get({
          spreadsheetId: GOOGLE_SHEETS_ID,
          range,
        });
        
        const rows = response.data.values || [];
        let rowIndex = -1;
        
        // Find the row by title (assuming titles are unique)
        for (let i = 1; i < rows.length; i++) { // Skip header row
          if (rows[i][0] === issue.title) {
            rowIndex = i + 1; // 1-based indexing
            break;
          }
        }
        
        if (rowIndex > 0) {
          await this.sheets.spreadsheets.values.update({
            spreadsheetId: GOOGLE_SHEETS_ID,
            range: `Issues!A${rowIndex}:H${rowIndex}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[
                issue.title,
                issue.type,
                issue.description,
                issue.impact,
                issue.status,
                issue.expectedFixDate ? issue.expectedFixDate.toISOString().split('T')[0] : '',
                issue.createdBy || '',
                issue.updatedBy || '',
              ]],
            },
          });
        }
      } else if (action === 'delete') {
        // For deletes, we need to find and remove the row
        const response = await this.sheets.spreadsheets.values.get({
          spreadsheetId: GOOGLE_SHEETS_ID,
          range,
        });
        
        const rows = response.data.values || [];
        let rowIndex = -1;
        
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0] === issue.title) {
            rowIndex = i;
            break;
          }
        }
        
        if (rowIndex > 0) {
          await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: GOOGLE_SHEETS_ID,
            requestBody: {
              requests: [{
                deleteDimension: {
                  range: {
                    sheetId: 0, // Assuming first sheet
                    dimension: 'ROWS',
                    startIndex: rowIndex,
                    endIndex: rowIndex + 1,
                  },
                },
              }],
            },
          });
        }
      }
    } catch (error) {
      console.error('Error syncing to Google Sheets:', error);
      throw error;
    }
  }

  async initializeSheet() {
    if (!this.isEnabled) {
      console.log('Google Sheets initialization skipped - credentials not configured');
      return;
    }
    
    try {
      // Check if the sheet exists and has headers
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEETS_ID,
        range: 'Issues!A1:H1',
      });
      
      if (!response.data.values || response.data.values.length === 0) {
        // Add headers if they don't exist
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: GOOGLE_SHEETS_ID,
          range: 'Issues!A1:H1',
          valueInputOption: 'RAW',
          requestBody: {
            values: [[
              'Title',
              'Type',
              'Description',
              'Impact',
              'Status',
              'Expected Fix Date',
              'Created By',
              'Updated By',
            ]],
          },
        });
      }
    } catch (error) {
      console.error('Error initializing Google Sheets:', error);
      throw error;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
