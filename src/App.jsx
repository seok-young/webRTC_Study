import './App.css'
import {useState, useRef, useEffect} from 'react'
import { WebMediaPublisher } from './WebMediaPublisher';

function App() {
  const [mediaDevices, setMediaDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [mediaStream, setMediaStream] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const mediaPlayerRef = useRef(null);
  const remotePlayerRef = useRef(null); 

  const enumerateDevices = () => {
    navigator.mediaDevices.enumerateDevices()
      .then(deviceInfos => {
        console.log("장치 조회 성공", deviceInfos);

        const filteredDeviceInfos = deviceInfos.filter(deviceInfo => deviceInfo.kind === 'videoinput' && deviceInfo.deviceId !== 'default');

        setMediaDevices(filteredDeviceInfos);
      })
      .catch(error => {
        console.log("장치 조회 실패", error);
      })
  }

  const requestPermissionAndEnumerateDevices = () => {
    const constraints = {
      video: true,
      audio: true,
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(newMediaStream => {
        newMediaStream.getTracks().forEach(track => track.stop());

        const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
        console.log("SupportedConstraints", supportedConstraints);

        enumerateDevices();
      })
      .catch(error => {
        console.log("권한 획득 실패", error);
      })
  }

  const selectedDeviceIdChanged = (event) => {
    setSelectedDeviceId(event.target.value);
  }



  const requestMediaStream = () => {


    const videoConstraints = {
      deviceId: selectedDeviceId
    };
    

    if(mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    navigator.mediaDevices.getUserMedia({video: videoConstraints, audio: false})
      .then(newMediaStream => {
        console.log("MediaStream 요청 성공", newMediaStream);
        const [videoTrack] = newMediaStream.getVideoTracks();
        if(videoTrack) {
          const capabilities = videoTrack.getCapabilities();
          console.log("VideoTrack Capabilities", capabilities);

          const constraints = videoTrack.getConstraints();
          console.log("VideoTrack Constraints", constraints);

          const settings = videoTrack.getSettings();
          console.log("VideoTrack Settings", settings);
        } 

        if(mediaPlayerRef.current) {
          mediaPlayerRef.current.srcObject = newMediaStream;
        }
        setMediaStream(newMediaStream);
      })
      .catch(error => {
        console.log("MediaStream 요청 실패", error);

        setMediaStream(null);
      })
  }
  const publishMediaStream = () => {
    const publisher = WebMediaPublisher('http://localhost:1985', 'webrtc://localhost');

    publisher.publish(mediaStream, 'testApp', 'testFeed')
      .then(session => {
        console.log("publish 성공", session);
        setIsPublished(true);
      })
      .catch(error => {
        console.log("publish 실패", error);      
      })
  }

  return (
    <>
      <div className="horizontal-start-box">
        <input type="button" value="장치 조회" onClick={requestPermissionAndEnumerateDevices} />
        <select value={selectedDeviceId} onChange={selectedDeviceIdChanged}>
          <option value=''>기본 장치</option>
          {mediaDevices.map((device, index) => (
            <option key={`mediadevice-${index}-${device.deviceId}`} value={device.deviceId}>{device.label}</option>
          ))}
        </select>  
        <input type="button" value="미디어 요청" onClick={requestMediaStream} />
        <input type="button" value="미디어 전송" onClick={publishMediaStream}/>
      </div>
      <div className="horizontal-start-box">
        <video ref={mediaPlayerRef} autoPlay muted style={{width: '640px', height: '320px', background: 'black', objectFit: 'contain'}} />
        <video ref={remotePlayerRef} autoPlay muted style={{width: '640px', height: '320px', background: 'black', objectFit: 'contain'}} />
      </div>
    </>
  )
}

export default App
