declare class Watcher<T extends string> {
    private readonly eventMap;
    constructor();
    on(event: T, callback: Function): void;
    once(event: T, callback: Function): void;
    emit(event: T, ...rest: any[]): void;
}
type WatcherEmit = 'ended' | 'pause' | 'playing' | 'contextCreated' | 'sourceCreated' | 'changeVisualType' | 'timeupdate' | 'abort' | 'progress' | 'volumeupdate' | 'loadeddata' | 'loadedBuffer' | 'canplay' | 'changePlay' | 'loopWay';
type SourceType = 'Media' | 'Buffer';
declare abstract class Player {
    private playerType;
    type: 'Media' | 'Buffer';
    watcher: Watcher<WatcherEmit>;
    private readonly INTERACTION_EVENT;
    private readonly _initContext;
    playerContext: any;
    playerData: any;
    playerDom: HTMLAudioElement | HTMLVideoElement;
    /**
     * @param playerType 音频/视频播放器
     * @param type 音源基于Audio元素（Media）还是二进制数据（Buffer）
     * @protected
     */
    protected constructor(playerType: 'AUDIO' | 'VIDEO', type: 'Media' | 'Buffer');
    abstract setMediaCurrentTime(time: number): void;
    abstract changeCurrentPlaying(index: number): void;
    abstract getPlayListCount(): number;
    createContext(): void;
    abstract initContext(): void;
    listenInteraction(): void;
    stopListenInteraction(): void;
}
export declare class AudioPlayer extends Player {
    private playList;
    type: SourceType;
    private sourceLoaded;
    private audioBufferSource;
    mediaSource: any;
    private audioContext;
    constructor(playList: any[], playerType: 'AUDIO' | 'VIDEO', type: SourceType);
    createMediaSource(): void;
    connectAnalyser(analyser: any): void;
    initContext(): void;
    setMediaCurrentTime(time: number): void;
    changeCurrentPlaying(index: number): void;
    getBufferByUrl(): Promise<void>;
    getPlayListCount(): number;
    startWatch(): void;
    createBufferSource(): Promise<void>;
}
export declare class PlayerControls {
    private player;
    private options;
    private playIndex;
    private loopWay;
    private readonly _play;
    private isPlaying;
    private gainNode;
    private biquadFilter;
    constructor(player: AudioPlayer, options?: any);
    private createBiquadFilter;
    setBiquadFilter(type?: string, HZ?: number): void;
    private createGainNode;
    watchAction(): void;
    playNext(): void;
    playPrev(): void;
    changeAudio(index: number): void;
    controlVolume(volume: number): void;
    changePlayProcess(currentTime: number): void;
    start(): void;
    play(): void;
    pause(): void;
    toggleLoopWay(): void;
    private getStrategy;
}
export declare class PlayerVisual {
    private player;
    private options?;
    private bufferLength;
    private dataArray;
    private analyserNode;
    private canvas;
    private canvasCtx;
    private visualType;
    visualData: any;
    constructor(player: AudioPlayer, options?: any);
    createAnalyser(): void;
    createCanvasContext(): void;
    draw(): void;
    toggleVisualType(): void;
    createSpectrum(): void;
    createFall(): void;
    createWave(): void;
}
export {};
