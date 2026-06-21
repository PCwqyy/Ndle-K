(async function(){
	let N=1,K=5;	// N for number, K for length.
	const dictUrl='dictionary.txt';
	function initSetting(){
		document.querySelectorAll('div#setting input[type=range]').forEach((val)=>{
			var ele=document.createElement('span');
			ele.textContent=val.value;
			val.addEventListener('input',()=>{
				ele.textContent=val.value;
			})
			val.after(ele);
		})
		document.querySelector('#number').addEventListener('input',(val)=>{N=parseInt(val.target.value);})
		document.querySelector('#length').addEventListener('input',(val)=>{K=parseInt(val.target.value);})
	}
	let dictionary=[];
	/**
	 * 加载词典并返回Promise（更简洁的用法）
	 * @param {string} url - 词典文件路径
	 * @returns {Promise<string[]>} 词语数组
	 */
	async function loadDictionarySimple(url) {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`加载失败: ${response.status}`);
		}
		const text = await response.text();
		return text.split(/\r?\n/)
			.map(line => line.trim())
			.filter(line => line !== '' && !line.startsWith('#')); // 支持注释行
	}
	let wordles=[];
	const randomChoice =arr=>arr[Math.floor(Math.random()*arr.length)];
	const MainContianer=document.querySelector('#main-container');
	function initGame(){
		console.log(`N=${N}, K=${K}`);
		let dict=dictionary.filter(w=>w.length===K);
		console.log(dict);
		for(var i=0;i<N;i++){
			var word=randomChoice(dict);
			console.warn(word);
			var wordle=new Wordle(word,dict,K,N+5);
			var ele=document.createElement('div');
			MainContianer.appendChild(ele);
			var display=new WordleDisplay(ele,wordle,{
				tileSize: '52px',
				tileGap: '4px',
				maxAttempts: N+5,
				animationDuration: 300
			});
			wordles.push(display);
		}
		console.log(wordles);
	}

	let inputWord='';
	function confirmWord(){
		console.log(inputWord);
		inputWord='';
	}
	function onKeyPress(key){
		if(key=='backspace'){
			inputWord=inputWord.substring(0,inputWord.length-1);
			wordles.forEach((val)=>{
				val.deleteLetter();
			})
		}
		else if(key=='enter'){
			wordles.forEach((val)=>{
				val.submitWord(inputWord);
			})
			confirmWord();
		}
		else if(inputWord.length<K){
			inputWord+=key;
			wordles.forEach((val)=>{
				val.inputLetter(key);
			})
		}
	}

	let Keyboard=new WordleKeyboard('keyboard');
	Keyboard.setOnKeyPress(onKeyPress);
	Keyboard.setOnKeyDown(onKeyPress);

	initSetting();
	dictionary=await loadDictionarySimple(dictUrl);
	console.log(dictionary);
	document.querySelector('#startButton').addEventListener('click',()=>{
		initGame(N);
	})
})();