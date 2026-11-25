
/* ==========================================
   FILESURE - CIN & LLPIN CHECKER
   Validation Engine
========================================== */

// 1. Select HTML elements

const cinInput = document.getElementById("cinInput");
const lineCount = document.getElementById("lineCount");
const inputMessage = document.getElementById("inputMessage");

const validateBtn = document.getElementById("validateBtn");
const clearBtn = document.getElementById("clearBtn");
const sampleBtn = document.getElementById("sampleBtn");
const exportBtn = document.getElementById("exportBtn");

const resultsSection = document.getElementById("resultsSection");
const resultsList = document.getElementById("resultsList");
const resultsMessage = document.getElementById("resultsMessage");
const resultsSummary = document.getElementById("resultsSummary");

const totalCount = document.getElementById("totalCount");
const validCount = document.getElementById("validCount");
const invalidCount = document.getElementById("invalidCount");
const duplicateCount = document.getElementById("duplicateCount");


// 2. State code reference

const states = {
    AN: "Andaman and Nicobar Islands",
    AP: "Andhra Pradesh",
    AR: "Arunachal Pradesh",
    AS: "Assam",
    BR: "Bihar",
    CH: "Chandigarh",
    CG: "Chhattisgarh",
    DD: "Dadra and Nagar Haveli and Daman and Diu",
    DL: "Delhi",
    GA: "Goa",
    GJ: "Gujarat",
    HR: "Haryana",
    HP: "Himachal Pradesh",
    JK: "Jammu and Kashmir",
    JH: "Jharkhand",
    KA: "Karnataka",
    KL: "Kerala",
    LA: "Ladakh",
    LD: "Lakshadweep",
    MH: "Maharashtra",
    ML: "Meghalaya",
    MN: "Manipur",
    MP: "Madhya Pradesh",
    MZ: "Mizoram",
    NL: "Nagaland",
    OD: "Odisha",
    PB: "Punjab",
    PY: "Puducherry",
    RJ: "Rajasthan",
    SK: "Sikkim",
    TN: "Tamil Nadu",
    TS: "Telangana",
    TR: "Tripura",
    UP: "Uttar Pradesh",
    UK: "Uttarakhand",
    WB: "West Bengal"
};


// 3. Company type reference

const companyTypes = {
    PLC: "Public Limited Company",
    PTC: "Private Limited Company",
    OPC: "One Person Company",
    GOI: "Union Government Company",
    SGC: "State Government Company",
    FLC: "Foreign Public Limited Company",
    FTC: "Foreign Private Limited Company",
    ULL: "Unlimited Liability Public Company",
    ULT: "Unlimited Liability Private Company",
    GAP: "Guarantee and Association Public Company",
    GAT: "Guarantee and Association Private Company",
    NPL: "Section 8 / Non-profit Company"
};


// 4. Count input entries

function getEntries() {
    return cinInput.value
        .split(/\r?\n/)
        .map(value => value.trim())
        .filter(value => value.length > 0);
}

function updateLineCount() {
    const count = getEntries().length;

    lineCount.textContent =
        count + (count === 1 ? " entry" : " entries");
}

function showInputMessage(message = "") {
    inputMessage.textContent = message;
    inputMessage.hidden = message.length === 0;
}

function clearPreviousResults() {
    resultsSection.hidden = true;
    resultsList.innerHTML = "";

    resultsMessage.textContent = "";
    resultsMessage.hidden = true;

    resultsSummary.textContent = "";

    latestResults = [];
}

cinInput.addEventListener("input", () => {
    updateLineCount();
    showInputMessage();
    clearPreviousResults();
});


// 5. Validate a CIN

