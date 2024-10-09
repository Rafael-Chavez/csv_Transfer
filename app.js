// Function to handle when a CSV file is selected
document.getElementById('csv-file').addEventListener('change', function(event) {
    const file = event.target.files[0]; // Get the selected file
    if (file) {
        parseCSV(file);
    }
});

// Function to parse the CSV file and display the data
function parseCSV(file) {
    Papa.parse(file, {
        header: true, // Treat the first row as a header
        dynamicTyping: true, // Parse numbers and booleans instead of strings
        complete: function(results) {
            // Once parsing is complete, display the data
            displayResult(results.data);
        }
    });
}

// Function to display the CSV data
function displayResult(data) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = ''; // Clear previous content

    // Create a table to display the data
    const table = document.createElement('table');

    // Create table header row
    const headers = Object.keys(data[0]);
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.setAttribute('draggable', true); // Add draggable attribute
        th.addEventListener('dragstart', dragStart); // Add dragstart event listener
        th.addEventListener('drop', drop); // Add drop event listener
        th.addEventListener('dragover', dragOver); // Add dragover event listener
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

    // Add button to rename and reorder columns
    const renameButton = document.createElement('button');
    renameButton.textContent = 'Rename and Reorder Columns';
    renameButton.addEventListener('click', function() {
        renameReorderColumns(headers, data);
    });
    outputDiv.appendChild(renameButton);

    // Add download button for original CSV data
    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Download Original CSV';
    downloadButton.addEventListener('click', function() {
        downloadCSV(data, headers, 'original_data.csv');
    });
    outputDiv.appendChild(downloadButton);
}

// Drag and drop functions
function dragStart(event) {
    event.dataTransfer.setData("text/plain", event.target.textContent);
}

function dragOver(event) {
    event.preventDefault();
}

function drop(event) {
    event.preventDefault();
    const data = event.dataTransfer.getData("text/plain");
    const target = event.target.textContent;
    event.target.textContent = data;
    event.dataTransfer.setData("text/plain", target);
}

// Function to rename and reorder columns
function renameReorderColumns(headers, data) {
    const newHeaders = prompt('Enter new column names separated by comma (in desired order):').split(',');
    if (newHeaders.length !== headers.length) {
        alert('Number of columns must remain the same!');
        return;
    }
    const newData = data.map(row => {
        const newRow = {};
        newHeaders.forEach((header, index) => {
            newRow[header.trim()] = row[headers[index]];
        });
        return newRow;
    });
    displayResult(newData);
}

// Function to handle double-click on table headers
function handleHeaderDoubleClick(event) {
    const th = event.target;
    const currentText = th.textContent.trim();
    const newText = prompt('Enter new header text:', currentText);
    if (newText !== null) {
        th.textContent = newText.trim();
    }
}

// Add double-click event listener to table headers
headerRow.querySelectorAll('th').forEach(th => {
    th.addEventListener('dblclick', handleHeaderDoubleClick);
});


// Function to download the CSV file
function downloadCSV(data, headers, filename) {
    const csvContent = Papa.unparse(data, { header: true, columns: headers });
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
