import { Hono } from 'hono'
import axios from "axios";
import xlsx from "xlsx";
import fs from "fs";

const indexRouter = new Hono();

const SHEET_ID   = "10ows4irK8L1lG0L_JidyfpLcAm3f8_LQrkiQbPz6LN8";
const SHEET_BASE = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export`;
const fileURL    = `${SHEET_BASE}?format=csv`;

// GET /api/download  — fetch CSV → parse → return JSON + write output.json
indexRouter.get('/download', async (c) => {
    try {
        const response = await axios({
            method: 'get',
            url: fileURL,
            responseType: 'arraybuffer'
        });
        
        fs.writeFileSync('dowloaded.xlsx', response.data);
        const workbook = xlsx.readFile('dowloaded.xlsx');
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);
        console.log(data);

        const jsonString = JSON.stringify(data, null, 2);
        fs.writeFileSync('output.json', jsonString, 'utf8');
        
        return c.json({ success: true, data });
    } catch (error) {
        console.error('Error downloading the file : ', error);
        return c.json({ error: error.message }, 500);
    }
});

// GET /api/raw/csv  — proxy Google Sheets CSV (fixes browser CORS)
indexRouter.get('/raw/csv', async (c) => {
    try {
        const response = await axios.get(`${SHEET_BASE}?format=csv`, { responseType: 'text' });
        return c.text(response.data);
    } catch (error) {
        return c.text('Error fetching CSV: ' + error.message, 500);
    }
});

// GET /api/raw/tsv  — proxy Google Sheets TSV (fixes browser CORS)
indexRouter.get('/raw/tsv', async (c) => {
    try {
        const response = await axios.get(`${SHEET_BASE}?format=tsv`, { responseType: 'text' });
        return c.text(response.data);
    } catch (error) {
        return c.text('Error fetching TSV: ' + error.message, 500);
    }
});

// POST /api/save  — save edited data to output.json
indexRouter.post('/save', async (c) => {
    try {
        const body = await c.req.json();
        const data = body.data || [];
        const jsonString = JSON.stringify(data, null, 2);
        fs.writeFileSync('output.json', jsonString, 'utf8');
        console.log(`[Save] ${data.length} rows written to output.json`);
        return c.json({ success: true, count: data.length });
    } catch (error) {
        console.error('Error saving data:', error);
        return c.json({ error: error.message }, 500);
    }
});

export { indexRouter };