function validateCIN(value) {

    const errors = [];
    const cin = value.toUpperCase();

    // Check total length

    if (cin.length !== 21) {
        errors.push(
            `CIN must contain exactly 21 characters. Found ${cin.length}.`
        );

        return {
            valid: false,
            number: value,
            entity: "Company",
            errors
        };
    }

    // Check individual sections

    if (!["L", "U"].includes(cin[0])) {
        errors.push(
            "First character must be L (Listed) or U (Unlisted)."
        );
    }

    if (!/^\d{5}$/.test(cin.substring(1, 6))) {
        errors.push("Characters 2–6 must be a 5-digit industry code.");
    }

    const stateCode = cin.substring(6, 8);

    if (!states[stateCode]) {
        errors.push(`Unknown or invalid state code: ${stateCode}.`);
    }

    const year = cin.substring(8, 12);

    if (!/^\d{4}$/.test(year)) {
        errors.push("Characters 9–12 must be a four-digit year.");
    } else if (
        Number(year) < 1850 ||
        Number(year) > new Date().getFullYear()
    ) {
        errors.push(
            `Incorporation year ${year} is outside the supported range.`
        );
    }

    const typeCode = cin.substring(12, 15);

    if (!/^[A-Z]{3}$/.test(typeCode)) {
        errors.push("Characters 13–15 must be three letters.");
    }

    if (!/^\d{6}$/.test(cin.substring(15, 21))) {
        errors.push(
            "Last six characters must be a numeric ROC registration number."
        );
    }

    // Return decoded information

    return {
        valid: errors.length === 0,

        verificationNote:
            "Format checked only. Company details have not been verified against MCA records.",

        number: value,
        entity: "Company",

        listingStatus:
            cin[0] === "L" ? "Listed" :
            cin[0] === "U" ? "Unlisted" : "Unknown",

        industryCode: cin.substring(1, 6),
        state: states[stateCode] || "Unknown",

        year: /^\d{4}$/.test(year) ? year : "Unknown",

        companyType:
            companyTypes[typeCode] || "Unrecognized code: " + typeCode,

        rocNumber: cin.substring(15, 21),
        errors
    };
}


// 6. Validate an LLPIN

function validateLLPIN(value) {

    const errors = [];
    const llpin = value.toUpperCase();

    // Accept AAA1234 or AAA-1234

    if (!/^[A-Z]{3}-?\d{4}$/.test(llpin)) {
        errors.push(
            "LLPIN must contain three letters followed by four digits (optional hyphen)."
        );
    }

    return {
        valid: errors.length === 0,

        verificationNote:
            "Format checked only. LLP details have not been verified against MCA records.",

        number: value,
        entity: "LLP",

        listingStatus: "Not applicable",
        state: "Not encoded in LLPIN",
        year: "Not encoded in LLPIN",
        companyType: "Limited Liability Partnership",

        errors
    };
}


// 7. Identify which type of number was entered

function validateNumber(value) {

    const normalized = value.toUpperCase();

    if (/^[LU]/.test(normalized)) {
        return validateCIN(normalized);
    }

    if (/^[A-Z]{3}-?\d/.test(normalized)) {
        return validateLLPIN(normalized);
    }

    return {
        valid: false,
        number: value,
        entity: "Unknown",
        errors: [
            "Unrecognized identifier. Enter a CIN or LLPIN."
        ]
    };
}


// 8. Safely display text in HTML

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}


// 9. Create a result card

function createResultCard(result) {

    const card = document.createElement("article");
    card.className = "result-card";

    const statusClass = result.valid ? "valid" : "invalid";
    const statusText = result.valid ? "Valid format" : "Invalid";

    const duplicateLabel = result.duplicate
        ? `<span class="status duplicate">Duplicate entry</span>`
        : "";

    let details = "";

    if (result.valid) {

        details = `
            <p><strong>Entity:</strong> ${escapeHTML(result.entity)}</p>

            ${result.verificationNote
                ? `<p class="verification-note">${escapeHTML(result.verificationNote)}</p>`
                : ""
            }

            <p><strong>Listing status:</strong> ${escapeHTML(result.listingStatus)}</p>

            <p><strong>State:</strong> ${escapeHTML(result.state)}</p>

            <p><strong>Incorporation year:</strong> ${escapeHTML(result.year)}</p>

            <p><strong>Company type:</strong> ${escapeHTML(result.companyType)}</p>

            ${result.industryCode
                ? `<p><strong>Industry code:</strong> ${escapeHTML(result.industryCode)}</p>`
                : ""
            }

            ${result.rocNumber
                ? `<p><strong>ROC number:</strong> ${escapeHTML(result.rocNumber)}</p>`
                : ""
            }

            ${result.entity === "LLP"
                ? `<p><strong>Note:</strong> LLPIN does not encode state, year or listing status.</p>`
                : ""
            }
        `;

    } else {

        details = `
            <p><strong>Entity:</strong> ${escapeHTML(result.entity)}</p>

            <p><strong>Errors:</strong></p>

            <ul>
                ${result.errors.map(error =>
                    `<li>${escapeHTML(error)}</li>`
                ).join("")}
            </ul>
        `;
    }

    card.innerHTML = `
        <h3>${escapeHTML(result.number)}</h3>

        <span class="status ${statusClass}">${statusText}</span>

        ${duplicateLabel}

        ${details}
    `;

    return card;
}


