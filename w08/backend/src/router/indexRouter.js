import { Hono } from 'hono'
import axios from "axios";
import xlsx from "xlsx";
import fs from "fs";

const indexRouter = new Hono();

const fileURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSuL_UXHtCxHoCj3jUUfJc0krlPPX8rLRmHfvyoZSTYZOaRpOjI_Ch0Ee56ohD3i9rOTidQM-waE5aZ/pub?output=csv";

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

        const jsonString = JSON.stringify(data, null, 2)
        fs.writeFileSync('output.json', jsonString, 'utf8');
        
        return c.json({ success: true, data });
    } catch (error) {
        console.error('Error downloading the file : ', error);
        return c.json({ error: error.message }, 500);
    }
});

export { indexRouter };