/**
 * Wordle 游戏核心类
 * 支持自定义词长、最大尝试次数，并提供完整的游戏状态管理
 */
class Wordle {
	/**
	 * 构造函数
	 * @param {string} answer - 答案
	 * @param {string[]} wordList - 有效的猜测词列表
	 * @param {number} wordLength - 单词长度（默认5）
	 * @param {number} maxAttempts - 最大尝试次数（默认6）
	 */
	constructor(answer, wordList, wordLength = 5, maxAttempts = 6) {
		this.answer=answer;
		if (!wordList || wordList.length === 0) {
			throw new Error('单词列表不能为空');
		}

		// 过滤出指定长度的单词
		this.wordList = wordList.filter(word => word.length === wordLength);
		if (this.wordList.length < maxAttempts) {
			throw new Error(`没那么多单词`);
		}
		
		this.wordLength = wordLength;
		this.maxAttempts = maxAttempts;
		
		// 游戏状态
		this.reset();
	}

	/**
	 * 重置游戏状态
	 */
	reset() {
		// 游戏状态
		this.attempts = [];		   // 所有猜测记录 [{word, result}]
		this.currentAttempt = 0;	  // 当前尝试次数
		this.gameOver = false;
		this.won = false;
		this.guessedLetters = new Set();  // 已猜过的字母（用于键盘高亮）
		
		// 字母状态映射（用于键盘显示）
		this.letterStatus = {};  // { 'a': 'correct', 'b': 'present', 'c': 'absent' }
		
		// 已使用的字母（避免重复猜测）
		this.usedLetters = new Set();
		
		return this;
	}

	/**
	 * 评估猜测结果
	 * @param {string} guess - 用户猜测的词
	 * @returns {object} 包含结果数组和是否胜利
	 */
	evaluateGuess(guess) {
		if (this.gameOver) {
			throw new Error('游戏已结束，请重新开始');
		}

		if (this.currentAttempt >= this.maxAttempts) {
			throw new Error('已达到最大尝试次数');
		}

		// 验证输入
		guess = guess.toLowerCase();
		if (guess.length !== this.wordLength) {
			throw new Error(`请输入 ${this.wordLength} 个字母的单词`);
		}

		// 检查是否在有效词列表中
		if (!this.wordList.includes(guess) && !this.wordList.includes(guess)) {
			throw new Error('无效的单词');
		}

		// 检查是否已经猜过
		if (this.attempts.some(attempt => attempt.word === guess)) {
			throw new Error('你已经猜过这个词了');
		}

		// 计算每个字母的状态
		const result = this.calculateResult(guess);
		
		// 记录猜测
		this.attempts.push({ word: guess, result: result });
		this.currentAttempt++;
		
		// 更新字母状态
		this.updateLetterStatus(guess, result);
		
		// 更新已用字母
		for (const char of guess) {
			this.usedLetters.add(char);
		}
		
		// 检查是否胜利
		if (guess === this.answer) {
			this.won = true;
			this.gameOver = true;
		} else if (this.currentAttempt >= this.maxAttempts) {
			this.gameOver = true;
		}
		
		return {
			result: result,
			won: this.won,
			gameOver: this.gameOver,
			attemptsLeft: this.maxAttempts - this.currentAttempt
		};
	}

	/**
	 * 计算猜测结果
	 * @param {string} guess - 猜测的词
	 * @returns {string[]} 状态数组 ['correct', 'present', 'absent']
	 */
	calculateResult(guess) {
		const answerArray = this.answer.split('');
		const guessArray = guess.split('');
		const result = new Array(this.wordLength).fill('absent');
		
		// 用于标记答案中已被匹配的字母位置
		const matched = new Array(this.wordLength).fill(false);
		
		// 第一遍：找出完全正确的位置（绿色）
		for (let i = 0; i < this.wordLength; i++) {
			if (guessArray[i] === answerArray[i]) {
				result[i] = 'correct';
				matched[i] = true;
			}
		}
		
		// 第二遍：找出包含但位置错误的字母（黄色）
		for (let i = 0; i < this.wordLength; i++) {
			if (result[i] === 'correct') continue;
			
			// 检查这个字母是否在答案中且未被匹配
			for (let j = 0; j < this.wordLength; j++) {
				if (!matched[j] && guessArray[i] === answerArray[j]) {
					result[i] = 'present';
					matched[j] = true;
					break;
				}
			}
		}
		
		return result;
	}

	/**
	 * 更新字母状态（用于键盘显示）
	 * @param {string} guess - 猜测的词
	 * @param {string[]} result - 评估结果
	 */
	updateLetterStatus(guess, result) {
		const letters = guess.split('');
		
		for (let i = 0; i < letters.length; i++) {
			const letter = letters[i];
			const status = result[i];
			
			// 优先级：correct > present > absent
			if (status === 'correct') {
				this.letterStatus[letter] = 'correct';
			} else if (status === 'present' && this.letterStatus[letter] !== 'correct') {
				this.letterStatus[letter] = 'present';
			} else if (status === 'absent' && !this.letterStatus[letter]) {
				this.letterStatus[letter] = 'absent';
			}
		}
	}

