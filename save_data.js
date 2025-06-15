// 数据管理配置
const FILE_NAME = 'study_data.json';

// 初始数据
const initialData = {
    "homework": Array(7).fill(null),
    "status": Array(7).fill("pending"),
    "dates": Array(7).fill(null)
};

// 当前数据
let currentData = {
    "homework": [
        null,
        null,
        null,
        null,
        null,
        null,
        null
    ],
    "status": [
        "pending",
        "pending",
        "pending",
        "pending",
        "pending",
        "pending",
        "pending"
    ],
    "dates": [
        null,
        null,
        null,
        null,
        null,
        null,
        null
    ]
};

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
                
                if (data && typeof data === 'object') {
                    // 确保数据有正确的结构
                    if (!data.homework || !data.status) {
                        console.error('Invalid data structure:', data);
                        throw new Error('Invalid data structure');
                    }
                    
                    // 如果缺少dates字段，添加它
                    if (!data.dates) {
                        data.dates = Array(7).fill(null);
                    }
                    
                    // 转换字符串作业项为对象（如果需要）
                    data.homework = data.homework.map(item => {
                        if (typeof item === 'string') {
                            return {
                                text: item,
                                timestamp: new Date().toISOString()
                            };
                        }
                        return item;
                    });
                    
                    console.log('Processed data:', data);
                    currentData = data;
                    updatePageData(data);
                    console.log('Data loaded and updated successfully');
                    showToast('Data loaded successfully!');
                } else {
                    console.error('Invalid data format:', data);
                    throw new Error('Invalid data format');
                }
            } catch (error) {
                console.error('Error parsing data:', error);
                currentData = initialData;
                updatePageData(initialData);
                showToast('Error loading data, using initial data');
            }
        } else {
            console.error('Failed to load data, status:', xhr.status);
            currentData = initialData;
            updatePageData(initialData);
            showToast('Failed to load data, using initial data');
        }
    };
    
    xhr.onerror = function(error) {
        console.error('XHR error:', error);
        currentData = initialData;
        updatePageData(initialData);
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
        currentData.dates[i] = newDateStr;
        
        // 更新最后有效日期
        lastValidDate = new Date(currentDate);
        
        console.log(`Updated date for session ${i} to:`, newDateStr, `(interval: ${interval} days)`);
    }
    
    // 更新当前数据中的修改日期
    currentData.dates[changedIndex] = changedDateInput.value;
}

// 添加日期变更监听器
function addDateChangeListeners() {
    document.querySelectorAll('input[type="datetime-local"]').forEach((dateInput, index) => {
        if (!dateInput) {
            console.error('Missing date input at index:', index);
            return;
        }
        
        dateInput.addEventListener('change', () => {
            if (!dateInput.value) {
                console.error('Empty date value at index:', index);
                return;
            }
            
            // 更新当前数据中的日期
            currentData.dates[index] = dateInput.value;
            // 调整后续日期
            adjustDates(index);
        });
    });
}

// 更新页面数据
function updatePageData(data) {
    console.log('Updating page with data:', data);
    
    // 更新作业内容
    data.homework.forEach((item, index) => {
        if (item) {
            const session = document.querySelectorAll('.session')[index];
            if (session) {
                const textarea = session.querySelector('.homework-input');
                const homeworkContent = session.querySelector('.homework-content');
                
                if (textarea) {
                    textarea.value = typeof item === 'string' ? item : (item.text || '');
                    console.log(`Updated homework ${index}:`, textarea.value);
                }
                
                if (homeworkContent) {
                    homeworkContent.innerHTML = `
                        <h4>Saved Homework:</h4>
                        <p>${textarea.value}</p>
                        <p><small>Last updated: ${new Date().toISOString()}</small></p>
                    `;
                    homeworkContent.classList.add('show');
                }
            }
        }
    });
    
    // 更新状态
    data.status.forEach((status, index) => {
        const session = document.querySelectorAll('.session')[index];
        if (session) {
            session.dataset.status = status;
            const statusBadge = session.querySelector('.status-badge');
            const weekDot = document.querySelectorAll('.week-dot')[index];
            
            if (status === 'completed') {
                session.classList.add('completed');
                statusBadge.textContent = 'Completed';
                statusBadge.classList.remove('pending');
                statusBadge.classList.add('completed');
                weekDot.classList.add('completed');
                console.log(`Updated status ${index} to completed`);
            }
        }
    });

    // 更新日期
    if (data.dates) {
        data.dates.forEach((date, index) => {
            const session = document.querySelectorAll('.session')[index];
            if (session && date) {
                const dateInput = session.querySelector('input[type="datetime-local"]');
                if (dateInput) {
                    dateInput.value = date;
                }
            }
        });
    }

    // 添加日期变更监听器
    addDateChangeListeners();
}

// 导出当前数据
function exportCurrentData() {
    console.log('Exporting current data...');
    
    const data = {
        homework: Array(7).fill(null),
        status: Array(7).fill("pending"),
        dates: Array(7).fill(null)
    };
    
    // 收集作业内容、状态和日期
    document.querySelectorAll('.session').forEach((session, index) => {
        const textarea = session.querySelector('.homework-input');
        const statusBadge = session.querySelector('.status-badge');
        const dateInput = session.querySelector('input[type="datetime-local"]');
        
        if (textarea) {
            data.homework[index] = {
                text: textarea.value,
                timestamp: new Date().toISOString()
            };
        }
        
        if (statusBadge) {
            data.status[index] = statusBadge.textContent.toLowerCase();
        }

        if (dateInput) {
            data.dates[index] = dateInput.value;
            // 确保当前数据中的日期也是最新的
            currentData.dates[index] = dateInput.value;
        }
    });
    
    console.log('Collected data for export:', data);
    
    // 保存到文件并下载
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
        
        // 更新服务器上的文件
        fetch('/update_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: jsonString
        })
        .then(response => response.json())
        .then(result => {
            console.log('Server update result:', result);
            if (result.status === 'success') {
                // 更新当前数据
                currentData = data;
                console.log('Data exported and server updated successfully:', data);
                showToast('Data exported and saved successfully!');
            } else {
                throw new Error('Server update failed');
            }
        })
        .catch(error => {
            console.error('Error updating server:', error);
            showToast('Error updating server, but file was downloaded!');
        });
    } catch (error) {
        console.error('Error exporting data:', error);
        showToast('Error exporting data!');
    }
}

// 添加文件上传监听器
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, loading data...');
    // Load data from study_data.json
    loadFromJsonFile();

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', handleFileUpload);
    document.body.appendChild(fileInput);
    
    // 添加导入按钮
    const importButton = document.createElement('button');
    importButton.textContent = 'Import Data';
    importButton.onclick = () => {
        // 先验证密码
        if (verifyPassword()) {
            fileInput.click();
        } else {
            showToast('Incorrect password!');
        }
    };
    importButton.style.position = 'fixed';
    importButton.style.bottom = '20px';
    importButton.style.right = '20px';
    importButton.style.zIndex = '1000';
    document.body.appendChild(importButton);
    
    // 添加导出按钮
    const exportButton = document.createElement('button');
    exportButton.textContent = 'Export Data';
    exportButton.onclick = exportCurrentData;
    exportButton.style.position = 'fixed';
    exportButton.style.bottom = '20px';
    exportButton.style.right = '120px';
    exportButton.style.zIndex = '1000';
    document.body.appendChild(exportButton);
}); 