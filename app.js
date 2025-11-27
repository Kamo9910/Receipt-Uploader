// Replace with your API Gateway base URL (no trailing slash)
    const API_BASE = 'https://id1rasld2a.execute-api.us-east-1.amazonaws.com/prod';

    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const status = document.getElementById('status');
    const result = document.getElementById('result');
    const emailInput = document.getElementById('email');
    const notifyInput = document.getElementById('notify');

    const subBtn = document.getElementById('subBtn');
    const subEmail = document.getElementById('subEmail');
    const subStatus = document.getElementById('subStatus');

    function setStatus(s){ status.innerText = s; }
   // Format results into nice HTML
   function showResults(data){
  currentReceiptData = data; 
  let html = `<h4>Receipt ID: ${data.receiptId}</h4>`;
  if(data.summary){
    html += `<h5>Summary</h5><ul>`;
    for(const [k,v] of Object.entries(data.summary)){
      html += `<li><strong>${k}:</strong> ${v}</li>`;
    }
    html += `</ul>`;
  }
  if(data.lineItems){
    html += `<h5>Line Items</h5><ul>`;
    for(const item of data.lineItems){
      html += `<li>${item.ItemIdentification} — ${item.Price}</li>`;
    }
    html += `</ul>`;
  }
  result.innerHTML = html;
}

    // Upload & process receipt
    uploadBtn.addEventListener('click', async () => {
      const f = fileInput.files[0];
      if(!f){ alert('Choose a file'); return; }
      setStatus('Reading file...');
      const reader = new FileReader();
      reader.onload = async function(ev){
        const b64 = ev.target.result.split(',')[1];
        setStatus('Uploading to API...');
        const payload = {
          filename: f.name,
          file_base64: b64,
          email: emailInput.value || null,
          notify: notifyInput.checked
        };
        try {
          const res = await fetch(API_BASE + '/upload', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          setStatus('Done');
          if(notifyInput.checked){
            result.innerHTML = `<p>✅ Processed and emailed to <strong>${emailInput.value}</strong></p>
                                <p>Receipt ID: ${data.receiptId}</p>`;
          } else {
            showResults(data);
          }
        } catch (err){
          setStatus('Error: ' + err.message);
        }
      };
      reader.readAsDataURL(f);
    });

    // Subscribe form
    subBtn.addEventListener('click', async () => {
      const email = subEmail.value;
      if(!email){ alert("Please enter an email"); return; }
      subStatus.innerText = "Subscribing...";
      try {
        const res = await fetch(API_BASE + '/subscribe', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        subStatus.innerText = data.message || "Subscribed!";
      } catch(err){
        subStatus.innerText = "Error: " + err.message;
      }
    });

    //Store the Current Receipt Data

    let currentReceiptData = null ;
    function showResults(data){
      currentReceiptData = data; 
      let html = '<h4>Receipt ID: ${data.receiptId}</h4>';
      result.innerHTML = html;
    }
    //Generate CSV
    function downloadCSV(data){
      let rows = [];
      rows.push(["Receipt ID", data.receiptId]);

      if(data.summary){
        rows.push(["--- Summary ---"]);
        for(const [k,v] of Object.entries(data.summary)){
          rows.push([k, v]);
        }
      }

      if(data.lineItems){
        rows.push(["--- Line Items ---"]);
        rows.push(["Item", "Price"]);
        for(const item of data.lineItems){
          rows.push([item.ItemIdentification, item.Price]);
        }
      }

      let csvContent = rows.map(e => e.join(",")).join("\n");
      let blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      let link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `receipt_${data.receiptId}.csv`;
      link.click();
}
 // Generate PDF
 function downloadPDF(data){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text(`Receipt ID: ${data.receiptId}`, 10, 10);

    if(data.summary){
      doc.text("Summary:", 10, 20);
      let y = 30;
      for(const [k,v] of Object.entries(data.summary)){
        doc.text(`${k}: ${v}`, 10, y);
        y += 10;
      }
    }

    if(data.lineItems){
      doc.text("Line Items:", 10, 60);
      let y = 70;
      for(const item of data.lineItems){
        doc.text(`${item.ItemIdentification} — ${item.Price}`, 10, y);
        y += 10;
      }
    }

    doc.save(`receipt_${data.receiptId}.pdf`);
}
    
// PDF and CSV Buttons
    document.getElementById("downloadCsvBtn").addEventListener("click", () => {
      if(currentReceiptData) downloadCSV(currentReceiptData);
    });

    document.getElementById("downloadPdfBtn").addEventListener("click", () => {
      if(currentReceiptData) downloadPDF(currentReceiptData);
    });

    function showTab(tabId) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  // Remove active class from all tabs
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  // Show selected tab content
  document.getElementById(tabId).style.display = 'block';
  // Add active class to clicked tab
  event.target.classList.add('active');
}

  
