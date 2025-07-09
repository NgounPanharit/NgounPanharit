// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('Service Worker registered: ', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed: ', error);
            });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const otForm = document.getElementById('ot-form');
    const otDateInput = document.getElementById('ot-date');
    const otStartTimeInput = document.getElementById('ot-start-time');
    const otEndTimeInput = document.getElementById('ot-end-time');
    const otDescriptionInput = document.getElementById('ot-description');
    const otList = document.getElementById('ot-list');
    const summaryFilterButtons = document.querySelectorAll('.summary-filter .btn');
    const otSummaryDisplay = document.getElementById('ot-summary-display');

    let otRecords = JSON.parse(localStorage.getItem('otRecords')) || [];

    // Function to save records to Local Storage
    const saveRecords = () => {
        localStorage.setItem('otRecords', JSON.stringify(otRecords));
    };

    // Function to render OT records
    const renderOTRecords = () => {
        otList.innerHTML = '';
        if (otRecords.length === 0) {
            otList.innerHTML = '<p style="text-align: center; color: #777;">ยังไม่มีการบันทึก OT</p>';
            return;
        }
        otRecords.forEach((record, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <div class="ot-details">
                    <strong>วันที่: ${record.date}</strong>
                    <small>เวลา: ${record.startTime} - ${record.endTime}</small>
                    <small>รวม: ${record.duration} ชั่วโมง</small>
                    ${record.description ? `<small>รายละเอียด: ${record.description}</small>` : ''}
                </div>
                <button class="delete-btn" data-index="${index}">ลบ</button>
            `;
            otList.appendChild(listItem);
        });
        addDeleteListeners();
    };

    // Function to add event listeners to delete buttons
    const addDeleteListeners = () => {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const indexToDelete = parseInt(e.target.dataset.index);
                otRecords.splice(indexToDelete, 1);
                saveRecords();
                renderOTRecords();
                updateSummary(); // Update summary after deletion
            });
        });
    };

    // Function to calculate OT duration
    const calculateOTDuration = (startTime, endTime) => {
        const start = new Date(`2000/01/01 ${startTime}`);
        const end = new Date(`2000/01/01 ${endTime}`);

        if (end < start) {
            end.setDate(end.getDate() + 1); // Handle OT crossing midnight
        }

        const diffMs = end - start; // milliseconds
        const diffHours = diffMs / (1000 * 60 * 60); // hours
        return diffHours.toFixed(2);
    };

    // Function to update the summary display
    const updateSummary = (filter = 'daily') => {
        let totalHours = 0;
        let filteredRecords = [];
        const today = new Date().toISOString().slice(0, 10); //YYYY-MM-DD

        if (filter === 'daily') {
            filteredRecords = otRecords.filter(record => record.date === today);
            otSummaryDisplay.innerHTML = `<h3>สรุป OT ประจำวันนี้ (${today})</h3>`;
        } else if (filter === 'monthly') {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            filteredRecords = otRecords.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
            });
            otSummaryDisplay.innerHTML = `<h3>สรุป OT ประจำเดือนนี้ (${new Date().toLocaleString('th-TH', { month: 'long', year: 'numeric' })})</h3>`;
        } else if (filter === 'yearly') {
            const currentYear = new Date().getFullYear();
            filteredRecords = otRecords.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate.getFullYear() === currentYear;
            });
            otSummaryDisplay.innerHTML = `<h3>สรุป OT ประจำปีนี้ (${currentYear})</h3>`;
        }

        if (filteredRecords.length === 0) {
            otSummaryDisplay.innerHTML += '<p>ยังไม่มีข้อมูล OT สำหรับช่วงเวลานี้</p>';
            return;
        }

        filteredRecords.forEach(record => {
            totalHours += parseFloat(record.duration);
        });

        otSummaryDisplay.innerHTML += `<p><strong>รวมเวลา OT ทั้งหมด: ${totalHours.toFixed(2)} ชั่วโมง</strong></p>`;
        
        // Optionally display details for filtered records
        if (filter === 'daily') { // Only show details for daily view to avoid clutter
            otSummaryDisplay.innerHTML += '<h4>รายละเอียด:</h4>';
            otSummaryDisplay.innerHTML += '<ul>';
            filteredRecords.forEach(record => {
                otSummaryDisplay.innerHTML += `<li>${record.date} ${record.startTime}-${record.endTime} (${record.duration} ชม.) ${record.description ? ` - ${record.description}` : ''}</li>`;
            });
            otSummaryDisplay.innerHTML += '</ul>';
        }
    };

    // Event Listener for Form Submission
    otForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const date = otDateInput.value;
        const startTime = otStartTimeInput.value;
        const endTime = otEndTimeInput.value;
        const description = otDescriptionInput.value.trim();

        if (date && startTime && endTime) {
            const duration = calculateOTDuration(startTime, endTime);
            const newRecord = { date, startTime, endTime, duration, description };
            otRecords.unshift(newRecord); // Add to the beginning
            saveRecords();
            renderOTRecords();
            updateSummary('daily'); // Update daily summary after adding new record
            otForm.reset(); // Clear the form
        } else {
            alert('กรุณากรอกข้อมูล วันที่, เวลาเริ่มต้น และเวลาสิ้นสุด ให้ครบถ้วน');
        }
    });

    // Event Listener for Summary Filter Buttons
    summaryFilterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            summaryFilterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            updateSummary(e.target.dataset.filter);
        });
    });

    // Initial render and summary update
    renderOTRecords();
    // Set current date to the input field initially
    otDateInput.value = new Date().toISOString().slice(0, 10);
    updateSummary('daily');
});