	/**
	 * 获取游戏当前状态
	 * @returns {object} 游戏状态对象
	 */
	getState() {
		return {
			answer: this.answer,
			attempts: this.attempts,
			currentAttempt: this.currentAttempt,
			maxAttempts: this.maxAttempts,
			gameOver: this.gameOver,
			won: this.won,
			wordLength: this.wordLength,
			letterStatus: this.letterStatus,
			usedLetters: Array.from(this.usedLetters),
			attemptsLeft: this.maxAttempts - this.currentAttempt
		};
	}

	/**
	 * 检查是否已猜过该词
	 * @param {string} word - 要检查的词
	 * @returns {boolean} 是否已猜过
	 */
	isWordGuessed(word) {
		return this.attempts.some(attempt => attempt.word === word.toLowerCase());
	}

	/**
	 * 获取所有已猜的字母（用于键盘禁用）
	 * @returns {Set} 已猜字母集合
	 */
	getGuessedLetters() {
		const letters = new Set();
		for (const attempt of this.attempts) {
			for (const char of attempt.word) {
				letters.add(char);
			}
		}
		return letters;
	}

	/**
	 * 获取统计信息
	 * @returns {object} 统计信息
	 */
	getStats() {
		return {
			totalAttempts: this.attempts.length,
			attemptsLeft: this.maxAttempts - this.currentAttempt,
			isGameOver: this.gameOver,
			isWon: this.won,
			answer: this.gameOver ? this.answer : null
		};
	}

	/**
	 * 检查单词是否有效（在词典中）
	 * @param {string} word - 要检查的词
	 * @returns {boolean} 是否有效
	 */
	isInDict(word) {
		word = word.toLowerCase();
		return this.wordList.includes(word)
	}

	/**
	 * 获取当前答案（仅在游戏结束后）
	 * @returns {string|null} 答案词
	 */
	getAnswer() {
		return this.gameOver ? this.answer : null;
	}
}

// 导出类（用于模块系统）
if (typeof module !== 'undefined' && module.exports) {
	module.exports = Wordle;
}

/**
 * Wordle UI 显示类
 * 负责管理游戏界面的渲染和更新
 * 包含一个Wordle实例作为子元素
 * 所有样式通过class控制，不内联样式
 */
class WordleDisplay {
    /**
     * 构造函数
     * @param {string} containerId - 容器DOM元素ID
     * @param {Wordle} wordleInstance - Wordle游戏实例
     * @param {object} options - 配置选项
     */
    constructor(container, wordleInstance, options = {}) {
        // 获取容器
        this.container = container;
        if (!this.container) {
            throw new Error(`容器元素不存在`);
        }
		this.container.classList.add('wordle');

        // 存储Wordle实例
        this.wordle = wordleInstance;

        // 配置选项
        this.options = {
            tileSize: options.tileSize || '52px',          // 每个格子大小
            tileGap: options.tileGap || '4px',             // 格子间距
            maxAttempts: this.wordle.maxAttempts,          // 最大尝试次数
			wordLength: this.wordle.wordLength,
            animationDuration: options.animationDuration || 300, // 动画时长(ms)
            ...options
        };

        // 当前正在输入的词（未提交）
        this.currentInput = '';

        // DOM元素引用
        this.gridElement = null;        // 网格容器
        this.tileElements = [];         // 所有格子的二维数组
        this.messageElement = null;     // 消息显示区域

        // 初始化UI
        this.init();
    }

    /**
     * 初始化UI结构
     */
    init() {
        // 清空容器
        this.container.innerHTML = '';

        // 创建网格容器
        this.gridElement = document.createElement('div');
        this.gridElement.className = 'wordle-grid'; // 网格容器class
        this.container.appendChild(this.gridElement);

        // 创建消息区域
        this.messageElement = document.createElement('div');
        this.messageElement.className = 'wordle-message'; // 消息区域class
        this.container.appendChild(this.messageElement);

		this.cursor=0;

        // 创建格子
        this.createTiles();

        // 初始渲染
        this.render();
    }

    /**
     * 创建所有格子
     */
    createTiles() {
        const { maxAttempts, wordLength } = this.options;
        this.tileElements = [];

        // 遍历每一行（尝试次数）
        for (let row = 0; row < maxAttempts; row++) {
            const rowElement = document.createElement('div');
            rowElement.className = 'wordle-row'; // 行容器class
            this.gridElement.appendChild(rowElement);

            const rowTiles = [];

            // 遍历每一列（单词长度）
            for (let col = 0; col < wordLength; col++) {
                const tile = document.createElement('div');
                tile.className = 'wordle-tile'; // 单个格子class
                tile.dataset.row = row;
                tile.dataset.col = col;
                rowElement.appendChild(tile);
                rowTiles.push(tile);
				tile.addEventListener('click',(()=>{
					window.setCursor(col); // Define yourself!!
				}).bind(this));
            }

            this.tileElements.push(rowTiles);
        }
    }

