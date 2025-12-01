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

    // Standard header order for Carolina Made supplier files
    const standardHeaders = [
        'Item Number',
        'Style',
        'Mill',
        'Color Code',
        'Size Code',
        'Pieces per Case',
        'Manufacturer',
        '',
        'Case Wt.',
        ' ',
        'Regular Piece Price',
        'Regular Dozen Price',
        'Regular Case Price',
        'Currency',
        'Retail A Pricing',
        'Color Category',
        'Color Description',
        'Closeout',
        'Style Description',
        'Shipping Warehouse',
        'Piece Cube/Inches',
        'Piece Weight',
        'Inventory Pieces',
        'Customer Sale Piece Price',
        'Customer Sale Dozen Price',
        'Customer Sale Case Price',
        'Sale End Date',
        'GTIN#',
        'Mill Discontinued',
        'Web Color Description',
        'Brand'
    ];

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

                // Parse raw data and map to standard headers
                rawData = [];

                // Skip first line if it's a header, or process all lines as data
                const startLine = 0; // Treat all lines as data

                // Convert to array of objects using standard headers
                // Based on actual supplier data format from Carolina Made
                for (let i = startLine; i < lines.length; i++) {
                    const values = lines[i].split(delimiter);
                    const row = {};

                    // Map based on actual column positions from supplier CSV
                    row['Item Number'] = values[0] ? values[0].trim() : '';           // IC47BATHYXS
                    row['Style'] = values[1] ? values[1].trim() : '';                 // IC47B
                    row['Mill'] = values[2] ? values[2].trim() : '';                  // 00001
                    row['Color Code'] = values[3] ? values[3].trim() : '';            // ATH
                    row['Size Code'] = values[4] ? values[4].trim() : '';             // YXS
                    row['Pieces per Case'] = values[5] ? values[5].trim() : '';       // 072
                    row['Manufacturer'] = values[6] ? values[6].trim() : '';          // (empty)
                    row[''] = '';                                                      // BLANK column
                    row['Case Wt.'] = values[7] ? values[7].trim() : '';              // 12.30
                    row[' '] = '';                                                     // BLANK column
                    row['Regular Piece Price'] = values[8] ? values[8].trim() : '';   // 3.46
                    row['Regular Dozen Price'] = values[9] ? values[9].trim() : '';   // 2.96
                    row['Regular Case Price'] = values[10] ? values[10].trim() : '';  // 2.79
                    row['Currency'] = values[11] ? values[11].trim() : '';            // USD
                    row['Retail A Pricing'] = values[12] ? values[12].trim() : '';    // 5.58
                    row['Color Category'] = values[13] ? values[13].trim() : '';      // H
                    row['Color Description'] = values[14] ? values[14].trim() : '';   // ATHLETIC HEATHER
                    row['Closeout'] = '';                                              // Always empty
                    row['Style Description'] = values[15] ? values[15].trim() : '';   // Fruit of the Loom Iconic Youth Short Sleeve T
                    row['Shipping Warehouse'] = values[16] ? values[16].trim() : '';  // NC
                    row['Piece Cube/Inches'] = values[17] ? values[17].trim() : '';   // 30.32
                    row['Piece Weight'] = values[18] ? values[18].trim() : '';        // .1500
                    row['Inventory Pieces'] = values[19] ? values[19].trim() : '';    // 0000036
                    row['Customer Sale Piece Price'] = values[20] ? values[20].trim() : ''; // 0.00
                    row['Customer Sale Dozen Price'] = values[21] ? values[21].trim() : ''; // 2.29
                    row['Customer Sale Case Price'] = '';                              // Always empty
                    row['Sale End Date'] = values[22] ? values[22].trim() : '';       // 07/25/25
                    row['GTIN#'] = values[23] ? values[23].trim() : '';               // 00885306946654
                    row['Mill Discontinued'] = values[24] ? values[24].trim() : '';   // D
                    row['Web Color Description'] = '';                                 // Always empty
                    row['Brand'] = values[25] ? values[25].trim() : '';               // Fruit of the Loom

                    rawData.push(row);
                }

                // Reset parsed state
                isParsed = false;
                parsedData = [];

                // Display the raw result in a table with standard headers
                displayResult(rawData, standardHeaders);

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
        parsedData = rawData.map(row => {
            return {
                ProductName: row['Style Description'] || '',
                ProductDescription: '',
                BrandName: row['Brand'] || '',
                VendorProductCode: row['Style'] || '',
                VendorSkuCode: row['Item Number'] || '',
                ColorName: row['Color Description'] || '',
                SizeCode: row['Size Code'] || '',
                SizeName: row['Size Code'] || '',
                PiecePrice: row['Regular Piece Price'] || '',
                DuzenPrice: row['Regular Dozen Price'] || '',
                CasePrice: row['Regular Case Price'] || '',
                CasePriceQTY: row['Pieces per Case'] || ''
            };
        });

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
