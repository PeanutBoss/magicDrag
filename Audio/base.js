var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Watcher {
    constructor() {
        this.eventMap = {};
    }
    on(event, callback) {
        let cbs = this.eventMap[event];
        if (!cbs || !cbs.length)
            cbs = this.eventMap[event] = [];
        cbs.push(callback);
    }
    once(event, callback) {
        let cbs = this.eventMap[event];
        if (!cbs || !cbs.length)
            cbs = this.eventMap[event] = [];
        const newCB = () => {
            callback();
            this.eventMap[event] = cbs.filter((cb) => {
                return cb !== newCB;
            });
        };
        cbs.push(newCB);
    }
    emit(event, ...rest) {
        if (!(event in this.eventMap))
            return;
        const cbs = this.eventMap[event];
        cbs.forEach((cb) => cb(...rest));
    }
}
const INTERACTION_EVENT = ['touchstart', 'keydown', 'pointerdown', 'mousedown'];
const eventStrategy = {
    play(el, audio, key) {
        // const audioEle = audio.audioEle
        // const { buttonAfterCallback } = audio.options
        // let buttonAfterCB = buttonAfterCallback && buttonAfterCallback[key]
        // el.addEventListener('click', () => {
        // 	audioEle.play()
        // 	buttonAfterCB && buttonAfterCB()
        // })
    },
    pause(el, audio, key) {
        // const audioEle = audio.audioEle
        // const { buttonAfterCallback } = audio.options
        // let buttonAfterCB = buttonAfterCallback && buttonAfterCallback[key]
        // el.addEventListener('click', () => {
        // 	audioEle.pause()
        // 	buttonAfterCB && buttonAfterCB()
        // })
    },
    prev(el, _) {
        el.addEventListener('click', () => {
            console.log('prev');
        });
    },
    next(el, _) {
        el.addEventListener('click', () => {
            console.log('next');
        });
    }
};
function throttle(fn, delay) {
    let flag = true;
    return () => {
        if (!flag)
            return;
        flag = false;
        setTimeout(() => {
            fn();
            flag = true; // 核心
        }, delay);
    };
}
var State;
(function (State) {
    State["PLAYING"] = "PLAYING";
    State["ENDED"] = "ENDED";
    State["PAUSE"] = "PAUSE";
})(State || (State = {}));
export class Player {
    constructor(url, container, options) {
        this.options = options;
        this.loopWay = ''; // 策略模式处理
        this.sourceLoaded = false; // 音频资源是否加载完毕
        this.state = State.ENDED; // 播放器当前状态
        this.watcher = new Watcher();
        // 音频的源信息（arrayBuffer）
        this.audioData = {};
        // 音频元素
        this.audioEle = document.createElement('audio');
        this._initAudioContext = throttle(this.initAudioContext.bind(this), 100);
        options.show && this.initContainer(container);
        this.bindBtnListener();
        this.startWatch();
        this.createBlobUrl(url)
            .then(audioUrl => {
            this.audioEle.src = audioUrl;
            this.listenInteraction();
        });
    }
    startWatch() {
        this.watcher.on('playing', () => {
            this.state = State.PLAYING;
        });
        this.watcher.on('pause', () => {
            this.state = State.PAUSE;
        });
        this.watcher.on('ended', () => {
            this.state = State.ENDED;
        });
        this.audioEle.addEventListener('loadeddata', () => {
            this.watcher.emit('loadeddata', { duration: this.audioEle.duration });
        });
        this.audioEle.addEventListener('playing', () => {
            this.watcher.emit('playing');
        });
        this.audioEle.addEventListener('pause', () => {
            this.watcher.emit('pause');
        });
        this.audioEle.addEventListener('ended', () => {
            this.watcher.emit('ended');
        });
        this.audioEle.addEventListener('timeupdate', event => {
            const { currentTime, duration } = this.audioEle;
            this.watcher.emit('timeupdate', { currentTime, duration });
        });
        // 播放发生错误
        this.audioEle.addEventListener('error', error => {
            console.log(error, 'error');
            // this.watcher.emit('ended')
        });
        // 停止播放（例如切换下一个音频，当前音频就会终止播放）
        this.audioEle.addEventListener('abort', abort => {
            console.log(abort, 'abort');
            // this.watcher.emit('ended')
        });
        // 加载中止
        this.audioEle.addEventListener('stalled ', stalled => {
            console.log(stalled, 'stalled');
            // this.watcher.emit('ended')
        });
    }
    // 开始播放
    play() {
        this.audioEle.play();
    }
    // 暂停播放
    pause() {
        this.audioEle.pause();
    }
    // 停止播放
    ended() {
        this.audioEle.pause();
        setTimeout(() => {
            this.watcher.emit('ended');
        });
    }
    // 调整播放进度
    changePlayProcess(time) {
        this.audioEle.currentTime = time;
    }
    /*
    * KNOW 使用 audioBufferSource 控制音频与audio是独立的两个播放器
    * */
    // 快进
    forward() {
        this.audioEle.currentTime = this.audioEle.currentTime + 1;
    }
    // 切换播放的音频
    changeAudio(url) {
        return __awaiter(this, void 0, void 0, function* () {
            this.audioEle.src = yield this.createBlobUrl(url);
            this.audioEle.addEventListener('loadeddata', () => {
                this.audioEle.play();
            });
        });
    }
    // 为按钮绑定click事件
    bindBtnListener() {
        const { buttonTarget } = this.options;
        if (!buttonTarget)
            return;
        Object.keys(buttonTarget).forEach(btnName => {
            let target = buttonTarget[btnName];
            if (typeof target === 'string') {
                target = document.querySelector(target);
            }
            const strategyMethod = eventStrategy[btnName];
            strategyMethod && strategyMethod(target, this, btnName);
        });
    }
    // 创建音频上下文对象
    initAudioContext() {
        // 创建audioContext前必须与文档有交互（点击/移动鼠标），否则音频无法播放
        console.log('---');
        this.audioContext = new window.AudioContext();
        // this.createBufferSource()
        // audioContext创建完毕，停止监听与文档的交互
        this.stopListenInteraction();
        this.audioSource = this.audioContext.createMediaElementSource(this.audioEle);
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 0.5;
        this.audioSource.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
    }
    createBufferSource() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.sourceLoaded && this.audioContext) {
                // 解码后arrayBuffer会被清空
                this.audioData.audioBuffer = yield this.audioContext.decodeAudioData(this.audioData.arrayBuffer);
                this.audioBufferSource = this.audioContext.createBufferSource();
                this.audioBufferSource.buffer = this.audioData.audioBuffer;
            }
        });
    }
    // 将音频播放器添加到页面中
    initContainer(container) {
        if (typeof container === 'string') {
            const el = document.querySelector(container);
            el === null || el === void 0 ? void 0 : el.appendChild(this.audioEle);
        }
        else {
            container.appendChild(this.audioEle);
        }
        this.audioEle.setAttribute('controls', '');
    }
    // 根据相对路径创建文件url
    createBlobUrl(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(url);
            this.audioData.arrayBuffer = yield response.arrayBuffer(); // 保存音频对应的arrayBuffer
            // const blob = await response.blob()
            const blob = new Blob([this.audioData.arrayBuffer], { type: 'audio/mp3' });
            // 视频资源加载完毕
            this.sourceLoaded = true;
            // await this.createBufferSource()
            // TODO 切换音频时应该销毁该url 或 将该url缓存，关闭页面时再销毁
            return URL.createObjectURL(blob);
        });
    }
    // 浏览器限制播放器的滥用，只有用户与文档进行手势交互后创建上下文对象才能正常使用
    listenInteraction() {
        INTERACTION_EVENT.forEach(eventName => {
            window.addEventListener(eventName, this._initAudioContext);
        });
    }
    stopListenInteraction() {
        INTERACTION_EVENT.forEach(eventName => {
            window.removeEventListener(eventName, this._initAudioContext);
        });
    }
}