    /**
     * 渲染整个游戏状态
     */
    render() {
        this.renderGrid();
        this.renderMessage();
    }

	// 上一行的结果
	revealResult(row){
		const attempt = this.wordle.attempts[row];
		const word = attempt.word;
		const result = attempt.result;

		for (let col = 0; col < word.length; col++) {
			const tile = this.tileElements[row][col];
			// 设置字母
			tile.textContent = word[col].toUpperCase();
			// 设置状态class
			tile.classList.add(`tile-${result[col]}`); // 状态class: tile-correct, tile-present, tile-absent
		}
	}

	renderInput(row){
		const inputLength = this.currentInput.length;
		for (let col = 0; col < this.options.wordLength; col++) {
			const tile = this.tileElements[row][col];
			if (col < inputLength) {
				// 已输入的字母
				tile.textContent = this.currentInput[col].toUpperCase();
				tile.classList.add('tile-filled'); // 已填充class
			} else {
				// 空位
				tile.textContent = '';
				tile.classList.remove('tile-filled');
			}
		}
	}

	renderCursor(row){
		for (let col = 0; col < this.options.wordLength; col++) {
			const tile = this.tileElements[row][col];
			if(col===this.cursor)
				tile.classList.add('tile-active');
			else
				tile.classList.remove('tile-active');
		}
	}

    /**
     * 渲染网格
     */
    renderGrid() {
		const currentAttempt = this.wordle.currentAttempt;

        // 渲染已提交的猜测
		if(currentAttempt>0)	this.revealResult(currentAttempt-1);

        // 渲染当前正在输入的行
        if (!this.wordle.gameOver && currentAttempt < this.options.maxAttempts)
            this.renderInput(currentAttempt),
			this.renderCursor(currentAttempt);

        // 如果游戏结束，显示答案（如果需要）
        if (this.wordle.gameOver) {
            this.revealAnswer();
        }
    }

    /**
     * 清空所有格子的内容
     */
    clearTiles() {
        for (let row = 0; row < this.tileElements.length; row++) {
            for (let col = 0; col < this.tileElements[row].length; col++) {
                const tile = this.tileElements[row][col];
                tile.textContent = '';
                tile.className = 'wordle-tile'; // 重置为初始class
            }
        }
    }

    /**
     * 更新单个格子
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @param {string} letter - 字母
     * @param {string} status - 状态 ('correct', 'present', 'absent')
     */
    updateTile(row, col, letter, status = null) {
        const tile = this.tileElements[row]?.[col];
        if (!tile) return;

        tile.textContent = letter ? letter.toUpperCase() : '';
        
        // 移除所有状态class
        tile.classList.remove('tile-correct', 'tile-present', 'tile-absent', 'tile-filled', 'tile-active');
        
        if (status) {
            tile.classList.add(`tile-${status}`);
            tile.classList.add('tile-flip');
            setTimeout(() => {
                tile.classList.remove('tile-flip');
            }, this.options.animationDuration + 100);
        } else if (letter) {
            tile.classList.add('tile-filled');
        }
    }

    /**
     * 提交当前输入的词
     * @param {string} word - 要提交的词
     * @returns {object} 评估结果
     */
    submitWord(word) {
        try {
            // 调用Wordle的评估方法
            const result = this.wordle.evaluateGuess(word);
            
            // 更新UI显示提交的词
            const row = this.wordle.currentAttempt - 1;
            const attempt = this.wordle.attempts[row];
            
            if (attempt) {
                for (let col = 0; col < attempt.word.length; col++) {
                    this.updateTile(row, col, attempt.word[col], attempt.result[col]);
                }
            }

            // 清空当前输入
            this.currentInput = '';

            // 更新消息
            if (result.won) {
                this.showMessage('🎉 恭喜你赢了！', 'success');
            } else if (result.gameOver) {
                this.showMessage(`游戏结束！答案是: ${this.wordle.answer.toUpperCase()}`, 'error');
            } else {
                this.showMessage(`还剩 ${result.attemptsLeft} 次尝试`, 'info');
            }

			this.setCursor(0);

            // 渲染网格
            this.render();
            return result;

        } catch (error) {
            this.showMessage(error.message, 'error');
            throw error;
        }
    }

	setCursor(position){
		if(position<0||position>this.currentInput.length) return;
		this.cursor=position;
	}
	setCursorOffset(offset){
		const newPos=this.cursor+offset;
		if(newPos<0||newPos>this.currentInput.length) return;
		this.cursor=newPos;
	}

