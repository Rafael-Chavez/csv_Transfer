// Global variable to hold the parsed data
let parsedData = []; 

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('excel-file');
    const downloadBtn = document.getElementById('download-btn');
    const output = document.getElementById('output');
    const fileName = document.getElementById('file-name');
    
    // Show file name when selected
    fileInput.addEventListener('change', function(e) {
        if (fileInput.files.length) {
            fileName.textContent = `Selected: ${fileInput.files[0].name}`;
            parseExcel(fileInput.files[0]);
        } else {
            fileName.textContent = '';
        }
    });
    
    // Handle drag and drop
    const dropZone = document.querySelector('.file-upload-label');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropZone.style.borderColor = '#0e88eb';
        dropZone.style.backgroundColor = 'rgba(14, 136, 235, 0.1)';
    }
    
    function unhighlight() {
        dropZone.style.borderColor = '#ccc';
        dropZone.style.backgroundColor = 'transparent';
    }
    
    dropZone.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length) {
            fileInput.files = files;
            fileName.textContent = `Selected: ${files[0].name}`;
            parseExcel(files[0]);
        }
    }
    
    // Function to parse the uploaded Excel file
    function parseExcel(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // Convert sheet to JSON
            parsedData = XLSX.utils.sheet_to_json(firstSheet);

            // Rename the columns and add fixed values
            parsedData = parsedData.map(row => {
                const cleanedProductName = row['Groupname'] ? row['Groupname'].replace(/^\d+\s*/, '') : '';
                const vendorProductCode = row['Groupname'] ? row['Groupname'].split(' ')[0] : '';
                
                return {
                    ProductName: cleanedProductName,
                    ProductDescription: '',
                    Brand: 'AS Colour (AUS)',
                    VendorSkuCode: row['Stockcode'],
                    VendorProductCode: vendorProductCode,
                    ColorName: row['Colourname'],
                    SizeCode: row['Sizename'],
                    SizeName: row['Sizename'],
                    LifestyleImage: row['Picture_url'],
                    PiecePrice: row['Price']
                };
            });
            
            // Display the result in a table
            displayResult(parsedData);
            
            // Show the download button after parsing data
            downloadBtn.style.display = 'inline-block';
        };

        reader.readAsArrayBuffer(file);
    }

    // Function to display the parsed and updated data
    function displayResult(data) {
        if (!data || data.length === 0) {
            output.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>No data found</h3>
                    <p>The file doesn't contain valid data in the expected format</p>
                </div>
            `;
            return;
        }

        const headers = Object.keys(data[0]);
        
        let tableHTML = '<table>';
        
        // Table headers
        tableHTML += '<thead><tr>';
        headers.forEach(header => {
            tableHTML += `<th>${header}</th>`;
        });
        tableHTML += '</tr></thead>';
        
        // Table body
        tableHTML += '<tbody>';
        data.forEach(row => {
            tableHTML += '<tr>';
            headers.forEach(header => {
                tableHTML += `<td>${row[header] || ''}</td>`;
            });
            tableHTML += '</tr>';
        });
        tableHTML += '</tbody></table>';
        
        output.innerHTML = tableHTML;
    }

    // Function to convert JSON data to CSV format
    function convertToCSV(data) {
        const headers = Object.keys(data[0]);
        const csvRows = [];

        // Add header row
        csvRows.push(headers.join(','));

        // Add data rows
        data.forEach(row => {
            const values = headers.map(header => {
                // Escape quotes and ensure proper CSV formatting
                const value = row[header] === null || row[header] === undefined ? '' : String(row[header]);
                return `"${value.replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
        });

        return csvRows.join('\n');
    }

    // Function to download the parsed data as a CSV file
    downloadBtn.addEventListener('click', function() {
        const csvContent = convertToCSV(parsedData);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', 'ascolour_parsed_data.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
});