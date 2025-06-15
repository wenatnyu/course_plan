// GitHub API 配置
const GITHUB_TOKEN = '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'; // 需要填入您的 GitHub Personal Access Token
const REPO_OWNER = 'wenatnyu'; // 需要填入您的 GitHub 用户名
const REPO_NAME = 'study_plan'; // 需要填入您的仓库名
const FILE_PATH = 'data.json'; // 数据文件路径

// 初始数据
const initialData = {
    "homework": Array(7).fill(null),
    "status": Array(7).fill("pending")
};

// 创建仓库
async function createRepository() {
    try {
        const response = await fetch(`https://api.github.com/user/repos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                name: REPO_NAME,
                description: 'Study plan tracking repository',
                private: false,
                auto_init: true
            })
        });

        if (!response.ok) {
            const error = await response.json();
            if (error.message.includes('already exists')) {
                console.log('Repository already exists');
                return true;
            }
            throw new Error(`Failed to create repository: ${error.message}`);
        }

        console.log('Repository created successfully');
        return true;
    } catch (error) {
        console.error('Error creating repository:', error);
        throw error;
    }
}

// 保存数据到 GitHub
async function saveToGitHub(data) {
    try {
        // 确保仓库存在
        await createRepository();

        // 获取当前文件内容
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        let fileData;
        if (response.status === 404) {
            // 文件不存在，创建新文件
            fileData = { sha: null };
        } else {
            fileData = await response.json();
        }
        
        // 更新内容
        const newContent = JSON.stringify(data, null, 2);
        const base64Content = btoa(unescape(encodeURIComponent(newContent)));
        
        // 提交更新
        const updateResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: 'Update study data',
                content: base64Content,
                sha: fileData.sha
            })
        });
        
        if (!updateResponse.ok) {
            throw new Error(`Failed to save data: ${updateResponse.statusText}`);
        }
        
        const result = await updateResponse.json();
        return result;
    } catch (error) {
        console.error('Error saving to GitHub:', error);
        throw error;
    }
}

// 从 GitHub 加载数据
async function loadFromGitHub() {
    try {
        // 确保仓库存在
        await createRepository();

        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.status === 404) {
            // 文件不存在，创建新文件并返回初始数据
            await saveToGitHub(initialData);
            return initialData;
        }
        
        if (!response.ok) {
            throw new Error(`Failed to load data: ${response.statusText}`);
        }
        
        const fileData = await response.json();
        const content = decodeURIComponent(escape(atob(fileData.content)));
        return JSON.parse(content);
    } catch (error) {
        console.error('Error loading from GitHub:', error);
        // 如果加载失败，返回初始数据
        return initialData;
    }
} 