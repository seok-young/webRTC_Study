
export function WebMediaPublisher(apiUrl, streamUrl) {
    let self = {};

    self. publish = async (Stream, appId, feedId) => {
        if(self.pc){
            self.pc.addTransceiver('audio',{direction: 'sendonly'});
            self.pc.addTransceiver('video',{direction: 'sendonly'});
        
            const [audioTrack] = Stream.getAudioTracks();
            if(audioTrack) {
                self.pc.addTrack(audioTrack);      
            }

            const [videoTrack] = Stream.getVideoTracks();
            if(videoTrack) {
                self.pc.addTrack(videoTrack);
            }

            const offer = await self.pc.createOffer();
            await self.pc.setLocalDescription(offer);

            const session = await new Promise((resolve, reject) => {
                const fullApiUrl = `${self.apiUrl}/rtc/v1/publish/`;
                const fullStreamUrl = `${self.streamUrl}/${appId}/${feedId}`;
                const transactionId = Number(parseInt(new Date().getTime()*Math.random()*100)).toString(16).slice(0,7);
            
                const data = {
                    api: fullApiUrl,
                    streamurl: fullStreamUrl,
                    tid: transactionId,
                    clientip: null,
                    sdp: offer.sdp
                };
                console.log("generated offer", data);

                const xhr = new XMLHttpRequest();
                xhr.onload = () => {
                    if(xhr.readyState !== xhr.DONE) return;
                    if(xhr.status !==200 && xhr.status !== 201) return reject(xhr);

                    const answer = JSON.parse(xhr.responseText);
                    console.log("received answer", answer);
                    return answer.code ? reject(xhr) : resolve(answer);
                }
                xhr.open('POST', fullApiUrl, true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send(JSON.stringify(data));
            })            
            await self.pc.setRemoteDescription(new RTCSessionDescription({type:'answer',sdp:session.sdp}));;
            return session;
        } else {
            throw new Error("RTCPeerConnection이 없음")
        }
    }


    self.close = () => {
        self.pc && self.pc.close();
        self.pc = null;
    }

    self.pc = new RTCPeerConnection(null);
    self.pc.onconnectionstatechange = () => {
        const state = self.pc.connectionState;
        console.log("RTCPeerConnection 상태 변경", state);
    }
          
    self.apiUrl = apiUrl;
    self.streamUrl = streamUrl;
    return self;
}