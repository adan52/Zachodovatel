// ===== Zachodovatel - App Logic =====
(function () {
    'use strict';

    // ===== AVATAR COLORS =====
    const COLORS = [
        '#7c3aed','#10b981','#f97316','#3b82f6','#ef4444',
        '#ec4899','#06b6d4','#8b5cf6','#14b8a6','#f59e0b',
        '#6366f1','#84cc16','#e11d48','#0ea5e9','#d946ef',
    ];

    // ===== DEFAULT DATA - Class 2.A (sorted by last name) =====
    const CLASS_2A = [
        'Ivan Alipov','Vit Basak','Dominik Beran','Renata Benesova',
        'Antonin Burianek','Vit Chvojka','Stepan Cihal','Andrii Fedorov',
        'Vojta Filip','Zdenek Hauer','Martin Hoffman','David Jakes',
        'Filip Kolacek','Milan Kruml','Sofiia Limberska','Martin Majer',
        'Vilma Nela Pohsoltova','Vendula Prochazkova','Petr Rybin',
        'Jiri Rzyman','Kristyna Savelova','Viktoriia Savchuk',
        'Makar Simonov','Ondrej Tazler','Veronika Vavrochova'
    ];

    // ===== TEST CLASSES =====
    const CLASS_2B = [
        'Tomas Bartos','Lucie Berkova','Jakub Cerny','Karolina Dvorakova',
        'Adam Fiala','Tereza Hajkova','Daniel Horak','Nikola Jandova',
        'Matej Kolar','Simona Kralova','Patrik Mach','Barbora Nemcova',
        'Lukas Novak','Anna Pokorná','Michal Ruzicka','Eva Sedlackova',
        'Vojtech Svoboda','Klara Syrova','Jan Urbanek','Petra Vesela'
    ];

    const CLASS_3A = [
        'Ales Adamec','Zuzana Blahova','Roman Cermak','Marie Dostalova',
        'Filip Fiala','Hana Gregorova','Pavel Hejl','Ivana Jiraskova',
        'Ondrej Kouba','Lenka Kratochvilova','Viktor Landa','Monika Markova',
        'Tomas Navratil','Sarka Ondrejova','David Polansky','Jana Richterova',
        'Marek Sedlak','Katerina Tomanova','Radek Vlcek','Nikola Zahorova'
    ];

    const CLASS_1C = [
        'Marcel Benes','Adela Capkova','Stepan Dolezal','Emma Fialova',
        'Hugo Geisler','Linda Havlickova','Igor Jankovic','Sofie Kovarova',
        'Matyas Liska','Olivia Machova','Nicolas Pelikan','Rosa Prokopova',
        'Samuel Roubal','Tamara Stankova','Tobias Tuma','Vanessa Urbanová',
        'Vojtech Vrba','Xenie Zahradnikova'
    ];

    // ===== SORT BY LAST NAME =====
    function sortByLastName(names) {
        return [...names].sort((a, b) => {
            const lastA = a.split(' ').slice(-1)[0];
            const lastB = b.split(' ').slice(-1)[0];
            return lastA.localeCompare(lastB, 'cs');
        });
    }

    // ===== STATE =====
    let state = loadState();
    let timerInterval = null;

    function getDefaultState() {
        return {
            classes: {
                '2.A': { students: sortByLastName(CLASS_2A) },
                '2.B': { students: sortByLastName(CLASS_2B) },
                '3.A': { students: sortByLastName(CLASS_3A) },
                '1.C': { students: sortByLastName(CLASS_1C) }
            },
            currentClass: '2.A',
            activeBreaks: {},
            history: [],
            theme: 'light'
        };
    }

    function loadState() {
        try {
            const saved = localStorage.getItem('zachodovatel_v2');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (!parsed.classes || !parsed.currentClass) return getDefaultState();
                if (!parsed.activeBreaks) parsed.activeBreaks = {};
                if (!parsed.history) parsed.history = [];
                if (!parsed.theme) parsed.theme = 'light';
                return parsed;
            }
        } catch (e) { /* ignore */ }
        return getDefaultState();
    }

    function saveState() {
        localStorage.setItem('zachodovatel_v2', JSON.stringify(state));
    }

    // ===== HELPERS =====
    function getInitials(name) {
        const parts = name.split(' ');
        return parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : name.substring(0, 2).toUpperCase();
    }

    function getColor(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return COLORS[Math.abs(hash) % COLORS.length];
    }

    function formatDuration(ms) {
        const totalSec = Math.floor(ms / 1000);
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }

    function formatTime(ts) {
        return new Date(ts).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
    }

    function formatDate(ts) {
        return new Date(ts).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });
    }

    function getClassHistory(cls) {
        return state.history.filter(h => h.className === cls);
    }

    function getStudentHistory(cls, name) {
        return state.history.filter(h => h.className === cls && h.student === name);
    }

    function getActiveBreaks(cls) {
        return state.activeBreaks[cls] || {};
    }

    function isToday(ts) {
        return new Date(ts).toDateString() === new Date().toDateString();
    }

    function escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    // SVG icons as strings (no emoji)
    const ICONS = {
        toilet: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 3h12a2 2 0 012 2v4a6 6 0 01-6 6h-4a6 6 0 01-6-6V5a2 2 0 012-2z"/><path d="M12 15v3"/><path d="M8 21h8"/></svg>',
        check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>',
        user: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        hash: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18"/></svg>',
        clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
        trophy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 19.24 7 20v2h10v-2c0-.76-.85-1.25-2.03-1.79C14.47 17.98 14 17.55 14 17v-2.34"/><path d="M18 2H6v7a6 6 0 1012 0V2z"/></svg>',
        empty: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h.01M15 9h.01M8 14s1.5 2 4 2 4-2 4-2"/></svg>',
        door: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 1H6a2 2 0 00-2 2v18l8-4 8 4V3a2 2 0 00-2-2z"/></svg>',
        arrowRight: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
    };

    // ===== DOM REFS =====
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const els = {
        sidebar: $('#sidebar'),
        menuToggle: $('#menu-toggle'),
        themeToggle: $('#theme-toggle'),
        classSelect: $('#class-select'),
        studentsGrid: $('#students-grid'),
        activeBadge: $('#live-badge'),
        activeCount: $('#active-count'),
        pageTitle: $('#page-title'),
        statTotal: $('#stat-total'),
        statAvgTime: $('#stat-avg-time'),
        statToday: $('#stat-today'),
        statRecord: $('#stat-record'),
        leaderboard: $('#leaderboard'),
        timeLeaderboard: $('#time-leaderboard'),
        historyList: $('#history-list'),
        nextPredictions: $('#next-predictions'),
        timePredictions: $('#time-predictions'),
        hourlyChart: $('#hourly-chart'),
        dailyForecast: $('#daily-forecast'),
        settingsClassName: $('#settings-class-name'),
        newClassName: $('#new-class-name'),
        addClassBtn: $('#add-class-btn'),
        classesList: $('#classes-list'),
        newStudentName: $('#new-student-name'),
        addStudentBtn: $('#add-student-btn'),
        studentsListSettings: $('#students-list-settings'),
        exportBtn: $('#export-btn'),
        clearHistoryBtn: $('#clear-history-btn'),
        modalOverlay: $('#modal-overlay'),
        modal: $('#modal'),
        modalTitle: $('#modal-title'),
        modalBody: $('#modal-body'),
        modalClose: $('#modal-close'),
    };

    // ===== THEME =====
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        state.theme = theme;
        saveState();
    }

    els.themeToggle.addEventListener('click', () => {
        applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    });

    // Apply saved theme on load
    applyTheme(state.theme);

    // ===== NAVIGATION =====
    const navBtns = $$('.nav-btn');
    const views = $$('.view');
    const viewTitles = { dashboard: 'Panel', stats: 'Statistiky', predictions: 'Predikce', settings: 'Nastaven\u00ed' };

    function switchView(viewName) {
        navBtns.forEach(b => b.classList.toggle('active', b.dataset.view === viewName));
        views.forEach(v => v.classList.toggle('active', v.id === `view-${viewName}`));
        els.pageTitle.textContent = viewTitles[viewName] || viewName;
        if (viewName === 'stats') renderStats();
        if (viewName === 'predictions') renderPredictions();
        if (viewName === 'settings') renderSettings();
        els.sidebar.classList.remove('open');
    }

    navBtns.forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
    els.menuToggle.addEventListener('click', () => els.sidebar.classList.toggle('open'));

    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && !els.sidebar.contains(e.target) && !els.menuToggle.contains(e.target)) {
            els.sidebar.classList.remove('open');
        }
    });

    // ===== CLASS SELECTOR =====
    function renderClassSelect() {
        els.classSelect.innerHTML = '';
        Object.keys(state.classes).sort().forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            if (name === state.currentClass) opt.selected = true;
            els.classSelect.appendChild(opt);
        });
    }

    els.classSelect.addEventListener('change', () => {
        state.currentClass = els.classSelect.value;
        saveState();
        renderDashboard();
    });

    // ===== DASHBOARD =====
    function renderDashboard() {
        const cls = state.currentClass;
        const students = sortByLastName(state.classes[cls]?.students || []);
        const breaks = getActiveBreaks(cls);
        const grid = els.studentsGrid;
        grid.innerHTML = '';

        if (students.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    ${ICONS.empty}
                    <div class="empty-state-text">Zadni zaci. Pridejte je v Nastaveni.</div>
                </div>`;
            return;
        }

        // Calculate visit stats for badges
        const history = getClassHistory(cls);
        const visitCounts = {};
        students.forEach(s => visitCounts[s] = 0);
        history.forEach(h => { if (visitCounts[h.student] !== undefined) visitCounts[h.student]++; });
        const maxVisits = Math.max(...Object.values(visitCounts), 0);
        const avgVisits = Object.values(visitCounts).reduce((a, b) => a + b, 0) / (students.length || 1);

        students.forEach(name => {
            const isAway = !!breaks[name];
            const count = visitCounts[name] || 0;

            // Badge class
            let badgeClass = 'visit-badge';
            if (count > 0 && maxVisits > 0 && count === maxVisits) badgeClass += ' top-visitor';
            else if (count > avgVisits * 1.5 && count > 0) badgeClass += ' frequent-visitor';
            else if (count > 0) badgeClass += ' has-visits';

            const card = document.createElement('div');
            card.className = `student-card${isAway ? ' away' : ''}`;
            card.innerHTML = `
                <div class="student-card-top">
                    <div class="student-avatar" style="background:${getColor(name)}">${escapeHtml(getInitials(name))}</div>
                    <div class="student-info">
                        <div class="student-name">${escapeHtml(name)}</div>
                        <div class="student-status">
                            ${isAway
                                ? ICONS.toilet + ' Na zachode'
                                : ICONS.check + ' Ve tride'}
                        </div>
                    </div>
                </div>
                <div class="student-bottom">
                    <div class="student-timer" data-student="${escapeHtml(name)}"></div>
                    <div class="${badgeClass}">${ICONS.hash} ${count}x</div>
                </div>
            `;

            card.addEventListener('click', () => toggleBreak(name));
            grid.appendChild(card);
        });

        updateTimers();
        updateActiveCount();
    }

    function toggleBreak(studentName) {
        const cls = state.currentClass;
        if (!state.activeBreaks[cls]) state.activeBreaks[cls] = {};
        const breaks = state.activeBreaks[cls];

        if (breaks[studentName]) {
            const startTime = breaks[studentName].startTime;
            const endTime = Date.now();
            const duration = endTime - startTime;
            state.history.push({ student: studentName, className: cls, startTime, endTime, duration });
            delete breaks[studentName];
            showToast(studentName, duration);
        } else {
            breaks[studentName] = { startTime: Date.now() };
        }

        saveState();
        renderDashboard();
    }

    function showToast(name, duration) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `${ICONS.check} <strong>${escapeHtml(name)}</strong> &mdash; ${formatDuration(duration)}`;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(8px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function updateTimers() {
        const cls = state.currentClass;
        const breaks = getActiveBreaks(cls);
        const now = Date.now();
        document.querySelectorAll('.student-timer[data-student]').forEach(el => {
            const name = el.dataset.student;
            if (breaks[name]) {
                el.textContent = formatDuration(now - breaks[name].startTime);
            }
        });
    }

    function updateActiveCount() {
        const cls = state.currentClass;
        const breaks = getActiveBreaks(cls);
        const count = Object.keys(breaks).length;
        els.activeCount.textContent = count;
        els.activeBadge.classList.toggle('has-active', count > 0);
    }

    function startTimerLoop() {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(updateTimers, 1000);
    }

    // ===== STATS =====
    function renderStats() {
        const cls = state.currentClass;
        const history = getClassHistory(cls);
        const todayHistory = history.filter(h => isToday(h.startTime));

        els.statTotal.textContent = history.length;
        els.statToday.textContent = todayHistory.length;

        if (history.length > 0) {
            const avgMs = history.reduce((s, h) => s + h.duration, 0) / history.length;
            els.statAvgTime.textContent = formatDuration(avgMs);
            els.statRecord.textContent = formatDuration(Math.max(...history.map(h => h.duration)));
        } else {
            els.statAvgTime.textContent = '0:00';
            els.statRecord.textContent = '0:00';
        }

        // Visit leaderboard
        const students = state.classes[cls]?.students || [];
        const visitCounts = {};
        students.forEach(s => visitCounts[s] = 0);
        history.forEach(h => { if (visitCounts[h.student] !== undefined) visitCounts[h.student]++; });

        const sortedVisits = Object.entries(visitCounts).sort((a, b) => b[1] - a[1]);
        const maxV = sortedVisits.length > 0 ? sortedVisits[0][1] : 1;

        els.leaderboard.innerHTML = sortedVisits.length === 0
            ? `<div class="empty-state">${ICONS.empty}<div class="empty-state-text">Zadna data</div></div>`
            : sortedVisits.slice(0, 10).map(([name, count], i) => `
                <div class="leaderboard-item">
                    <div class="leaderboard-rank">${i + 1}</div>
                    <div class="leaderboard-name">${escapeHtml(name)}</div>
                    <div class="leaderboard-bar-wrap">
                        <div class="leaderboard-bar">
                            <div class="leaderboard-bar-fill" style="width:${maxV > 0 ? (count / maxV * 100) : 0}%"></div>
                        </div>
                    </div>
                    <div class="leaderboard-value">${count}x</div>
                </div>
            `).join('');

        // Time leaderboard
        const avgTimes = {};
        students.forEach(s => {
            const sh = getStudentHistory(cls, s);
            if (sh.length > 0) avgTimes[s] = sh.reduce((sum, h) => sum + h.duration, 0) / sh.length;
        });

        const sortedTimes = Object.entries(avgTimes).sort((a, b) => b[1] - a[1]);

        els.timeLeaderboard.innerHTML = sortedTimes.length === 0
            ? `<div class="empty-state">${ICONS.empty}<div class="empty-state-text">Zadna data</div></div>`
            : sortedTimes.slice(0, 10).map(([name, avg], i) => `
                <div class="leaderboard-item">
                    <div class="leaderboard-rank">${i + 1}</div>
                    <div class="leaderboard-name">${escapeHtml(name)}</div>
                    <div class="leaderboard-value">${formatDuration(avg)}</div>
                </div>
            `).join('');

        // History
        const sortedHistory = [...history].sort((a, b) => b.startTime - a.startTime);
        els.historyList.innerHTML = sortedHistory.length === 0
            ? `<div class="empty-state">${ICONS.empty}<div class="empty-state-text">Zadna historie</div></div>`
            : sortedHistory.slice(0, 50).map(h => `
                <div class="history-item">
                    <div class="history-dot"></div>
                    <div class="history-name">${escapeHtml(h.student)}</div>
                    <div class="history-time">${formatTime(h.startTime)} ${ICONS.arrowRight} ${formatTime(h.endTime)}</div>
                    <div class="history-duration">${formatDuration(h.duration)}</div>
                    <div class="history-date">${formatDate(h.startTime)}</div>
                </div>
            `).join('');
    }

    // ===== PREDICTIONS =====
    function renderPredictions() {
        const cls = state.currentClass;
        const history = getClassHistory(cls);
        const students = state.classes[cls]?.students || [];
        const now = Date.now();

        // Who goes next - scoring
        const scores = {};
        students.forEach(s => {
            const sh = getStudentHistory(cls, s);
            const freq = sh.length;
            const lastVisit = sh.length > 0 ? sh[sh.length - 1].startTime : 0;
            const hoursSinceLast = lastVisit > 0 ? (now - lastVisit) / (1000 * 60 * 60) : 999;
            const currentHour = new Date().getHours();
            const hourMatches = sh.filter(h => Math.abs(new Date(h.startTime).getHours() - currentHour) <= 1).length;
            scores[s] = (freq * 2 + hourMatches * 3) * (1 + 1 / (hoursSinceLast + 1));
        });

        const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
        const probabilities = Object.entries(scores)
            .map(([name, score]) => ({ name, prob: score / totalScore }))
            .sort((a, b) => b.prob - a.prob);

        els.nextPredictions.innerHTML = history.length === 0
            ? `<div class="empty-state">${ICONS.empty}<div class="empty-state-text">Potrebujeme vice dat</div></div>`
            : probabilities.slice(0, 8).map(p => `
                <div class="prediction-item">
                    <div class="prediction-prob">${Math.round(p.prob * 100)}%</div>
                    <div class="prediction-name">${escapeHtml(p.name)}</div>
                </div>
            `).join('');

        // Time predictions
        const timePredictions = [];
        students.forEach(s => {
            const sh = getStudentHistory(cls, s);
            if (sh.length >= 1) {
                let wSum = 0, dSum = 0;
                sh.forEach((h, i) => { const w = i + 1; wSum += w; dSum += h.duration * w; });
                timePredictions.push({ name: s, predicted: dSum / wSum, count: sh.length });
            }
        });
        timePredictions.sort((a, b) => b.predicted - a.predicted);

        els.timePredictions.innerHTML = timePredictions.length === 0
            ? `<div class="empty-state">${ICONS.empty}<div class="empty-state-text">Potrebujeme vice dat</div></div>`
            : timePredictions.slice(0, 8).map(p => `
                <div class="prediction-item">
                    <div class="prediction-prob">${formatDuration(p.predicted)}</div>
                    <div class="prediction-name">${escapeHtml(p.name)}</div>
                    <div class="prediction-detail">${p.count} navstev</div>
                </div>
            `).join('');

        // Hourly pattern
        const hourlyCounts = new Array(24).fill(0);
        history.forEach(h => hourlyCounts[new Date(h.startTime).getHours()]++);

        const relevantHours = [];
        for (let h = 7; h <= 17; h++) relevantHours.push(h);
        const maxHourly = Math.max(...relevantHours.map(h => hourlyCounts[h]), 1);
        const currentHour = new Date().getHours();

        els.hourlyChart.innerHTML = relevantHours.map(h => {
            const count = hourlyCounts[h];
            const height = Math.max((count / maxHourly) * 100, 4);
            const isNow = h === currentHour;
            return `
                <div class="hourly-bar-wrap">
                    <div class="hourly-value">${count > 0 ? count : ''}</div>
                    <div class="hourly-bar ${isNow ? 'highlight' : ''}" style="height:${height}%"></div>
                    <div class="hourly-label">${h}h</div>
                </div>`;
        }).join('');

        // Daily forecast
        const dayHistory = {};
        history.forEach(h => {
            const key = new Date(h.startTime).toDateString();
            dayHistory[key] = (dayHistory[key] || 0) + 1;
        });
        const dayValues = Object.values(dayHistory);
        const avgDaily = dayValues.length > 0 ? dayValues.reduce((a, b) => a + b, 0) / dayValues.length : 0;
        const todayCount = history.filter(h => isToday(h.startTime)).length;
        const expectedRemaining = Math.max(0, Math.round(avgDaily - todayCount));

        els.dailyForecast.innerHTML = `
            <div class="forecast-number">${Math.round(avgDaily) || '?'}</div>
            <div class="forecast-label">prumernych navstev za den</div>
            <div class="forecast-row">
                <div class="forecast-item">
                    <div class="forecast-item-value">${todayCount}</div>
                    <div class="forecast-item-label">dnes zatim</div>
                </div>
                <div class="forecast-item">
                    <div class="forecast-item-value">~${expectedRemaining}</div>
                    <div class="forecast-item-label">zbyva odhad</div>
                </div>
            </div>
            <div class="forecast-confidence">${dayValues.length > 5 ? 'Vysoka spolehlivost' : dayValues.length > 0 ? 'Nizka spolehlivost' : 'Zadna data'}</div>
        `;
    }

    // ===== SETTINGS =====
    function renderSettings() {
        const cls = state.currentClass;
        els.settingsClassName.textContent = cls;

        const classNames = Object.keys(state.classes).sort();
        els.classesList.innerHTML = classNames.map(name => `
            <div class="class-item">
                <div class="class-item-name">${escapeHtml(name)}</div>
                <div class="class-item-count">${state.classes[name].students.length} zaku</div>
                ${classNames.length > 1 ? `<button class="btn-icon" data-delete-class="${escapeHtml(name)}" title="Smazat">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14"/></svg>
                </button>` : ''}
            </div>
        `).join('');

        const students = sortByLastName(state.classes[cls]?.students || []);
        els.studentsListSettings.innerHTML = students.map(name => `
            <div class="student-item-settings">
                <div class="student-avatar" style="background:${getColor(name)};width:30px;height:30px;font-size:11px;border-radius:8px;">${escapeHtml(getInitials(name))}</div>
                <div class="student-item-name">${escapeHtml(name)}</div>
                <button class="btn-icon" data-delete-student="${escapeHtml(name)}" title="Odebrat">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14"/></svg>
                </button>
            </div>
        `).join('');

        // Delete class handlers
        els.classesList.querySelectorAll('[data-delete-class]').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.dataset.deleteClass;
                if (confirm(`Opravdu smazat tridu ${name}?`)) {
                    delete state.classes[name];
                    if (state.currentClass === name) state.currentClass = Object.keys(state.classes)[0];
                    saveState();
                    renderClassSelect();
                    renderSettings();
                    renderDashboard();
                }
            });
        });

        // Delete student handlers
        els.studentsListSettings.querySelectorAll('[data-delete-student]').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.dataset.deleteStudent;
                state.classes[cls].students = state.classes[cls].students.filter(s => s !== name);
                if (state.activeBreaks[cls]) delete state.activeBreaks[cls][name];
                saveState();
                renderSettings();
                renderDashboard();
            });
        });
    }

    // Add class
    els.addClassBtn.addEventListener('click', () => {
        const name = els.newClassName.value.trim();
        if (!name) return;
        if (state.classes[name]) { alert('Trida uz existuje.'); return; }
        state.classes[name] = { students: [] };
        state.currentClass = name;
        els.newClassName.value = '';
        saveState();
        renderClassSelect();
        renderSettings();
        renderDashboard();
    });
    els.newClassName.addEventListener('keydown', e => { if (e.key === 'Enter') els.addClassBtn.click(); });

    // Add student
    els.addStudentBtn.addEventListener('click', () => {
        const name = els.newStudentName.value.trim();
        if (!name) return;
        const cls = state.currentClass;
        if (state.classes[cls].students.includes(name)) { alert('Zak uz existuje.'); return; }
        state.classes[cls].students.push(name);
        state.classes[cls].students = sortByLastName(state.classes[cls].students);
        els.newStudentName.value = '';
        saveState();
        renderSettings();
        renderDashboard();
    });
    els.newStudentName.addEventListener('keydown', e => { if (e.key === 'Enter') els.addStudentBtn.click(); });

    // Export
    els.exportBtn.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zachodovatel-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // Clear history
    els.clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Opravdu smazat celou historii?')) {
            state.history = [];
            saveState();
            renderStats();
            renderDashboard();
        }
    });

    // Modal
    els.modalClose.addEventListener('click', () => els.modalOverlay.classList.remove('active'));
    els.modalOverlay.addEventListener('click', e => { if (e.target === els.modalOverlay) els.modalOverlay.classList.remove('active'); });

    // ===== INIT =====
    renderClassSelect();
    renderDashboard();
    startTimerLoop();
})();
