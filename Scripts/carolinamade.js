// Global variables
let rawData = [];
let parsedData = [];
let isParsed = false;
let currentDisplayData = [];
let currentHeaders = [];

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('data-file');
    const parseBtn = document.getElementById('parse-btn');
    const resetBtn = document.getElementById('reset-btn');
    const downloadBtn = document.getElementById('download-btn');
    const output = document.getElementById('output');
    const fileName = document.getElementById('file-name');
    const delimiterSelect = document.getElementById('delimiter');
    const loadingIndicator = document.getElementById('loading-indicator');
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('search-input');

    // Show file name when selected
    fileInput.addEventListener('change', function(e) {
        if (fileInput.files.length) {
            fileName.textContent = `Selected: ${fileInput.files[0].name}`;
            parseFile(fileInput.files[0]);
        } else {
            fileName.textContent = '';
        }
    });

    // Re-parse when delimiter changes
    delimiterSelect.addEventListener('change', function() {
        if (fileInput.files.length) {
            parseFile(fileInput.files[0]);
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
            parseFile(files[0]);
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
                return ',';
        }
    }

    // Function to parse the uploaded file (raw data)
    function parseFile(file) {
        // Show loading indicator
        loadingIndicator.style.display = 'flex';
        parseBtn.style.display = 'none';
        resetBtn.style.display = 'none';
        downloadBtn.style.display = 'none';
        searchContainer.style.display = 'none';

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

                // Parse raw data dynamically from headers
                rawData = [];

                // Parse CSV properly handling quoted values
                function parseCSVLine(line, delimiter) {
                    const values = [];
                    let current = '';
                    let inQuotes = false;

                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        const nextChar = line[i + 1];

                        if (char === '"') {
                            if (inQuotes && nextChar === '"') {
                                // Escaped quote
                                current += '"';
                                i++;
                            } else {
                                // Toggle quote state
                                inQuotes = !inQuotes;
                            }
                        } else if (char === delimiter && !inQuotes) {
                            // End of field
                            values.push(current);
                            current = '';
                        } else {
                            current += char;
                        }
                    }
                    values.push(current);
                    return values.map(v => v.trim());
                }

                // Read headers from first line
                const headers = parseCSVLine(lines[0], delimiter);

                // Debug logging
                console.log('Delimiter:', delimiter);
                console.log('Headers found:', headers);
                console.log('First data line:', lines[1]);
                if (lines.length > 1) {
                    const firstValues = parseCSVLine(lines[1], delimiter);
                    console.log('First row values:', firstValues);
                }

                // Convert to array of objects using headers from file
                for (let i = 1; i < lines.length; i++) {
                    const values = parseCSVLine(lines[i], delimiter);
                    const row = {};

                    headers.forEach((header, index) => {
                        row[header] = values[index] ? values[index] : '';
                    });

                    rawData.push(row);
                }

                // Debug: check first row of rawData
                if (rawData.length > 0) {
                    console.log('First rawData row:', rawData[0]);
                }

                // Reset parsed state
                isParsed = false;
                parsedData = [];

                // Display the raw result in a table with headers from file
                displayResult(rawData, headers);

                // Hide loading, show buttons
                loadingIndicator.style.display = 'none';
                parseBtn.style.display = 'inline-block';
                downloadBtn.style.display = 'none';
                resetBtn.style.display = 'none';
            } catch (error) {
                displayError('Error parsing file: ' + error.message);
            }
        };

        reader.onerror = function() {
            displayError('Error reading file');
        };

        reader.readAsText(file);
    }

    // Parse button click handler
    parseBtn.addEventListener('click', function() {
        if (rawData.length === 0) {
            displayError('No data to parse');
            return;
        }

        // Transform to DecoNetwork format (similar to Uneek)
        console.log('=== Starting DecoNetwork Transformation ===');
        console.log('Raw data first row:', rawData[0]);
        console.log('Raw data keys:', Object.keys(rawData[0]));

        // Check what each field maps to
        console.log('Style Description value:', rawData[0]['Style Description']);
        console.log('Brand value:', rawData[0]['Brand']);
        console.log('Color Code value:', rawData[0]['Color Code']);
        console.log('Item Number value:', rawData[0]['Item Number']);

        parsedData = rawData.map(row => {
            const result = {
                ProductName: row['Style Description'] || '',
                ProductDescription: '',
                Brand: row['Brand'] || '',
                VendorProductCode: row['Style'] || '',
                VendorSkuCode: row['Item Number'] || '',
                ColorName: row['Color Description'] || row['Color Code'] || '',
                SizeCode: row['Size Code'] || '',
                SizeName: row['Size Code'] || '',
                PiecePrice: row['Regular Piece Price'] || '',
                DozenPrice: row['Regular Dozen Price'] || '',
                CasePrice: row['Regular Case Price'] || '',
                CasePriceQTY: row['Pieces per Case'] || '',
                ShippingWeight: row['Piece Weight'] || ''
            };
            return result;
        });

        console.log('Parsed data first row:', parsedData[0]);

        // Display parsed data
        isParsed = true;
        const parsedHeaders = Object.keys(parsedData[0]);
        displayResult(parsedData, parsedHeaders);

        // Show download and reset buttons, hide parse button
        parseBtn.style.display = 'none';
        resetBtn.style.display = 'inline-block';
        downloadBtn.style.display = 'inline-block';
    });

    // Reset button handler
    resetBtn.addEventListener('click', function() {
        if (rawData.length > 0) {
            isParsed = false;
            parsedData = [];
            const headers = Object.keys(rawData[0]);
            displayResult(rawData, headers);

            // Update button visibility
            parseBtn.style.display = 'inline-block';
            resetBtn.style.display = 'none';
            downloadBtn.style.display = 'none';
        }
    });

    // Search functionality
    searchInput.addEventListener('input', function() {
        const searchTerm = searchInput.value.toLowerCase();
        filterTable(searchTerm);
    });

    function filterTable(searchTerm) {
        const table = output.querySelector('table');
        if (!table) return;

        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                row.style.display = '';
                row.classList.toggle('highlight-row', searchTerm !== '');
            } else {
                row.style.display = 'none';
                row.classList.remove('highlight-row');
            }
        });
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
        parseBtn.style.display = 'none';
        downloadBtn.style.display = 'none';
        resetBtn.style.display = 'none';
        searchContainer.style.display = 'none';
        loadingIndicator.style.display = 'none';
    }

    // Function to display the data
    function displayResult(data, headers) {
        if (!data || data.length === 0) {
            output.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>No data found</h3>
                    <p>The file doesn't contain valid data in the expected format</p>
                </div>
            `;
            searchContainer.style.display = 'none';
            return;
        }

        // Store for search functionality
        currentDisplayData = data;
        currentHeaders = headers;

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

        // Show search container
        searchContainer.style.display = 'block';
        searchInput.value = ''; // Clear previous search
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
                // Get value without adding quotes
                const value = row[header] === null || row[header] === undefined ? '' : String(row[header]);
                // Only escape commas by wrapping in quotes if value contains comma
                if (value.includes(',')) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvRows.push(values.join(','));
        });

        return csvRows.join('\n');
    }

    // Function to download the parsed data as a CSV file
    downloadBtn.addEventListener('click', function() {
        const dataToDownload = isParsed ? parsedData : rawData;
        const csvContent = convertToCSV(dataToDownload);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', 'carolinamade_parsed_data.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
});
