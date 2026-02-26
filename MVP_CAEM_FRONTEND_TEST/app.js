// Global variables
let accessToken = '';
const API_BASE_URL = 'http://localhost:3000/';

// DOM Elements
const apiKeyInput = document.getElementById('apiKey');
const getTokenBtn = document.getElementById('getToken');
const tokenStatus = document.getElementById('tokenStatus');
const bankSelector = document.getElementById('bankSelector');
const runScreeningBtn = document.getElementById('runScreening');
const screeningResults = document.querySelector('#screeningResults tbody');
const resultsSection = document.getElementById('results');
const caseDetailSection = document.getElementById('caseDetail');
const backToListBtn = document.getElementById('backToList');
const caseData = document.getElementById('caseData');

// Event Listeners
getTokenBtn.addEventListener('click', getAccessToken);
runScreeningBtn.addEventListener('click', runScreening);
backToListBtn.addEventListener('click', () => {
    caseDetailSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
});

// Get JWT Token
async function getAccessToken() {
    getTokenBtn.disabled = true;
    getTokenBtn.innerHTML = '<span class="loading"></span> Getting Token';
    tokenStatus.textContent = '';
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        tokenStatus.textContent = 'Please enter an API key';
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey })
        });

        if (response.ok) {
            const data = await response.json();
            accessToken = data.token;
            tokenStatus.textContent = '✔ Token generated successfully';
        } else {
            const error = await response.json();
            tokenStatus.textContent = `Error: ${error.error}`;
        }
    } catch (err) {
        tokenStatus.textContent = 'Error connecting to API';
        console.error(err);
    }
}

// Run Screening Query
async function runScreening() {
    if (!accessToken) {
        alert('Please get an access token first');
        return;
    }

    const bankId = bankSelector.value;
    if (!bankId) {
        alert('Please select a bank');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}api/screening/${bankId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.ok) {
            const cases = await response.json();
            displayScreeningResults(cases);
        } else {
            const error = await response.json();
            alert(`Error: ${error.error}`);
        }
    } catch (err) {
        alert('Error connecting to API');
        console.error(err);
    }
}

// Display Screening Results
function displayScreeningResults(cases) {
    screeningResults.innerHTML = '';
    
    cases.forEach(caseItem => {
        const row = document.createElement('tr');
        
        Object.entries(caseItem).forEach(([key, value]) => {
            if (key !== 'entidad_remitente') { // Skip bank field we already filtered by
                const cell = document.createElement('td');
                cell.textContent = value || 'N/A';
                row.appendChild(cell);
            }
        });
        
        const actionCell = document.createElement('td');
        const viewBtn = document.createElement('button');
        viewBtn.textContent = 'View Details';
        viewBtn.addEventListener('click', () => viewCaseDetails(caseItem.case_id));
        actionCell.appendChild(viewBtn);
        row.appendChild(actionCell);
        
        screeningResults.appendChild(row);
    });
}

// View Case Details
async function viewCaseDetails(caseId) {
    try {
        const response = await fetch(`${API_BASE_URL}api/case/${caseId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.ok) {
            const caseDetails = await response.json();
            displayCaseDetails(caseDetails);
            resultsSection.classList.add('hidden');
            caseDetailSection.classList.remove('hidden');
        } else {
            const error = await response.json();
            alert(`Error: ${error.error}`);
        }
    } catch (err) {
        alert('Error connecting to API');
        console.error(err);
    }
}

// Display Case Details
function displayCaseDetails(caseDetails) {
    caseData.innerHTML = '';
    
    const detailList = document.createElement('dl');
    
    Object.entries(caseDetails).forEach(([key, value]) => {
        const dt = document.createElement('dt');
        dt.textContent = formatKey(key) + ':';
        dt.style.fontWeight = 'bold';
        dt.style.marginTop = '10px';
        
        const dd = document.createElement('dd');
        dd.textContent = value || 'N/A';
        
        detailList.appendChild(dt);
        detailList.appendChild(dd);
    });
    
    caseData.appendChild(detailList);
}

// Helper function to format object keys for display
function formatKey(key) {
    return key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}