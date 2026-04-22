// Global variables to hold the parsed data
let parsedData = [];
let currentDisplayData = [];
let currentHeaders = [];

document.getElementById('csv-file').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('file-name').textContent = `Selected: ${file.name}`;
        parseCSV(file);
    }
});

// Search functionality
document.getElementById('search-input').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    filterTable(searchTerm);
});

// Function to parse the uploaded CSV file
function parseCSV(file) {
    const reader = new FileReader();

    reader.onload = function(e) {
        const csv = e.target.result;
        // Don't split by newlines - we need to parse properly handling quoted multi-line fields
        const lines = parseCSVRows(csv);

        // Parse header - handle quoted fields
        const headers = parseCSVLine(lines[0]);

        // Log headers for debugging
        console.log('Headers found:', headers);
        console.log('Total headers:', headers.length);

        // Parse data rows
        parsedData = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;

            const row = parseCSVLine(lines[i]);
            if (row.length === 0) continue;

            // Debug: Log row structure for problematic rows
            if (i >= 12 && i <= 15) {
                console.log(`Row ${i + 1}:`, row);
                console.log(`Row ${i + 1} field count:`, row.length);
            }

            // Get header indices - case insensitive matching
            const getIndex = (header) => headers.findIndex(h => h.trim().toLowerCase() === header.toLowerCase());

            // Try multiple possible column name variations
            const getIndexMultiple = (...possibleNames) => {
                for (let name of possibleNames) {
                    const idx = getIndex(name);
                    if (idx !== -1) return idx;
                }
                return -1;
            };

            const sku = row[getIndex('SKU')] || '';
            const upc = row[getIndex('UPC')] || '';
            const productName = row[getIndexMultiple('TitleEN', 'Title', 'Product Name')] || '';
            const category = row[getIndexMultiple('CategoryEN', 'Category')] || '';

            // Try to find price columns with multiple possible names
            const piecePriceIdx = getIndexMultiple('LEVEL 1 PRICE', 'Piece Price', 'Price', 'Unit Price');
            const dozenPriceIdx = getIndexMultiple('Dozen Price', '12 Price');
            const casePriceIdx = getIndexMultiple('Case Price', 'Cs Price');
            const caseQtyIdx = getIndexMultiple('# of pcs/case', 'qty per case', 'Qty Per Case', 'Case Qty', 'Pieces Per Case');

            // Map the fields from Canada Sportswear format to desired output format
            const mappedRow = {
                ProductName: productName,
                ProductDescription: row[getIndexMultiple('DescriptionEN', 'Description')] || '',
                Brand: row[getIndex('Brand')] || 'CSW 24/7',
                DNProductType: category,
                VendorProductCode: extractProductCode(sku),
                VendorSkuCode: upc,
                ColorName: row[getIndexMultiple('ColorEN', 'Color')] || '',
                SizeCode: row[getIndexMultiple('SizeEN', 'Size')] || '',
                SizeName: row[getIndexMultiple('SizeEN', 'Size')] || '',
                ColorPaletteName: 'colors_HEX.csv',
                SizeTable: determineSizeTable(productName),
                SizeChartImage: 'size_chart_image.jpg',
                LifestyleImage: '',
                ViewSrc1: row[getIndexMultiple('images link', 'Image Link', 'Image')] || '',
                ViewSrc2: '',
                ViewSrc3: '',
                ViewSrc4: '',
                ProductViews: '',
                PiecePrice: piecePriceIdx !== -1 ? row[piecePriceIdx] || '' : '',
                DozenPrice: dozenPriceIdx !== -1 ? row[dozenPriceIdx] || '' : '',
                CasePrice: casePriceIdx !== -1 ? row[casePriceIdx] || '' : '',
                DozenPriceQty: '12',
                CasePriceQty: caseQtyIdx !== -1 ? row[caseQtyIdx] || '' : '',
                Category1: '',
                Category2: '',
                ShippingLength: '',
                ShippingWidth: '',
                ShippingHeight: '',
                ShippingWeight: row[getIndex('Net Weight')] || ''
            };

            parsedData.push(mappedRow);
        }

        // Display the result in a table
        displayResult(parsedData);

        // Show download button after parsing data
        document.getElementById('download-btn').style.display = 'inline-block';
    };

    reader.readAsText(file);
}

