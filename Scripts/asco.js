let parsedData = []; // Global variable to hold the parsed data

document.getElementById('excel-file').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        parseExcel(file);
    }
});

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
            return {
                ProductName: row['Description'], // Rename Description -> ProductName
                ProductDescription: '',
                Brand: 'AS Colour (AUS)',  // Fixed value for Supplier
                VendorSkuCode: row['Stockcode'], // Rename Stockcode -> VendorProductCode
                VendorProductCode: row['Groupname'],
                ColorName: row['Colourname'], // Rename Colourname -> ColorName
                SizeCode: row['Sizename'],
                SizeName: row['Sizename'],
                LifestyleImage: row['Picture_url'],
                PiecePrice: row['Price']  // Rename Price -> VendorCost
            };
        });

        // Display the result in a table
        displayResult(parsedData);
        
        // Show the download button after parsing data
        document.getElementById('download-btn').style.display = 'inline-block';
    };

    reader.readAsArrayBuffer(file);
}

// Function to display the parsed and updated data
function displayResult(data) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = ''; // Clear previous content

    // Create a table
    const table = document.createElement('table');

    // Create table header
    const headers = Object.keys(data[0]);
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Create table rows with cell values
    data.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header];
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });

    outputDiv.appendChild(table);
}

// Function to convert JSON data to CSV format
function convertToCSV(data) {
    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    data.forEach(row => {
        const values = headers.map(header => `"${row[header] || ''}"`);
        csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
}

// Function to download the parsed data as a CSV file
document.getElementById('download-btn').addEventListener('click', function() {
    const csvContent = convertToCSV(parsedData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'parsed_data.csv');
    a.click();
});