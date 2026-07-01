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
	let wordles=[];// Wordle display instances
	let elements=[];// Wordle elements
	/**
	 * @param {Array<Element>} eles
	 * @param {Element} parent
	 */
	function arrangeElements(eles,parent)
	{
		const num=eles.length;
		const col=Math.ceil(Math.sqrt(num));
		const row=Math.ceil(num/col);
		parent.classList.add('arrenger');
		for(var i=0,k=0;i<row;i++)
		{
			var rowEle=document.createElement('div');
			rowEle.classList.add('arrange-row');
			for(var j=0;j<col&&k<num;j++,k++)
				rowEle.appendChild(eles[k]);
			parent.appendChild(rowEle);
		}
	}

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
			elements[i]=document.createElement('div');
			var display=new WordleDisplay(elements[i],wordle,{
				tileSize: '52px',
				tileGap: '4px',
				maxAttempts: N+5,
				animationDuration: 300
			});
			wordles.push(display);
		}
		console.log(wordles);
		arrangeElements(elements,MainContianer);
	}

	function getInputWord(){
		var word='';
		for(var i=0;i<wordles.length;i++)
			if(wordles[i].currentInput.length==K)
				word=wordles[i].currentInput;
		return word;
	}
	function onKeyPress(key){
		if(key=='backspace')
			wordles.forEach((val)=>{
				val.deleteLetter();
			})
		else if(key=='enter'){
			let inputWord=getInputWord();
			console.log(`Input word: ${inputWord}`);
			wordles.forEach((val)=>{
				try{
					var result=val.submitWord(inputWord).result;
				}catch(e){
					console.error(e);
					return;
				}
				console.log(result);
				for(var k in result)
					Keyboard.updateKeyStatus(inputWord[k],result[k]);
			})
		}
		else if(key=='left')
			wordles.forEach((val)=>{
				val.setCursorOffset(-1);
				val.render();
			})
		else if(key=='right')
			wordles.forEach((val)=>{
				val.setCursorOffset(1);
				val.render();
			})
		else
			wordles.forEach((val)=>{
				val.inputLetter(key);
			})
	}

	window.setCursor=(pos)=>{
		wordles.forEach((val)=>{
			val.setCursor(pos);
			val.render();
		});
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