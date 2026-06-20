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
        this.attempts = [];           // 所有猜测记录 [{word, result}]
        this.currentAttempt = 0;      // 当前尝试次数
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