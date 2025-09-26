// 数据管理配置
const FILE_NAME = 'study_data.json';

// 初始数据
function createInitialData(weekCount = 7) {
    return Array(weekCount).fill(null).map((_, i) => ({
        weekid: i + 1,
        week_title: '',
        status: 'pending',
        hours: 1.5,
        session_time: '',
        summary: '',
        homework: ''
    }));
}

const initialData = createInitialData(7);

// 当前数据
let currentData = createInitialData(7);

// Make currentData and helper functions globally accessible
window.currentData = currentData;
window.createNewWeekSession = createNewWeekSession;
window.adjustDates = null; // Will be set after adjustDates function definition

// Show toast message
function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Load data from study_data.json
function loadFromJsonFile() {
    console.log('Attempting to load data from:', FILE_NAME);
    
    const xhr = new XMLHttpRequest();
    xhr.open('GET', FILE_NAME, true);
    
    xhr.onload = function() {
        console.log('XHR response status:', xhr.status);
        console.log('XHR response type:', xhr.getResponseHeader('Content-Type'));
        
        if (xhr.status === 200) {
            try {
                console.log('Raw response:', xhr.responseText);
                const data = JSON.parse(xhr.responseText);
                console.log('Parsed data:', data);
                
                if (Array.isArray(data)) {
                    currentData = data;
                    window.currentData = currentData; // Sync global reference
                    updatePageData(data);
                    console.log('Data loaded and updated successfully');
                    showToast('Data loaded successfully!');
                } else {
                    console.error('Invalid data format:', data);
                    throw new Error('Invalid data format');
                }
            } catch (error) {
                console.error('Error parsing data:', error);
                currentData = createInitialData(7);
                window.currentData = currentData; // Sync global reference
                updatePageData(currentData);
                showToast('Error loading data, using initial data');
            }
        } else {
            console.error('Failed to load data, status:', xhr.status);
            currentData = createInitialData(7);
            window.currentData = currentData; // Sync global reference
            updatePageData(currentData);
            showToast('Failed to load data, using initial data');
        }
    };
    
    xhr.onerror = function(error) {
        console.error('XHR error:', error);
        currentData = createInitialData(7);
        window.currentData = currentData; // Sync global reference
        updatePageData(currentData);
        showToast('Error loading data, using initial data');
    };
    
    xhr.send();
}

// 保存数据到本地文件
function saveToFile(data) {
    try {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // 创建下载链接
        const link = document.createElement('a');
        link.href = url;
        link.download = FILE_NAME;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // 更新当前数据
        currentData = data;
        console.log('Data saved successfully. Please update the currentData in save_data.js with the following content:');
        console.log(jsonString);
        showToast('Data saved successfully!');
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        showToast('Error saving data!');
        return false;
    }
}

// 从本地文件加载数据
function loadFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                resolve(data);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                reject(error);
            }
        };
        
        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            reject(error);
        };
        
        reader.readAsText(file);
    });
}

// 验证密码
function verifyPassword() {
    const DEFAULT_PASSWORD = '1';
    const password = prompt('Please enter password to import data:');
    return password === DEFAULT_PASSWORD;
}

// 处理文件上传
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        loadFromFile(file)
            .then(data => {
                // 更新当前数据
                currentData = data;
                // 更新服务器上的文件
                return fetch('/update_data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data, null, 2)
                });
            })
            .then(response => response.json())
            .then(result => {
                if (result.status === 'success') {
                    showToast('Data imported successfully! Reloading page...');
                    // 重新加载页面
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000); // 等待1秒后重新加载，让用户看到成功消息
                } else {
                    throw new Error('Server update failed');
                }
            })
            .catch(error => {
                console.error('Failed to import data:', error);
                showToast('Failed to import data. Please check the file format.');
            });
    }
}

