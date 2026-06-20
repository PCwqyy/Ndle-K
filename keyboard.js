/**
 * Wordle 软键盘类
 * 管理键盘布局、事件处理和视觉反馈
 */
class WordleKeyboard {
    /**
     * 构造函数
     * @param {string} containerId - 键盘容器的DOM元素ID
     * @param {object} options - 配置选项
     */
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`容器元素 #${containerId} 不存在`);
        }

        // 键盘布局
        this.layout = options.layout || [
            ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
            ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
            ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace']
        ];

        // 键盘配置
        this.keySize = options.keySize || '45px';
        this.keyGap = options.keyGap || '4px';
        this.keyColor = options.keyColor || {
            default: '#818384',
            absent: '#3a3a3c',
            present: '#b59f3b',
            correct: '#538d4e'
        };

        // 状态
        this.letterStatus = {}; // { 'a': 'correct', 'b': 'present', ... }
        this.onKeyPress = null; // 按键回调函数
        this.onKeyDown = null;  // 物理键盘回调
        this.keyElements = {};  // 存储所有按键元素引用

        // 初始化
        this.init();
        this.bindPhysicalKeyboard();
    }

    /**
     * 初始化键盘
     */
    init() {
        this.container.innerHTML = '';
        this.keyElements = {};

        // 创建键盘
        this.layout.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';
            rowDiv.style.cssText = `
                display: flex;
                justify-content: center;
                margin-bottom: ${this.keyGap};
                gap: ${this.keyGap};
            `;

            row.forEach(key => {
                const keyElement = this.createKey(key);
                rowDiv.appendChild(keyElement);
                this.keyElements[key] = keyElement;
            });

            this.container.appendChild(rowDiv);
        });

        // 绑定事件
        this.bindEvents();
    }

    /**
     * 创建单个按键
     * @param {string} key - 按键标签
     * @returns {HTMLElement} 按键元素
     */
    createKey(key) {
        const button = document.createElement('button');
        button.className = 'key';
        button.dataset.key = key;
        
        // 设置文本
        const displayKey = this.getDisplayText(key);
        button.textContent = displayKey;

        // 设置样式
        const isSpecial = ['enter', 'backspace'].includes(key);
        const width = isSpecial ? '65px' : this.keySize;
        
        button.style.cssText = `
            width: ${width};
            height: 58px;
            border: none;
            border-radius: 4px;
            background-color: ${this.keyColor.default};
            color: white;
            font-size: ${isSpecial ? '12px' : '14px'};
            font-weight: bold;
            cursor: pointer;
            text-transform: uppercase;
            transition: all 0.1s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        `;

        // 特殊按键图标
        if (key === 'backspace') {
            button.innerHTML = '⌫';
            button.style.fontSize = '20px';
        } else if (key === 'enter') {
            button.textContent = '↵';
            button.style.fontSize = '20px';
        }

        // 物理键盘映射
        if (key === 'backspace') {
            button.dataset.physicalKey = 'Backspace';
        } else if (key === 'enter') {
            button.dataset.physicalKey = 'Enter';
        } else {
            button.dataset.physicalKey = key;
        }

        return button;
    }

    /**
     * 获取按键显示文本
     * @param {string} key - 按键标识
     * @returns {string} 显示文本
     */
    getDisplayText(key) {
        const specialKeys = {
            'enter': '↵',
            'backspace': '⌫'
        };
        return specialKeys[key] || key.toUpperCase();
    }

    /**
     * 绑定键盘事件
     */
    bindEvents() {
        // 点击事件
        this.container.addEventListener('click', (e) => {
            const keyElement = e.target.closest('.key');
            if (!keyElement) return;

            const key = keyElement.dataset.key;
            if (this.onKeyPress) {
                this.onKeyPress(key);
            }

            // 点击动画
            this.animateKey(keyElement);
        });

        // 触摸设备支持
        this.container.addEventListener('touchstart', (e) => {
            const keyElement = e.target.closest('.key');
            if (!keyElement) return;

            // 防止触发页面滚动
            e.preventDefault();
            
            const key = keyElement.dataset.key;
            if (this.onKeyPress) {
                this.onKeyPress(key);
            }

            this.animateKey(keyElement);
        }, { passive: false });

        // 鼠标悬停效果
        this.container.addEventListener('mouseenter', (e) => {
            const keyElement = e.target.closest('.key');
            if (keyElement) {
                keyElement.style.transform = 'scale(1.05)';
            }
        }, true);

        this.container.addEventListener('mouseleave', (e) => {
            const keyElement = e.target.closest('.key');
            if (keyElement) {
                keyElement.style.transform = 'scale(1)';
            }
        }, true);
    }

    /**
     * 按键点击动画
     * @param {HTMLElement} keyElement - 按键元素
     */
    animateKey(keyElement) {
        keyElement.style.transform = 'scale(0.9)';
        setTimeout(() => {
            keyElement.style.transform = 'scale(1)';
        }, 100);
    }

    /**
     * 绑定物理键盘输入
     */
    bindPhysicalKeyboard() {
        document.addEventListener('keydown', (e) => {
            // 忽略输入框中的输入
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            const key = e.key.toLowerCase();

            // 处理字母键
            if (key >= 'a' && key <= 'z' && key.length === 1) {
                e.preventDefault();
                if (this.onKeyDown) {
                    this.onKeyDown(key);
                }
                // 触发按键动画
                const keyElement = this.keyElements[key];
                if (keyElement) {
                    this.animateKey(keyElement);
                }
                return;
            }

            // 处理特殊键
            if (e.key === 'Enter') {
                e.preventDefault();
                if (this.onKeyDown) {
                    this.onKeyDown('enter');
                }
                const keyElement = this.keyElements['enter'];
                if (keyElement) this.animateKey(keyElement);
                return;
            }

            if (e.key === 'Backspace') {
                e.preventDefault();
                if (this.onKeyDown) {
                    this.onKeyDown('backspace');
                }
                const keyElement = this.keyElements['backspace'];
                if (keyElement) this.animateKey(keyElement);
                return;
            }
        });
    }

    /**
     * 更新按键颜色状态
     * @param {string} letter - 字母
     * @param {string} status - 状态 ('correct', 'present', 'absent')
     */
    updateKeyStatus(letter, status) {
        // 优先级：correct > present > absent
        const currentStatus = this.letterStatus[letter];
        if (status === 'correct') {
            this.letterStatus[letter] = 'correct';
        } else if (status === 'present' && currentStatus !== 'correct') {
            this.letterStatus[letter] = 'present';
        } else if (status === 'absent' && !currentStatus) {
            this.letterStatus[letter] = 'absent';
        }

        // 更新UI
        const keyElement = this.keyElements[letter];
        if (keyElement) {
            this.applyKeyStyle(keyElement, this.letterStatus[letter]);
        }
    }

    /**
     * 应用按键样式
     * @param {HTMLElement} keyElement - 按键元素
     * @param {string} status - 状态
     */
    applyKeyStyle(keyElement, status) {
        const colors = {
            'correct': this.keyColor.correct,
            'present': this.keyColor.present,
            'absent': this.keyColor.absent
        };

        if (status && colors[status]) {
            keyElement.style.backgroundColor = colors[status];
            // 添加过渡动画
            keyElement.style.transition = 'background-color 0.3s ease';
        } else {
            keyElement.style.backgroundColor = this.keyColor.default;
        }

        // 添加状态类（用于CSS自定义）
        keyElement.className = 'key';
        if (status) {
            keyElement.classList.add(`key-${status}`);
        }
    }

    /**
     * 批量更新按键状态
     * @param {object} letterStatus - 字母状态映射
     */
    updateKeys(letterStatus) {
        for (const [letter, status] of Object.entries(letterStatus)) {
            this.updateKeyStatus(letter, status);
        }
    }

    /**
     * 重置键盘状态（清空所有颜色）
     */
    reset() {
        this.letterStatus = {};
        for (const key of Object.keys(this.keyElements)) {
            const keyElement = this.keyElements[key];
            if (keyElement) {
                keyElement.style.backgroundColor = this.keyColor.default;
                keyElement.className = 'key';
            }
        }
    }

    /**
     * 设置按键回调函数
     * @param {Function} callback - 回调函数 (key) => void
     */
    setOnKeyPress(callback) {
        this.onKeyPress = callback;
    }

    /**
     * 设置物理键盘回调函数
     * @param {Function} callback - 回调函数 (key) => void
     */
    setOnKeyDown(callback) {
        this.onKeyDown = callback;
    }

    /**
     * 禁用键盘（游戏结束时）
     */
    disable() {
        const buttons = this.container.querySelectorAll('.key');
        buttons.forEach(button => {
            button.disabled = true;
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
        });
    }

    /**
     * 启用键盘
     */
    enable() {
        const buttons = this.container.querySelectorAll('.key');
        buttons.forEach(button => {
            button.disabled = false;
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
        });
    }

    /**
     * 获取键盘尺寸（用于响应式）
     * @returns {object} 键盘尺寸信息
     */
    getSize() {
        const rect = this.container.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height
        };
    }

    /**
     * 切换键盘主题
     * @param {object} colors - 颜色配置
     */
    setTheme(colors) {
        this.keyColor = { ...this.keyColor, ...colors };
        // 刷新所有按键的颜色
        for (const [letter, status] of Object.entries(this.letterStatus)) {
            const keyElement = this.keyElements[letter];
            if (keyElement) {
                this.applyKeyStyle(keyElement, status);
            }
        }
    }
}

// 导出类（用于模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WordleKeyboard;
}