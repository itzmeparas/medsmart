
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        
        try {
            const res = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            } else {
                errorDiv.textContent = data.error;
                errorDiv.style.display = 'block';
            }
        } catch (err) {
            errorDiv.textContent = 'Server error. Please try again.';
            errorDiv.style.display = 'block';
        }
    });
}

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('signupError');
        
        try {
            const res = await fetch('/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            if (data.success) {
                window.location.href = 'login.html';
            } else {
                errorDiv.textContent = data.error;
                errorDiv.style.display = 'block';
            }
        } catch (err) {
            errorDiv.textContent = 'Server error. Please try again.';
            errorDiv.style.display = 'block';
        }
    });
}

if (window.location.pathname.endsWith('dashboard.html') || window.location.pathname === '/dashboard.html') {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
    }

    const welcomeEl = document.getElementById('welcomeUser');
    if(welcomeEl) welcomeEl.textContent = `Welcome, ${user.name}`;

    const logoutBtn = document.getElementById('btnLogout');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }

    // View Switching
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a[data-view]');
    const views = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('pageTitle');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.getAttribute('data-view');
            
            // Handle Add Medicine Special Case
            if (targetView === 'add-medicine-view') {
                openModal();
                return;
            }

            // Update Active Link
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show View
            views.forEach(v => {
                v.style.display = v.id === targetView ? 'block' : 'none';
            });
            
            pageTitle.textContent = link.textContent.trim();
        });
    });

    // Modal Logic
    const addMedicineModal = document.getElementById('addMedicineModal');
    const closeModalBtn = document.getElementById('closeModal');
    const cancelModalBtn = document.getElementById('cancelModal');
    const btnQuickAdd = document.getElementById('btnQuickAdd');

    function openModal() { addMedicineModal.classList.add('active'); }
    function closeModal() { addMedicineModal.classList.remove('active'); document.getElementById('addMedicineForm').reset(); }

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);
    if (btnQuickAdd) btnQuickAdd.addEventListener('click', openModal);

    // Current Time Updates
    setInterval(() => {
        const now = new Date();
        const timeEl = document.getElementById('currentTime');
        if(timeEl) timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }, 1000);

    // Data Management
    let medicines = [];

    async function fetchMedicines() {
        try {
            const res = await fetch(`/getMedicines?userId=${user.id}`);
            const data = await res.json();
            if (data.success) {
                medicines = data.medicines;
                renderDashboard();
                renderMedicineList();
            }
        } catch (err) {
            console.error('Error fetching medicines', err);
        }
    }

    const medForm = document.getElementById('addMedicineForm');
    if(medForm) {
        medForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const medData = {
                userId: user.id,
                name: document.getElementById('medName').value,
                dosage: document.getElementById('medDosage').value,
                time: document.getElementById('medTime').value,
                frequency: document.getElementById('medFrequency').value
            };

            try {
                const res = await fetch('/addMedicine', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(medData)
                });
                const data = await res.json();
                if (data.success) {
                    closeModal();
                    fetchMedicines();
                }
            } catch (err) {
                console.error('Error adding medicine', err);
            }
        });
    }

    // Helper functions for updating UI
    function animateCounter(elementId, targetValue) {
        const el = document.getElementById(elementId);
        if(!el) return;
        let current = parseInt(el.textContent) || 0;
        const diff = targetValue - current;
        if (diff === 0) return;
        const step = diff > 0 ? 1 : -1;
        
        // simple proportional timeout mapping so animations end roughly together
        const intervalTime = Math.max(10, Math.floor(500 / Math.abs(diff)));
        
        const interval = setInterval(() => {
            current += step;
            el.textContent = current;
            if (current === targetValue) clearInterval(interval);
        }, intervalTime);
    }

    function renderDashboard() {
        const total = medicines.length;
        const taken = medicines.filter(m => m.status === 'Taken').length;
        const missed = medicines.filter(m => m.status === 'Missed').length;

        animateCounter('statTotal', total);
        animateCounter('statTaken', taken);
        animateCounter('statMissed', missed);

        const tbody = document.querySelector('#upcomingTable tbody');
        if(tbody) {
            tbody.innerHTML = '';
            
            // Sort by time
            const sorted = [...medicines].sort((a,b) => a.time.localeCompare(b.time));
            
            sorted.forEach(med => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${med.time}</td>
                    <td><strong>${med.name}</strong></td>
                    <td>${med.dosage}</td>
                    <td><span class="status-badge status-${med.status.toLowerCase()}">${med.status}</span></td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    function renderMedicineList() {
        const tbody = document.querySelector('#medicineTable tbody');
        if(tbody) {
            tbody.innerHTML = '';
            
            medicines.forEach(med => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${med.name}</strong></td>
                    <td>${med.dosage}</td>
                    <td>${med.time}</td>
                    <td>${med.frequency}</td>
                    <td><span class="status-badge status-${med.status.toLowerCase()}">${med.status}</span></td>
                    <td>
                        ${med.status !== 'Taken' ? `<button class="btn-small btn-success" onclick="updateMedStatus('${med.id}', 'Taken')" title="Mark Taken"><i class="fas fa-check"></i></button>` : ''}
                        <button class="btn-small btn-danger" onclick="deleteMed('${med.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    window.updateMedStatus = async function(id, status) {
        try {
            await fetch(`/updateMedicine/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            fetchMedicines();
        } catch (err) {
            console.error('Error updating status', err);
        }
    };

    window.deleteMed = async function(id) {
        if (!confirm('Are you sure you want to delete this medicine?')) return;
        try {
            await fetch(`/deleteMedicine/${id}`, { method: 'DELETE' });
            fetchMedicines();
        } catch (err) {
            console.error('Error deleting', err);
        }
    };

    // Reminder System
    let reminderActive = null;
    let reminderTimeout = null;
    
    function speak(text) {
        const voiceTgl = document.getElementById('toggleVoiceAlerts');
        if (voiceTgl && voiceTgl.checked && 'speechSynthesis' in window) {
            // Cancel any previous speech
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    }

    function triggerReminder(med) {
        if (reminderActive === med.id) return; // already reminding
        reminderActive = med.id;
        
        const popup = document.getElementById('reminderPopup');
        if(!popup) return;

        document.getElementById('remindMedicineName').textContent = med.name;
        document.getElementById('remindDosage').textContent = `Dosage: ${med.dosage}`;
        popup.classList.add('show');
        
        speak("Please take your medicine now. " + med.name);

        // Clear previous timeout if any
        if (reminderTimeout) clearTimeout(reminderTimeout);

        // Auto mark missed after 2 minutes (120000 ms)
        reminderTimeout = setTimeout(() => {
            if (reminderActive === med.id) {
                // Not confirmed in 2 mins
                window.updateMedStatus(med.id, 'Missed');
                popup.classList.remove('show');
                reminderActive = null;
                showCaregiverAlert();
            }
        }, 120000);

        // Handlers
        document.getElementById('btnTakeMedicine').onclick = () => {
            window.updateMedStatus(med.id, 'Taken');
            popup.classList.remove('show');
            clearTimeout(reminderTimeout);
            reminderActive = null;
        };

        document.getElementById('btnSnooze').onclick = () => {
            popup.classList.remove('show');
            clearTimeout(reminderTimeout);
            reminderActive = null; // will trigger again in next intervals if time still matches or snoozed
        };
    }

    function showCaregiverAlert() {
        const banner = document.getElementById('caregiverAlert');
        if(banner) {
            banner.classList.add('show');
            setTimeout(() => {
                banner.classList.remove('show');
            }, 8000);
        }
    }

    // Check every 30 seconds
    setInterval(() => {
        const now = new Date();
        const currentHour = String(now.getHours()).padStart(2, '0');
        const currentMinute = String(now.getMinutes()).padStart(2, '0');
        const currentTimeString = `${currentHour}:${currentMinute}`;

        const medsToTake = medicines.filter(m => m.status === 'Scheduled' && m.time === currentTimeString);
        if (medsToTake.length > 0) {
            // Pick first one
            triggerReminder(medsToTake[0]);
        }
    }, 30000);

    // Initial load
    fetchMedicines();

    // Accessibility Handlers
    const body = document.body;
    
    const applyTheme = () => {
        const hcTgl = document.getElementById('toggleHighContrast');
        const dmTgl = document.getElementById('toggleDarkMode');
        
        if (hcTgl && hcTgl.checked) {
            body.setAttribute('data-theme', 'high-contrast');
            if(dmTgl) dmTgl.checked = false;
        } else if (dmTgl && dmTgl.checked) {
            body.setAttribute('data-theme', 'dark');
            if(hcTgl) hcTgl.checked = false;
        } else {
            body.removeAttribute('data-theme');
        }
    };
    
    document.getElementById('toggleDarkMode').addEventListener('change', applyTheme);
    document.getElementById('toggleHighContrast').addEventListener('change', applyTheme);
    
    document.getElementById('toggleLargeFont').addEventListener('change', (e) => {
        if (e.target.checked) body.classList.add('large-font');
        else body.classList.remove('large-font');
    });

}
