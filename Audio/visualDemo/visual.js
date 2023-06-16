// 创建 AudioContext 对象
const audioContext = new AudioContext();

// 创建画布元素和上下文对象
const canvasWaveform = document.getElementById('waveform');
const canvasContextWaveform = canvasWaveform.getContext('2d');

const canvasSpectrogram = document.getElementById('spectrogram');
const canvasContextSpectrogram = canvasSpectrogram.getContext('2d');

const canvas = document.getElementById('visualizer');
const canvasCtx = canvas.getContext('2d');

// 加载音频文件
fetch('../assets/music/ADVENTURE_PARTY.mp3')
  .then(response => response.arrayBuffer())
  .then(buffer => audioContext.decodeAudioData(buffer))
  .then(audioBuffer => {
    // 创建音频源
    const audioBufferSource = audioContext.createBufferSource();
    audioBufferSource.buffer = audioBuffer;
    // 创建音频分析器
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048; // 设置 FFT 大小
    // 连接音频源和音频分析器
    audioBufferSource.connect(analyser);
    analyser.connect(audioContext.destination);
    // 创建一个数组用于保存频谱数据
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    // 创建绘制函数
    function draw() {
      // 请求下一帧动画
      requestAnimationFrame(draw);
      // 获取频谱数据
      analyser.getByteFrequencyData(dataArray);
      // 清空画布
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      canvasContextSpectrogram.clearRect(0, 0, canvasSpectrogram.width, canvasSpectrogram.height);
      canvasContextWaveform.clearRect(0, 0, canvasWaveform.width, canvasWaveform.height);

      // 绘制频谱图
      createSpectrum(analyser, dataArray)

      // 绘制瀑布图
      createFalls(analyser, dataArray)

      // 绘制波纹图
      createWave(analyser, dataArray)

    }
    window.onclick = () => {
      // 开始播放音频
      audioBufferSource.start()
      // 调用绘制函数开始可视化
      draw();
      window.onclick = null
    }
  });

function createSpectrum (analyser, dataArray) {
  const bufferLength = analyser.frequencyBinCount
  const barWidth = (canvas.width / bufferLength) * 2.5;
  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    const barHeight = dataArray[i] / 2;
    canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
    canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
    x += barWidth + 1;
  }
}

function createFalls (analyser, dataArray) {
  const bufferLength = analyser.frequencyBinCount
  const fallsWidth = canvasSpectrogram.width / bufferLength;
  let fallsX = 0
  for (let i = 0; i < bufferLength; i++) {
    const barHeight = (dataArray[i] / 255) * canvasSpectrogram.height;
    const hue = (i / bufferLength) * 360;
    canvasContextSpectrogram.fillStyle = `hsl(${hue}, 100%, 50%)`;
    canvasContextSpectrogram.fillRect(fallsX, canvasSpectrogram.height - barHeight, fallsWidth, barHeight);
    fallsX += fallsWidth;
  }
}

function createWave (analyser, dataArray) {
  analyser.getByteTimeDomainData(dataArray);
  const bufferLength = analyser.frequencyBinCount
  canvasContextWaveform.lineWidth = 1;
  canvasContextWaveform.strokeStyle = 'rgb(0, 255, 255)';
  canvasContextWaveform.beginPath();
  const sliceWidth = canvasWaveform.width / bufferLength;
  let waveX = 0;
  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const y = (v * canvasWaveform.height) / 2;
    if (i === 0) {
      canvasContextWaveform.moveTo(waveX, y);
    } else {
      canvasContextWaveform.lineTo(waveX, y);
    }
    waveX += sliceWidth;
  }
  canvasContextWaveform.lineTo(canvasWaveform.width, canvasWaveform.height / 2);
  canvasContextWaveform.stroke();
}
