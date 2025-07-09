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
    // --- UI Elements ---
    const settingsBtn = document.getElementById('settings-btn');
    const settingsSection = document.getElementById('settings-section');
    const summarySection = document.getElementById('summary-section');
    const addOtSection = document.getElementById('add-ot-section');
    const historySection = document.getElementById('history-section');
    const hourlyRateInput = document.getElementById('hourly-rate');
    const otMultiplierInput = document.getElementById('ot-multiplier');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
    const otForm = document.getElementById('ot-form');
    const otDateInput = document.getElementById('ot-date');
    const otStartTimeInput = document.getElementById('ot-start-time');
    const otEndTimeInput = document.getElementById('ot-end-time');
    const otDescriptionInput = document.getElementById('ot-description');
    const otListBody = document.getElementById('ot-list-body');
    const noRecordsMsg = document.getElementById('no-records-msg');
    const appAlert = document.getElementById('app-alert');

    // --- Summary Display Elements ---
    const summaryDailyHours = document.getElementById('summary-daily-hours');
    const summaryDailyEarnings = document.getElementById('summary-daily-earnings');
    const summaryMonthlyHours = document.getElementById('summary-monthly-hours');
    const summaryMonthlyEarnings = document.getElementById('summary-monthly-earnings');
    const summaryYearlyHours = document.getElementById('summary-yearly-hours');
    const summaryYearlyEarnings = document.getElementById('summary-yearly-earnings');

    // --- Data Storage & Defaults ---
    let otRecords = JSON.parse(localStorage.getItem('otRecords')) || [];
    let appSettings = JSON.parse(localStorage.getItem('appSettings')) || {
        hourlyRate: 0,
        otMultiplier: 1.5 // Default OT multiplier
    };

    // --- Utility Functions ---
    const saveRecords = () => {
        localStorage.setItem('otRecords', JSON.stringify(otRecords));
    };

    const saveSettings = () => {
        localStorage.setItem('appSettings', JSON.stringify(appSettings));
        loadSettings(); // Reload settings into UI
    };

    const showAlert = (message, type = 'error') => {
        appAlert.textContent = message;
        appAlert.className = `app-alert ${type}`;
        appAlert.classList.remove('hidden');
        setTimeout(() => {
            appAlert.classList.add('hidden');
        }, 5000); // Hide after 5 seconds
    };

    const calculateOTDuration = (startTime, endTime) => {
        const start = new Date(`2000/01/01 ${startTime}`);
        const end = new Date(`2000/01/01 ${endTime}`);

        if (end < start) {
            end.setDate(end.getDate() + 1); // Handle OT crossing midnight
        }

        const diffMs = end - start; // milliseconds
        const diffHours = diffMs / (1000 * 60 * 60); // hours
        return parseFloat(diffHours.toFixed(2));
    };

    const calculateEarnings = (hours) => {
        const rate = parseFloat(appSettings.hourlyRate);
        const multiplier = parseFloat(appSettings.otMultiplier);
        if (isNaN(rate) || rate <= 0) {
            return 0;
        }
        return parseFloat((hours * rate * multiplier).toFixed(2));
    };

    // --- UI Logic ---
    const showSection = (sectionToShow) => {
        [settingsSection, summarySection, addOtSection, historySection].forEach(section => {
            section.classList.add('hidden');
        });
        sectionToShow.classList.remove('hidden');
    };

    const loadSettings = () => {
        hourlyRateInput.value = appSettings.hourlyRate || '';
        otMultiplierInput.value = appSettings.otMultiplier || '';
    };

    const renderOTRecords = () => {
        otListBody.innerHTML = '';
        if (otRecords.length === 0) {
            noRecordsMsg.classList.remove('hidden');
            return;
        }
        noRecordsMsg.classList.add('hidden');

        otRecords.forEach((record, index) => {
            const tableRow = document.createElement('tr');
            tableRow.innerHTML = `
                <td>${record.date}</td>
                <td>${record.duration.toFixed(2)} ชม.</td>
                <td>${record.earnings.toFixed(2)} ฿</td>
                <td>${record.description || '-'}</td>
                <td>
                    <button class="delete-btn" data-index="${index}">ลบ</button>
                </td>
            `;
            otListBody.appendChild(tableRow);
        });
        addDeleteListeners();
    };

    const addDeleteListeners = () => {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const indexToDelete = parseInt(e.target.dataset.index);
                otRecords.splice(indexToDelete, 1);
                saveRecords();
                renderOTRecords();
                updateSummary();
                showAlert('ลบรายการ OT แล้ว', 'success');
            });
        });
    };

    const updateSummary = () => {
        const today = new Date().toISOString().slice(0, 10); //YYYY-MM-DD
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        let dailyHours = 0;
        let dailyEarnings = 0;
        let monthlyHours = 0;
        let monthlyEarnings = 0;
        let yearlyHours = 0;
        let yearlyEarnings = 0;

        otRecords.forEach(record => {
            const recordDate = new Date(record.date);
            const recordHours = parseFloat(record.duration);
            const recordEarnings = parseFloat(record.earnings);

            if (record.date === today) {
                dailyHours += recordHours;
                dailyEarnings += recordEarnings;
            }
            if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
                monthlyHours += recordHours;
                monthlyEarnings += recordEarnings;
            }
            if (recordDate.getFullYear() === currentYear) {
                yearlyHours += recordHours;
                yearlyEarnings += recordEarnings;
            }
        });

        summaryDailyHours.textContent = dailyHours.toFixed(2);
        summaryDailyEarnings.textContent = dailyEarnings.toFixed(2);
        summaryMonthlyHours.textContent = monthlyHours.toFixed(2);
        summaryMonthlyEarnings.textContent = monthlyEarnings.toFixed(2);
        summaryYearlyHours.textContent = yearlyHours.toFixed(2);
        summaryYearlyEarnings.textContent = yearlyEarnings.toFixed(2);
    };

    // --- Event Listeners ---
    settingsBtn.addEventListener('click', () => {
        showSection(settingsSection);
        loadSettings();
    });

    saveSettingsBtn.addEventListener('click', () => {
        const newHourlyRate = parseFloat(hourlyRateInput.value);
        const newOtMultiplier = parseFloat(otMultiplierInput.value);

        if (isNaN(newHourlyRate) || newHourlyRate < 0) {
            showAlert('กรุณากรอกค่าแรงต่อชั่วโมงที่เป็นตัวเลขและไม่ติดลบ', 'error');
            return;
        }
        if (isNaN(newOtMultiplier) || newOtMultiplier < 1) {
            showAlert('กรุณากรอกอัตรา OT ที่เป็นตัวเลขและไม่น้อยกว่า 1', 'error');
            return;
        }

        appSettings.hourlyRate = newHourlyRate;
        appSettings.otMultiplier = newOtMultiplier;
        saveSettings();
        updateSummary(); // Update summary if rates changed
        showAlert('บันทึกการตั้งค่าแล้ว', 'success');
        showSection(summarySection); // Go back to summary
    });

    cancelSettingsBtn.addEventListener('click', () => {
        showSection(summarySection); // Go back to summary
    });

    otForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const date = otDateInput.value;
        const startTime = otStartTimeInput.value;
        const endTime = otEndTimeInput.value;
        const description = otDescriptionInput.value.trim();

        if (appSettings.hourlyRate <= 0 || isNaN(appSettings.hourlyRate)) {
            showAlert('กรุณาตั้งค่า "ค่าแรงต่อชั่วโมง" ในหน้าตั้งค่าก่อนบันทึก OT', 'error');
            return;
        }

        if (date && startTime && endTime) {
            const duration = calculateOTDuration(startTime, endTime);
            const earnings = calculateEarnings(duration);

            const newRecord = { date, startTime, endTime, duration, description, earnings };
            otRecords.unshift(newRecord); // Add to the beginning
            saveRecords();
            renderOTRecords();
            updateSummary();
            otForm.reset(); // Clear the form
            otDateInput.value = new Date().toISOString().slice(0, 10); // Reset date to today
            showAlert('บันทึก OT สำเร็จ!', 'success');
        } else {
            showAlert('กรุณากรอกข้อมูล วันที่, เวลาเริ่มต้น และเวลาสิ้นสุด ให้ครบถ้วน', 'error');
        }
    });

    // --- Initial Load ---
    loadSettings();
    renderOTRecords();
    updateSummary();
    otDateInput.value = new Date().toISOString().slice(0, 10); // Set current date to the input field initially
    showSection(summarySection); // Show summary section first
});