    /**
     * 输入字母
     * @param {string} letter - 输入的字母
     */
    inputLetter(letter) {
        // 游戏结束不能输入
        if (this.wordle.gameOver) {
            this.showMessage('游戏已结束，请重新开始', 'error');
            return;
        }

        // 已达到最大尝试次数
        if (this.wordle.currentAttempt >= this.options.maxAttempts) {
            this.showMessage('已达到最大尝试次数', 'error');
            return;
        }

        // 只接受字母
        if (!/^[a-zA-Z]$/.test(letter)) {
            return;
        }

        // 限制长度
        if (this.currentInput.length >= this.options.wordLength) {
            return;
        }

        // 添加字母
        this.currentInput=this.currentInput.slice(0, this.cursor) + letter.toLowerCase() + this.currentInput.slice(this.cursor);
        this.setCursorOffset(1);
        // 渲染更新
        this.render();
    }

    /**
     * 删除最后一个字母
     */
    deleteLetter() {
        // 删除光标前的字母
		if (this.cursor > 0) {
			this.currentInput = this.currentInput.slice(0, this.cursor - 1) + this.currentInput.slice(this.cursor);
			this.setCursorOffset(-1);
			this.render();
		}
    }

    /**
     * 清空当前输入
     */
    clearInput() {
        this.currentInput = '';
        this.render();
    }

    /**
     * 获取当前输入的词
     * @returns {string} 当前输入
     */
    getCurrentInput() {
        return this.currentInput;
    }

    /**
     * 检查当前输入是否完整
     * @returns {boolean} 是否完整
     */
    isInputComplete() {
        return this.currentInput.length === this.options.wordLength;
    }

    /**
     * 显示消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 ('info', 'success', 'error')
     */
    showMessage(message, type = 'info') {
        if (!this.messageElement) return;

        this.messageElement.textContent = message;
        this.messageElement.className = `wordle-message message-${type}`; // 消息类型class
        
        // 自动清除消息（5秒后）
        clearTimeout(this.messageTimeout);
        this.messageTimeout = setTimeout(() => {
            this.clearMessage();
        }, 5000);
    }

    /**
     * 清除消息
     */
    clearMessage() {
        if (this.messageElement) {
            this.messageElement.textContent = '';
            this.messageElement.className = 'wordle-message';
        }
        clearTimeout(this.messageTimeout);
    }

    /**
     * 渲染消息
     */
    renderMessage() {
        // 如果需要显示持久消息，可以在这里添加逻辑
        // 默认消息由showMessage控制
    }

    /**
     * 显示答案（游戏结束时）
     */
    revealAnswer() {
        // 如果赢了，已经在提交时显示
        // 如果输了，显示答案
        if (!this.wordle.won && this.wordle.gameOver) {
            // 可以选择在消息中显示答案，或在格子中标记
            // 这里通过消息显示
            this.showMessage(`答案是: ${this.wordle.answer.toUpperCase()}`, 'error');
        }
    }

    /**
     * 重置游戏（使用新答案）
     * @param {string} newAnswer - 新答案（可选，不传则随机）
     */
    resetGame(newAnswer = null) {
        // 重置Wordle实例
        this.wordle.reset();
        
        // 如果有新答案，设置它
        if (newAnswer) {
            this.wordle.answer = newAnswer;
        }

        // 重置UI状态
        this.currentInput = '';
        this.clearMessage();
        
        // 清空所有格子
        this.clearTiles();
        
        // 重新渲染
        this.render();

        this.showMessage('新游戏开始！', 'info');
    }

    /**
     * 更新Wordle实例（切换游戏）
     * @param {Wordle} newWordle - 新的Wordle实例
     */
    setWordle(newWordle) {
        this.wordle = newWordle;
        this.currentInput = '';
        this.clearMessage();
        this.clearTiles();
        this.render();
    }

    /**
     * 获取所有格子元素
     * @returns {HTMLElement[][]} 格子二维数组
     */
    getTiles() {
        return this.tileElements;
    }

    /**
     * 获取某个格子元素
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @returns {HTMLElement} 格子元素
     */
    getTile(row, col) {
        return this.tileElements[row]?.[col] || null;
    }

    /**
     * 设置容器大小（响应式）
     * @param {string} size - 格子大小
     */
    setTileSize(size) {
        this.options.tileSize = size;
        // 通过CSS class控制，这里只更新配置
        // 实际样式由CSS控制
    }

    /**
     * 销毁UI（清理资源）
     */
    destroy() {
        clearTimeout(this.messageTimeout);
        this.container.innerHTML = '';
        this.tileElements = [];
        this.gridElement = null;
        this.messageElement = null;
    }
}

// 导出类（用于模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WordleDisplay;
}