// 调整日期
function adjustDates(changedIndex) {
    console.log('Adjusting dates starting from index:', changedIndex);
    const sessions = document.querySelectorAll('.session');
    
    // 检查修改的日期是否有效
    const changedDateInput = sessions[changedIndex]?.querySelector('input[type="datetime-local"]');
    if (!changedDateInput || !changedDateInput.value) {
        console.error('Invalid date input at index:', changedIndex);
        return;
    }
    
    const changedDate = new Date(changedDateInput.value);
    if (isNaN(changedDate.getTime())) {
        console.error('Invalid date value:', changedDateInput.value);
        return;
    }

    // 计算原始日期间隔（基于初始数据）
    const originalIntervals = [];
    for (let i = 1; i < sessions.length; i++) {
        const prevDate = new Date(sessions[i-1].querySelector('input[type="datetime-local"]').value);
        const currDate = new Date(sessions[i].querySelector('input[type="datetime-local"]').value);
        if (prevDate && currDate && !isNaN(prevDate.getTime()) && !isNaN(currDate.getTime())) {
            const daysDiff = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
            originalIntervals.push(daysDiff);
        }
    }
    console.log('Original intervals:', originalIntervals);
    
    // 从修改的课程开始，更新后续所有课程的日期
    let currentDate = new Date(changedDate);
    let lastValidDate = new Date(changedDate);
    
    // 更新后续日期
    for (let i = changedIndex + 1; i < sessions.length; i++) {
        const currentSession = sessions[i];
        if (!currentSession) {
            console.error('Missing session element at index:', i);
            continue;
        }
        
        const currentDateInput = currentSession.querySelector('input[type="datetime-local"]');
        if (!currentDateInput) {
            console.error('Missing date input at index:', i);
            continue;
        }
        
        // 使用原始间隔计算新日期
        const interval = originalIntervals[i-1] || 7; // 如果没有原始间隔，默认使用7天
        currentDate = new Date(lastValidDate);
        currentDate.setDate(currentDate.getDate() + interval);
        
        // 确保新日期大于前一个日期
        if (currentDate <= lastValidDate) {
            currentDate = new Date(lastValidDate);
            currentDate.setDate(currentDate.getDate() + 1); // 至少加一天
        }
        
        // 保持原始时间
        const originalTime = currentDateInput.value.split('T')[1];
        
        // 更新日期输入框，保持原始时间
        const newDateStr = currentDate.toISOString().split('T')[0] + 'T' + originalTime;
        currentDateInput.value = newDateStr;
        
        // 更新当前数据中的日期
        if (i < currentData.length) {
            currentData[i].session_time = newDateStr;
        }
        
        // 更新最后有效日期
        lastValidDate = new Date(currentDate);
        
        console.log(`Updated date for session ${i} to:`, newDateStr, `(interval: ${interval} days)`);
    }
    
    // 更新当前数据中的修改日期
    if (changedIndex < currentData.length) {
        currentData[changedIndex].session_time = changedDateInput.value;
    }
}

// Make adjustDates globally accessible
window.adjustDates = adjustDates;

// 添加日期变更监听器
function addDateChangeListeners() {
    document.querySelectorAll('input[type="datetime-local"]').forEach((dateInput, index) => {
        if (!dateInput) {
            console.error('Missing date input at index:', index);
            return;
        }
        
        // Remove existing event listeners to avoid duplicates
        dateInput.removeEventListener('change', dateInput._changeHandler);
        
        // Create new change handler
        dateInput._changeHandler = () => {
            if (!dateInput.value) {
                console.error('Empty date value at index:', index);
                return;
            }
            
            // 更新当前数据中的日期 (需要检查数组范围)
            if (index < currentData.length) {
                currentData[index].session_time = dateInput.value;
            }
            // 调整后续日期
            adjustDates(index);
        };
        
        dateInput.addEventListener('change', dateInput._changeHandler);
    });
}

