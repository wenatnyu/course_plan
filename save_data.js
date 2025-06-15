// 数据管理配置
const FILE_NAME = 'study_data.json';

// 初始数据
const initialData = {
    "homework": Array(7).fill(null),
    "status": Array(7).fill("pending")
};

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
        
        console.log('Data saved successfully. Please update the JSON file manually.');
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
                // 更新页面数据
                updatePageData(data);
                console.log('Data loaded successfully');
            })
            .catch(error => {
                console.error('Failed to load data:', error);
                alert('Failed to load data. Please check the file format.');
            });
    }
}

// 更新页面数据
function updatePageData(data) {
    // 更新作业内容
    data.homework.forEach((item, index) => {
        if (item) {
            const textarea = document.querySelector(`#homework-${index}`);
            if (textarea) {
                textarea.value = item.text || '';
            }
        }
    });
    
    // 更新状态
    data.status.forEach((status, index) => {
        const session = document.querySelector(`#session-${index}`);
        if (session) {
            session.dataset.status = status;
            updateStatusDisplay(session);
        }
    });
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
        const session = document.querySelector(`#session-${i}`);
        if (textarea && session) {
            data.homework[i] = {
                text: textarea.value,
                timestamp: new Date().toISOString()
            };
            data.status[i] = session.dataset.status;
        }
    }
    
    saveToFile(data);
}

// 添加文件上传监听器
document.addEventListener('DOMContentLoaded', () => {
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