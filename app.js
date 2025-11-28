const API_BASE = 'https://id1rasld2a.execute-api.us-east-1.amazonaws.com/prod';

// DOM elements
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const status = document.getElementById('status');
const result = document.getElementById('result');
const emailInput = document.getElementById('email');
const notifyInput = document.getElementById('notify');
const subBtn = document.getElementById('subBtn');
const subEmail = document.getElementById('subEmail');
const subStatus = document.getElementById('subStatus');
const downloadCsvBtn = document.getElementById('downloadCsvBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');

let currentReceiptData = null;

// Status helper
function setStatus(message) {
  status.innerText = message;
}

// Show results
function showResults(data) {
  currentReceiptData = data;
  let html = `<h4>Receipt ID: ${data.receiptId}</h4>`;

  if (data.summary) {
    html += `<h5>Summary</h5><ul>`;
    for (const [key, value] of Object.entries(data.summary)) {
      html += `<li><strong>${key}:</strong> ${value}</li>`;
    }
    html += `</ul>`;
  }

  if (data.lineItems) {
    html += `<h5>Line Items</h5><ul>`;
    for (const item of data.lineItems) {
      html += `<li>${item.ItemIdentification} — ${item.Price}</li>`;
    }
    html += `</ul>`;
  }

  result.innerHTML = html;
}

// Upload & process receipt
uploadBtn.addEventListener('click', async () => {
  const file = fileInput.files[0];
  if (!file) {
    alert('Choose a file');
    return;
  }

  setStatus('Reading file...');
  const reader = new FileReader();

  reader.onload = async function (ev) {
    const base64 = ev.target.result.split(',')[1];
    setStatus('Uploading to API...');

    const payload = {
      filename: file.name,
      file_base64: base64,
      email: emailInput.value || null,
      notify: notifyInput.checked
    };

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setStatus('Done');

      if (notifyInput.checked) {
        result.innerHTML = `<p>✅ Processed and emailed to <strong>${emailInput.value}</strong></p>
                            <p>Receipt ID: ${data.receiptId}</p>`;
      } else {
        showResults(data);
      }
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
  };

  reader.readAsDataURL(file);
});

// Subscribe form
subBtn.addEventListener('click', async () => {
  const email = subEmail.value;
  if (!email) {
    alert("Please enter an email");
    return;
  }

  subStatus.innerText = "Subscribing...";
  try {
    const res = await fetch(`${API_BASE}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    subStatus.innerText = data.message || "Subscribed!";
  } catch (err) {
    subStatus.innerText = "Error: " + err.message;
  }
});

// Download CSV
function downloadCSV(data) {
  const rows = [["Receipt ID", data.receiptId]];

  if (data.summary) {
    rows.push(["--- Summary ---"]);
    for (const [key, value] of Object.entries(data.summary)) {
      rows.push([key, value]);
    }
  }

  if (data.lineItems) {
    rows.push(["--- Line Items ---"]);
    rows.push(["Item", "Price"]);
    for (const item of data.lineItems) {
      rows.push([item.ItemIdentification, item.Price]);
    }
  }

  const csvContent = rows.map(row => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `receipt_${data.receiptId}.csv`;
  link.click();
}

// Download PDF
function downloadPDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10;

  doc.setFontSize(16);
  doc.text(`Receipt ID: ${data.receiptId}`, 10, y);
  y += 10;

  if (data.summary) {
    doc.setFontSize(14);
    doc.text("Summary:", 10, y);
    y += 10;

    doc.setFontSize(12);
    for (const [key, value] of Object.entries(data.summary)) {
      const lines = doc.splitTextToSize(`${key}: ${value}`, 180);
      doc.text(lines, 10, y);
      y += lines.length * 6;
    }
  }

  if (data.lineItems) {
    y += 10;
    doc.setFontSize(14);
    doc.text("Line Items:", 10, y);
    y += 10;

    doc.setFontSize(12);
    for (const item of data.lineItems) {
      const line = `${item.ItemIdentification} — ${item.Price}`;
      const wrapped = doc.splitTextToSize(line, 180);
      doc.text(wrapped, 10, y);
      y += wrapped.length * 6;
    }
  }

  doc.save(`receipt_${data.receiptId}.pdf`);
}

// Export buttons
downloadCsvBtn.addEventListener("click", () => {
  if (currentReceiptData) downloadCSV(currentReceiptData);
});

downloadPdfBtn.addEventListener("click", () => {
  if (currentReceiptData) downloadPDF(currentReceiptData);
});

// Tab switching
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.getElementById(tabId).style.display = 'block';
  event.target.classList.add('active');
}