// Function to parse CSV into rows, handling multi-line quoted fields
function parseCSVRows(csv) {
    const rows = [];
    let currentRow = '';
    let insideQuotes = false;

    for (let i = 0; i < csv.length; i++) {
        const char = csv[i];
        const nextChar = csv[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                currentRow += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
            currentRow += '"';
        } else if (char === '\n' && !insideQuotes) {
            // End of row
            if (currentRow.trim()) {
                rows.push(currentRow);
            }
            currentRow = '';
        } else if (char === '\r' && nextChar === '\n' && !insideQuotes) {
            // Windows line ending - skip \r, let \n be handled next iteration
            continue;
        } else if (char === '\r' && !insideQuotes) {
            // Mac line ending
            if (currentRow.trim()) {
                rows.push(currentRow);
            }
            currentRow = '';
        } else {
            currentRow += char;
        }
    }

    // Push the last row if exists
    if (currentRow.trim()) {
        rows.push(currentRow);
    }

    return rows;
}

// Function to parse CSV line handling quoted fields
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    // Push the last field
    result.push(current.trim());
    return result;
}

// Function to extract product code (remove color and size)
function extractProductCode(sku) {
    // Extract the base product code (format: F06006 from F06006-BLA-AS)
    const parts = sku.split('-');
    return parts[0] || sku;
}

// Function to determine size table based on product name
function determineSizeTable(productName) {
    if (productName.toLowerCase().includes('youth') || productName.toLowerCase().includes('kid')) {
        return 'sizes_apparel_247-Youth.csv';
    } else if (productName.toLowerCase().includes('adult')) {
        return 'sizes_apparel_247-Adult.csv';
    }
    return 'sizes_apparel_247-Adult.csv'; // Default
}

// Function to display the parsed and updated data
function displayResult(data) {
    const outputDiv = document.getElementById('output');
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('search-input');
    outputDiv.innerHTML = ''; // Clear previous content

    if (data.length === 0) {
        outputDiv.innerHTML = '<div class="empty-state"><i class="fas fa-table"></i><h3>No data to display</h3><p>Upload a CSV file to see the data here</p></div>';
        searchContainer.style.display = 'none';
        return;
    }

    // Store for search functionality
    currentDisplayData = data;
    currentHeaders = Object.keys(data[0]);

    // Limit preview to first 100 rows to prevent browser freeze
    const previewData = data.slice(0, 100);
    const totalRows = data.length;

    // Create a table
    const table = document.createElement('table');

    // Create table header
    const thead = document.createElement('thead');
    const headers = currentHeaders;
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');

    // Create table rows with cell values
    previewData.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header];
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    outputDiv.appendChild(table);

    if (totalRows > 100) {
        const message = document.createElement('p');
        message.style.padding = '1rem';
        message.style.textAlign = 'center';
        message.style.color = '#666';
        message.textContent = `Showing first 100 of ${totalRows} rows. Download CSV to see all data.`;
        outputDiv.appendChild(message);
    }

    // Show search container
    searchContainer.style.display = 'block';
    searchInput.value = ''; // Clear previous search
}

function filterTable(searchTerm) {
    const table = document.querySelector('#output table');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    // Clear existing rows
    tbody.innerHTML = '';

    // Filter data based on ProductName
    const filteredData = currentDisplayData.filter(row => 
        row.ProductName && row.ProductName.toLowerCase().includes(searchTerm)
    );

    // Show all matching results when searching, otherwise show first 100
    const displayData = searchTerm ? filteredData : currentDisplayData.slice(0, 100);

    // Create new rows
    displayData.forEach(row => {
        const tr = document.createElement('tr');
        currentHeaders.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] || '';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    // Update message if needed
    let messageElement = document.querySelector('#output p');
    if (!messageElement) {
        messageElement = document.createElement('p');
        messageElement.style.padding = '1rem';
        messageElement.style.textAlign = 'center';
        messageElement.style.color = '#666';
        document.getElementById('output').appendChild(messageElement);
    }

    if (searchTerm && filteredData.length === 0) {
        messageElement.textContent = 'No products found matching your search.';
    } else if (searchTerm) {
        messageElement.textContent = `Found ${filteredData.length} matching products.`;
    } else if (currentDisplayData.length > 100) {
        messageElement.textContent = `Showing first 100 of ${currentDisplayData.length} rows. Download CSV to see all data.`;
    } else {
        messageElement.textContent = '';
    }
}

// Function to download the parsed data as a CSV file
document.getElementById('download-btn').addEventListener('click', function() {
    const csvContent = convertToCSV(parsedData);
    downloadCSV(csvContent);
});

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

// Function to create and download the file
function downloadCSV(csvContent) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'canada_sportswear_converted.csv');
    a.click();
}
