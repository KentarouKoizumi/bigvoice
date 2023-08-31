import { useEffect, useState } from 'react';
import useSound from 'use-sound';
import Sound from './assets/警告音2.mp3';

function AudioMonitor() {
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [threshold, setThreshold] = useState(0.1); // この値を調整して音量のしきい値を設定
  const [alertVolume, setAlertVolume] = useState(0.7); // この値を調整して警告音の音量を設定
  const [play] = useSound(Sound,{ interrupt: true, volume: alertVolume });

  useEffect(() => {
    let audioContext: AudioContext, microphone:MediaStreamAudioSourceNode, scriptProcessor: ScriptProcessorNode;

    if (isListening) {
      audioContext = new window.AudioContext();
      scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);
      scriptProcessor.connect(audioContext.destination);

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          microphone = audioContext.createMediaStreamSource(stream);
          microphone.connect(scriptProcessor);

          scriptProcessor.onaudioprocess = (event) => {
            const input = event.inputBuffer.getChannelData(0);
            let sum = 0.0;
            for (let i = 0; i < input.length; ++i) {
              sum += input[i] * input[i];
            }
            const rms = Math.sqrt(sum / input.length);
            setVolume(rms);

            if (rms > threshold) {
              // ここで警告音を再生
              console.log('LOUD NOISE DETECTED!');
              play();
            }
          };
        });
    }

    return () => {
      if (scriptProcessor) {
        scriptProcessor.disconnect();
        if (microphone) microphone.disconnect();
      }
      if (audioContext) audioContext.close();
    };
  }, [isListening]);
  const handleThresholdChange = (event) => {
    const newThreshold = parseFloat(event.target.value);
    setThreshold(newThreshold);
  };
  const handleVolumeChange = (event) => {
    const newVolume = parseFloat(event.target.value);
    setAlertVolume(newVolume);
  };
  return (
    <div>
      <button onClick={() => setIsListening(prev => !prev)}>
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>
      <div style={{ marginTop: '20px', border: '1px solid black', width: '300px', height: '50px' }}>
        <div style={{ backgroundColor: `${volume < threshold ? 'green' : 'red'}`, width: `${volume * 1000}px`, height: '100%', position: 'relative'}}>
          <div style={{ backgroundColor: "white", position: 'absolute', height: '100%', width: '2px', left: `${threshold *1000}px`}}></div>
        </div>
        <input type="range" min="0" max="0.3" step="0.0001" style={{width: '300px'}} value={threshold} onChange={handleThresholdChange} />
        <input type="range" min="0" max="1" step="0.0001" style={{width: '300px'}} value={alertVolume} onChange={handleVolumeChange} />
      </div>
    </div>
  );
}

export default AudioMonitor;

