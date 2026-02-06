// Global variable to hold the parsed data
let parsedData = [];

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('txt-file');
    const downloadBtn = document.getElementById('download-btn');
    const output = document.getElementById('output');
    const fileName = document.getElementById('file-name');
    const delimiterSelect = document.getElementById('delimiter');

    // Show file name when selected
    fileInput.addEventListener('change', function(e) {
        if (fileInput.files.length) {
            fileName.textContent = `Selected: ${fileInput.files[0].name}`;
            parseTxt(fileInput.files[0]);
        } else {
            fileName.textContent = '';
        }
    });

    // Re-parse when delimiter changes
    delimiterSelect.addEventListener('change', function() {
        if (fileInput.files.length) {
            parseTxt(fileInput.files[0]);
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
            parseTxt(files[0]);
        }
    }

    // Function to get the delimiter character
    function getDelimiter() {
        const delimiterValue = delimiterSelect.value;
        switch(delimiterValue) {
            case 'tab':
                return '\t';
            case 'comma':
                return ',';
            case 'pipe':
                return '|';
            case 'semicolon':
                return ';';
            case 'space':
                return ' ';
            default:
                return '\t';
        }
    }

    // Function to parse the uploaded TXT file
    function parseTxt(file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const text = e.target.result;
                const delimiter = getDelimiter();

                // Split into lines
                const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

                if (lines.length === 0) {
                    displayError('No data found in file');
                    return;
                }

                // Parse the data
                parsedData = [];

                // Check if first line is a header by checking if first value looks like a header
                const firstLine = lines[0].split(delimiter).map(h => h.trim());
                const hasHeader = firstLine[0] && (
                    firstLine[0].toLowerCase().includes('item') ||
                    firstLine[0].toLowerCase().includes('sku') ||
                    firstLine[0].toLowerCase().includes('number') ||
                    firstLine.some(h => h.toLowerCase().includes('description'))
                );

                // Carolina Made standard headers (31 columns based on actual file structure)
                const carolinaMadeHeaders = [
                    'Item Number',                    // 1
                    'Style',                          // 2
                    'Mill',                           // 3
                    'Color Code',                     // 4
                    'Size Code',                      // 5
                    'Pieces per Case',                // 6
                    'Manufacturer',                   // 7
                    'BLANK1',                         // 8 - blank column
                    'Case Wt.',                       // 9
                    'BLANK2',                         // 10 - blank column
                    'Regular Piece Price',            // 11
                    'Regular Dozen Price',            // 12
                    'Regular Case Price',             // 13
                    'Currency',                       // 14
                    'Retail A Pricing',               // 15
                    'Color Category',                 // 16
                    'Color Description',              // 17
                    'Closeout',                       // 18
                    'Style Description',              // 19
                    'Shipping Warehouse',             // 20
                    'Piece Cube/Inches',              // 21
                    'Piece Weight',                   // 22
                    'Inventory Pieces',               // 23
                    'Customer Sale Piece Price',      // 24
                    'Customer Sale Dozen Price',      // 25
                    'Customer Sale Case Price',       // 26
                    'Sale End Date',                  // 27
                    'GTIN#',                          // 28
                    'Mill Discontinued',              // 29
                    'Web Color Description',          // 30
                    'Brand'                           // 31
                ];

                let headers;
                let startLine;

                if (hasHeader) {
                    // Use headers from file
                    headers = firstLine;
                    startLine = 1;
                } else {
                    // No header in file, use standard Carolina Made headers
                    headers = carolinaMadeHeaders;
                    startLine = 0;
                }

                // Convert to array of objects
                for (let i = startLine; i < lines.length; i++) {
                    const values = lines[i].split(delimiter);
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index] ? values[index].trim() : '';
                    });
                    parsedData.push(row);
                }

                // Display the result in a table (limit preview to first 100 rows for performance)
                displayResult(parsedData, headers);

                // Show the download button after parsing data
                downloadBtn.style.display = 'inline-block';
            } catch (error) {
                displayError('Error parsing file: ' + error.message);
            }
        };

        reader.onerror = function() {
            displayError('Error reading file');
        };

        reader.readAsText(file);
    }

    // Function to display error message
    function displayError(message) {
        output.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
        downloadBtn.style.display = 'none';
    }

    // Function to display the parsed and updated data
    function displayResult(data, headers) {
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

        // Limit preview to first 100 rows to prevent browser freeze
        const previewData = data.slice(0, 100);
        const totalRows = data.length;

        let tableHTML = '<table>';

        // Table headers
        tableHTML += '<thead><tr>';
        headers.forEach(header => {
            tableHTML += `<th>${header}</th>`;
        });
        tableHTML += '</tr></thead>';

        // Table body
        tableHTML += '<tbody>';
        previewData.forEach(row => {
            tableHTML += '<tr>';
            headers.forEach(header => {
                const value = row[header] || '';
                tableHTML += `<td>${value}</td>`;
            });
            tableHTML += '</tr>';
        });
        tableHTML += '</tbody></table>';

        if (totalRows > 100) {
            tableHTML += `<p style="padding: 1rem; text-align: center; color: #666;">Showing first 100 of ${totalRows} rows. Download CSV to see all data.</p>`;
        }

        output.innerHTML = tableHTML;
    }

    // Function to convert JSON data to CSV format
    function convertToCSV(data) {
        if (!data || data.length === 0) return '';

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
        a.setAttribute('download', 'converted_data.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
});