// 10. Validate all entered numbers

let latestResults = [];

function validateAll() {

    const entries = getEntries();

    clearPreviousResults();

    if (entries.length === 0) {
        showInputMessage(
            "Please enter at least one CIN or LLPIN to continue."
        );
        return;
    }

    if (entries.length > 500) {
        showInputMessage(
            "You have entered " + entries.length +
            " entries. The maximum limit is 500. Please remove some entries."
        );
        return;
    }

    showInputMessage();

    // Identify repeated entries without changing their original order.

    const seen = new Set();

    const results = entries.map(value => {

        const normalized = value.toUpperCase().replace(/-/g, "");

        const result = validateNumber(value);

        result.duplicate = seen.has(normalized);

        seen.add(normalized);

        return result;
    });

    latestResults = results;

    const validResults = results.filter(item => item.valid);
    const invalidResults = results.filter(item => !item.valid);
    const duplicateResults = results.filter(item => item.duplicate);

    if (validResults.length === 0) {

        resultsMessage.textContent =
            "No entries passed the format checks. Please review the errors below and correct your CIN or LLPIN numbers.";

        resultsMessage.hidden = false;

    } else {

        resultsMessage.hidden = true;
        resultsMessage.textContent = "";
    }

    // Update statistics

    totalCount.textContent = results.length;
    validCount.textContent = validResults.length;
    invalidCount.textContent = invalidResults.length;
    duplicateCount.textContent = duplicateResults.length;

    resultsSummary.textContent =
        `Checked ${results.length} entries: ` +
        `${validResults.length} valid format, ` +
        `${invalidResults.length} invalid format, and ` +
        `${duplicateResults.length} duplicate entries.`;

    // Render results efficiently

    const resultFragment = document.createDocumentFragment();

    results.forEach(result => {
        resultFragment.appendChild(createResultCard(result));
    });

    resultsList.appendChild(resultFragment);

    resultsSection.hidden = false;

    resultsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// 11. Load sample data

sampleBtn.addEventListener("click", () => {

    cinInput.value = [
        "L17110MH1973PLC019786",
        "U74999DL2015PTC123456",
        "AAA-1234",
        "INVALID123",
        "L17110XX1973PLC019786"
    ].join("\n");

    updateLineCount();
    showInputMessage();

    // Remove previous validation results

    clearPreviousResults();
});


// 12. Clear all input and results

clearBtn.addEventListener("click", () => {

    cinInput.value = "";

    showInputMessage();
    clearPreviousResults();

    updateLineCount();

    cinInput.focus();
});


// 13. Connect validation button

validateBtn.addEventListener("click", validateAll);


// 14. Export validation results to CSV

function csvCell(value) {

    let text = String(value ?? "");

    // Prevent spreadsheet formula injection.

    if (/^[=+\-@\t\r]/.test(text)) {
        text = "'" + text;
    }

    return '"' + text.replace(/"/g, '""') + '"';
}

function exportResults() {

    if (latestResults.length === 0) {
        showInputMessage(
            "Please validate your entries before exporting the results."
        );
        return;
    }

    showInputMessage();

    const headers = [
        "Identification Number",
        "Entity Type",
        "Format Validity",
        "Duplicate",
        "Listing Status",
        "State",
        "Incorporation Year",
        "Company Type",
        "Industry Code",
        "ROC Number",
        "Errors"
    ];

    const rows = latestResults.map(item => [
        item.number,
        item.entity,
        item.valid ? "Valid format" : "Invalid",
        item.duplicate ? "Yes" : "No",
        item.listingStatus || "Not available",
        item.state || "Not available",
        item.year || "Not available",
        item.companyType || "Not available",
        item.industryCode || "Not available",
        item.rocNumber || "Not available",
        (item.errors || []).join("; ")
    ]);

    const csv = [headers, ...rows]
        .map(row => row.map(csvCell).join(","))
        .join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "filesure-validation-results.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

exportBtn.addEventListener("click", exportResults);


// 15. Initial setup

updateLineCount();

console.log("FileSure validation engine loaded successfully.");
