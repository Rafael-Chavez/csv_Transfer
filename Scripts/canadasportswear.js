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
        const lines = csv.split('\n');
        
        // Parse header - handle quoted fields
        const headers = parseCSVLine(lines[0]);
        
        // Parse data rows
        parsedData = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            const row = parseCSVLine(lines[i]);
            if (row.length === 0) continue;
            
            // Get header indices
            const getIndex = (header) => headers.findIndex(h => h.trim().toLowerCase() === header.toLowerCase());
            
            const sku = row[getIndex('SKU')] || '';
            const upc = row[getIndex('UPC')] || '';
            const productName = row[getIndex('Title')] || '';
            const category = row[getIndex('Category')] || '';
            
            // Map the fields from Canada Sportswear format to desired output format
            const mappedRow = {
                ProductName: productName,
                ProductDescription: row[getIndex('Description')] || '',
                Brand: row[getIndex('Brand')] || 'CSW 24/7',
                DNProductType: category,
                VendorProductCode: extractProductCode(sku),
                VendorSkuCode: upc,
                ColorName: row[getIndex('Color')] || '',
                SizeCode: row[getIndex('Size')] || '',
                SizeName: row[getIndex('Size')] || '',
                ColorPaletteName: 'colors_HEX.csv',
                SizeTable: determineSizeTable(productName),
                SizeChartImage: 'size_chart_image.jpg',
                LifestyleImage: '',
                ViewSrc1: '',
                ViewSrc2: '',
                ViewSrc3: '',
                ViewSrc4: '',
                ProductViews: '',
                PiecePrice: '',
                DozenPrice: '',
                CasePrice: '',
                DozenPriceQty: '',
                CasePriceQty: row[getIndex('qty per case')] || '',
                Category1: '',
                Category2: '',
                ShippingLength: row[getIndex('Case Length')] || '',
                ShippingWidth: row[getIndex('Case Width')] || '',
                ShippingHeight: row[getIndex('Case Height')] || '',
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
            result.push(current.trim().replace(/"/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim().replace(/"/g, ''));
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

// Function to convert JSON data to TSV format (tab-separated)
function convertToCSV(data) {
    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join('\t'));

    // Add data rows
    data.forEach(row => {
        const values = headers.map(header => {
            let value = row[header] || '';
            // Replace problematic characters
            value = value.replace(/\t/g, ' ').replace(/\n/g, ' ');
            return value;
        });
        csvRows.push(values.join('\t'));
    });

    return csvRows.join('\n');
}

// Function to create and download the file
function downloadCSV(csvContent) {
    const blob = new Blob([csvContent], { type: 'text/tab-separated-values' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'canada_sportswear_converted.csv');
    a.click();
}