// Helper: Convert URLs to clickable links and preserve line breaks
function formatTextWithLinks(text) {
    if (!text) return '';
    // Convert URLs to links
    const urlRegex = /(https?:\/\/[\w\-\.\/?#&=;%+~:@!$'()*\[\],]+)/g;
    let html = text.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
    // Convert newlines to <br>
    html = html.replace(/\n/g, '<br>');
    return html;
}

// 创建新的周会话DOM元素
function createNewWeekSession(weekNumber, weekData) {
    // Create new week dot in progress indicator
    const progressIndicator = document.querySelector('.progress-indicator');
    if (!progressIndicator) {
        console.error('Progress indicator not found');
        return null;
    }
    
    const newWeekDot = document.createElement('div');
    newWeekDot.className = 'week-dot';
    newWeekDot.title = `Week ${weekNumber}`;
    progressIndicator.appendChild(newWeekDot);
    
    // Calculate session date if not provided
    let sessionDate = weekData.session_time;
    if (!sessionDate) {
        const existingSessions = document.querySelectorAll('.session');
        if (existingSessions.length > 0) {
            const lastSession = existingSessions[existingSessions.length - 1];
            const lastDateInput = lastSession.querySelector('input[type="datetime-local"]');
            if (lastDateInput && lastDateInput.value) {
                const lastDate = new Date(lastDateInput.value);
                lastDate.setDate(lastDate.getDate() + 7);
                sessionDate = lastDate.toISOString().slice(0, 16);
            }
        }
    }
    
    // Create new session element
    const newSession = document.createElement('div');
    newSession.className = 'session';
    newSession.setAttribute('data-week', weekNumber);
    
    newSession.innerHTML = `
        <h3>
            <span class="week-title-text">${weekData.week_title || `Week ${weekNumber}: New Topic`}</span>
            <input class="week-title-input" type="text" style="display:none;" value="${weekData.week_title || `Week ${weekNumber}: New Topic`}" />
            <span class="status-badge ${weekData.status || 'pending'}">${weekData.status === 'completed' ? 'Completed' : 'Pending'}</span>
        </h3>
        <div class="session-info">
            <div class="form-group">
                <label>Hours:</label>
                <input type="text" value="${weekData.hours || 1.5}" readonly>
            </div>
            <div class="form-group">
                <label>Session Time:</label>
                <input type="datetime-local" value="${sessionDate || ''}">
            </div>
        </div>
        <div class="form-group">
            <div class="section-label">
                <span class="section-icon">📝</span>
                <span class="section-title">Summary</span>
            </div>
            <div class="summary-view" style="display:block;"></div>
            <textarea class="summary-textarea" style="display:none;" readonly>${weekData.summary || ''}</textarea>
        </div>
        <div class="form-group">
            <div class="section-label">
                <span class="section-icon">📚</span>
                <span class="section-title">Homework</span>
            </div>
            <div class="homework-view" style="display:block;"></div>
            <textarea class="homework-input" style="display:none;" readonly>${weekData.homework || ''}</textarea>
        </div>
    `;
    
    // Insert the new session into phase 1
    const phase1Content = document.getElementById('phase-1');
    if (!phase1Content) {
        console.error('Phase 1 content not found');
        return null;
    }
    
    const existingSessions = phase1Content.querySelectorAll('.session');
    if (existingSessions.length > 0) {
        const lastSession = existingSessions[existingSessions.length - 1];
        lastSession.parentNode.insertBefore(newSession, lastSession.nextSibling);
    } else {
        // If no sessions exist, insert after header
        const header = phase1Content.querySelector('header');
        if (header) {
            header.parentNode.insertBefore(newSession, header.nextSibling);
        } else {
            phase1Content.appendChild(newSession);
        }
    }
    
    // Set status classes
    if (weekData.status === 'completed') {
        newSession.classList.add('completed');
        newWeekDot.classList.add('completed');
    }
    
    // Update the view content with formatted text
    const summaryView = newSession.querySelector('.summary-view');
    const homeworkView = newSession.querySelector('.homework-view');
    if (summaryView) {
        summaryView.innerHTML = formatTextWithLinks(weekData.summary || '');
    }
    if (homeworkView) {
        homeworkView.innerHTML = formatTextWithLinks(weekData.homework || '');
    }
    
    // Add click event to new week dot
    newWeekDot.addEventListener('click', () => {
        document.querySelectorAll('.week-dot').forEach(d => d.classList.remove('active'));
        newWeekDot.classList.add('active');
        newSession.scrollIntoView({ behavior: 'smooth' });
    });
    
    return newSession;
}

// 更新页面数据
function updatePageData(data) {
    console.log('Updating page with data:', data);
    
    // 更新 currentData 以匹配新数据
    currentData = data;
    window.currentData = currentData; // Sync global reference
    
    // 如果数据中的周数多于DOM中的session，需要动态创建新的session
    const existingSessions = document.querySelectorAll('.session');
    const existingWeekDots = document.querySelectorAll('.week-dot');
    
    // Create missing week sessions
    for (let i = existingSessions.length; i < data.length; i++) {
        try {
            console.log(`Creating new week session for week ${i + 1}`);
            const newSession = createNewWeekSession(i + 1, data[i]);
            if (!newSession) {
                console.error(`Failed to create session for week ${i + 1}`);
            }
        } catch (error) {
            console.error(`Error creating week session ${i + 1}:`, error);
        }
    }
    
    data.forEach((week, index) => {
        const session = document.querySelectorAll('.session')[index];
        if (session) {
            // Update week title
            const titleSpan = session.querySelector('.week-title-text');
            const titleInput = session.querySelector('.week-title-input');
            if (titleSpan) titleSpan.textContent = week.week_title || '';
            if (titleInput) titleInput.value = week.week_title || '';
            // Update summary
            const summaryTextarea = session.querySelector('.summary-textarea');
            const summaryView = session.querySelector('.summary-view');
            if (summaryTextarea) summaryTextarea.value = week.summary || '';
            if (summaryView) summaryView.innerHTML = formatTextWithLinks(week.summary || '');
            // Update homework
            const homeworkTextarea = session.querySelector('.homework-input');
            const homeworkView = session.querySelector('.homework-view');
            if (homeworkTextarea) homeworkTextarea.value = week.homework || '';
            if (homeworkView) homeworkView.innerHTML = formatTextWithLinks(week.homework || '');
            // Update status
            session.dataset.status = week.status;
            const statusBadge = session.querySelector('.status-badge');
            const weekDot = document.querySelectorAll('.week-dot')[index];
            if (statusBadge) {
                if (week.status === 'completed') {
                    session.classList.add('completed');
                    statusBadge.textContent = 'Completed';
                    statusBadge.classList.remove('pending');
                    statusBadge.classList.add('completed');
                    if (weekDot) weekDot.classList.add('completed');
                } else {
                    session.classList.remove('completed');
                    statusBadge.textContent = 'Pending';
                    statusBadge.classList.remove('completed');
                    statusBadge.classList.add('pending');
                    if (weekDot) weekDot.classList.remove('completed');
                }
            }
            // Update session time
            const dateInput = session.querySelector('input[type="datetime-local"]');
            if (dateInput && week.session_time) {
                dateInput.value = week.session_time;
            }
        }
    });
    addDateChangeListeners();
}

// 导出当前数据
function exportCurrentData() {
    console.log('Exporting current data...');
    const sessions = document.querySelectorAll('.session');
    const data = Array.from(sessions).map((session, index) => {
        const summaryTextarea = session.querySelector('.summary-textarea');
        const homeworkTextarea = session.querySelector('.homework-input');
        const statusBadge = session.querySelector('.status-badge');
        const dateInput = session.querySelector('input[type="datetime-local"]');
        const weekTitleInput = session.querySelector('.week-title-input');
        const weekTitleSpan = session.querySelector('.week-title-text');
        return {
            weekid: index + 1,
            week_title: weekTitleInput && weekTitleInput.style.display !== 'none' ? weekTitleInput.value : (weekTitleSpan ? weekTitleSpan.textContent.trim() : ''),
            status: statusBadge ? statusBadge.textContent.toLowerCase() : 'pending',
            hours: 1.5,
            session_time: dateInput ? dateInput.value : '',
            summary: summaryTextarea ? summaryTextarea.value : '',
            homework: homeworkTextarea ? homeworkTextarea.value : ''
        };
    });
    try {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = FILE_NAME;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        fetch('/update_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: jsonString
        })
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                currentData = data;
                window.currentData = currentData; // Sync global reference
                showToast('Data exported and saved successfully!');
            } else {
                throw new Error('Server update failed');
            }
        })
        .catch(error => {
            showToast('Error updating server, but file was downloaded!');
        });
    } catch (error) {
        showToast('Error exporting data!');
    }
}

// 添加文件上传监听器
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, loading data...');
    // Load data from study_data.json
    loadFromJsonFile();
}); 