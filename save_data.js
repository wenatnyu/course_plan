// 数据管理配置
const STORAGE_KEY = 'study_data';

// 初始数据
const initialData = {
    "homework": Array(7).fill(null),
    "status": Array(7).fill("pending")
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

// Load data from localStorage
function loadData() {
    console.log('Loading data from localStorage...');
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            const data = JSON.parse(savedData);
            console.log('Loaded data:', data);
            
            if (data && typeof data === 'object') {
                // Ensure data has the correct structure
                if (!data.homework || !data.status) {
                    console.error('Invalid data structure:', data);
                    throw new Error('Invalid data structure');
                }
                
                currentData = data;
                updatePageData(data);
                console.log('Data loaded and updated successfully');
                showToast('Data loaded successfully!');
            } else {
                throw new Error('Invalid data format');
            }
        } else {
            console.log('No saved data found, using initial data');
            currentData = initialData;
            updatePageData(initialData);
        }
    } catch (error) {
        console.error('Error loading data:', error);
        currentData = initialData;
        updatePageData(initialData);
        showToast('Error loading data, using initial data');
    }
}

// Save data to localStorage
function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.log('Data saved to localStorage:', data);
        showToast('Data saved successfully!');
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        showToast('Error saving data!');
        return false;
    }
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
        link.download = 'study_data.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // 更新当前数据
        currentData = data;
        saveData(data); // Also save to localStorage
        console.log('Data saved successfully. File downloaded.');
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
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

// 处理文件上传
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        loadFromFile(file)
            .then(data => {
                // 更新当前数据
                currentData = data;
                // 保存到 localStorage
                saveData(data);
                // 更新页面
                updatePageData(data);
                showToast('Data imported successfully!');
            })
            .catch(error => {
                console.error('Failed to load data:', error);
                alert('Failed to load data. Please check the file format.');
            });
    }
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
}

// Save homework content
function saveHomework(index) {
    const session = document.querySelectorAll('.session')[index];
    const homeworkInput = session.querySelector('.homework-input');
    const homeworkContent = session.querySelector('.homework-content');
    const fileInput = session.querySelector('.file-input');
    
    // Prepare homework data
    const homeworkData = {
        text: homeworkInput.value,
        files: fileInput.files ? Array.from(fileInput.files).map(f => f.name) : [],
        timestamp: new Date().toISOString()
    };
    
    // Update current data
    currentData.homework[index] = homeworkData;
    
    // Save to localStorage
    saveData(currentData);
    
    // Display saved content
    homeworkContent.innerHTML = `
        <h4>Saved Homework:</h4>
        <p>${homeworkInput.value}</p>
        ${homeworkData.files.length ? `
            <h4>Attached Files:</h4>
            <ul>
                ${homeworkData.files.map(f => `<li>${f}</li>`).join('')}
            </ul>
        ` : ''}
        <p><small>Last updated: ${new Date(homeworkData.timestamp).toLocaleString()}</small></p>
    `;
    homeworkContent.classList.add('show');
    
    showToast('Homework saved successfully!');
}

// Mark as completed
function markAsCompleted(index) {
    // Update current data
    currentData.status[index] = 'completed';
    
    // Save to localStorage
    saveData(currentData);
    
    const session = document.querySelectorAll('.session')[index];
    const statusBadge = session.querySelector('.status-badge');
    const weekDot = document.querySelectorAll('.week-dot')[index];
    
    session.classList.add('completed');
    statusBadge.textContent = 'Completed';
    statusBadge.classList.remove('pending');
    statusBadge.classList.add('completed');
    weekDot.classList.add('completed');
    
    showToast('Marked as completed!');
}

// 导出当前数据
function exportCurrentData() {
    const data = {
        homework: Array(7).fill(null),
        status: Array(7).fill("pending")
    };
    
    // 收集作业内容
    for (let i = 0; i < 7; i++) {
        const textarea = document.querySelector(`#homework-${i}`);
        const session = document.querySelectorAll('.session')[i];
        if (textarea && session) {
            data.homework[i] = {
                text: textarea.value,
                timestamp: new Date().toISOString()
            };
            data.status[i] = session.dataset.status;
        }
    }
    
    // 保存到文件并下载
    saveToFile(data);
}

// 添加文件上传监听器
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, loading data...');
    // Load data from localStorage
    loadData();

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', handleFileUpload);
    document.body.appendChild(fileInput);
    
    // 添加导入按钮
    const importButton = document.createElement('button');
    importButton.textContent = 'Import Data';
    importButton.onclick = () => fileInput.click();
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