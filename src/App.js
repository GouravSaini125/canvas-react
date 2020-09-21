import React, {useEffect, useState} from 'react';
import './App.css'
import Canvas from "./components/Canvas";
import Button from "./components/Button";
import Directions from "./configs/Directions";

import audio from "./assets/waves.wav";

function App() {

    const [direction, setDirection] = useState(null);
    const [pendingTimeout, setPendingTimeout] = useState(null);
    const [stream, setStream] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [isConverting, setIsConverting] = useState(false);

    useEffect(() => {
        setStream(document.querySelector("canvas").captureStream());

        return () => {
            stream.getTracks().forEach(function (track) {
                track.stop();
            });
        }
    }, [stream]);

    const startCapture = mediaRecorder => {
        let recordedChunks = [];

        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.onstop = handleStreamStop;
        mediaRecorder.start();

        function handleDataAvailable(event) {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        }

        function handleStreamStop() {
            setIsConverting(true);
            const blob = new Blob(recordedChunks, {
                type: "video/webm"
            });
            const worker = new Worker(`${process.env.PUBLIC_URL}/ffmpeg-worker-mp4.js`);
            worker.onmessage = function (e) {
                const msg = e.data;
                switch (msg.type) {
                    case "ready":
                        blob.arrayBuffer().then(videoBuffer => {
                            fetch(audio).then(r => r.blob()).then(blob => blob.arrayBuffer()).then(audioBuffer => postMsg(videoBuffer, audioBuffer));
                        });
                        break;
                    case "stdout":
                        console.log(msg.data);
                        break;
                    case "stderr":
                        console.log(msg.data);
                        break;
                    case "done":
                        setIsConverting(false);
                        const f = new Blob([msg.data["MEMFS"][0].data], {
                            type: "video/mp4"
                        });
                        const url = URL.createObjectURL(f);
                        setVideoUrl(url);
                        break;
                    default:
                        return;
                }

                function postMsg(videoBuffer, audio) {
                    worker.postMessage({
                        type: 'run',
                        MEMFS: [
                            {name: "video.webm", data: new Uint8Array(videoBuffer)},
                            {name: "audio.wav", data: new Uint8Array(audio)}
                        ],
                        arguments: [
                            '-i', 'video.webm',
                            '-i', 'audio.wav',
                            '-c:v', 'copy',
                            '-c:a', 'aac',
                            '-strict', 'experimental',
                            '-shortest', 'output.mp4'
                        ],
                    });
                }
            };
        }
    }

    const setDirectionWithTimeout = dir => {
        clearTimeout(pendingTimeout);
        setDirection(dir);
        setVideoUrl(null);

        const options = {mimeType: 'video/webm;codecs=h264'};
        const mediaRecorder = new MediaRecorder(stream, options);

        startCapture(mediaRecorder);

        const to = setTimeout(function () {
            mediaRecorder.stop();
            setDirection(null);
        }, 5000);
        setPendingTimeout(to);
    }

    const handleVideoDownload = () => {
        let link = document.createElement("a");
        link.download = "capture.mp4";
        link.href = videoUrl;
        link.click();
    }

    return (
        <section>

            <Canvas direction={direction}/>

            <div className="controls">

                <Button
                    direction={Directions.DIRECTION_UP}
                    isDisabled={direction === Directions.DIRECTION_UP || isConverting}
                    setDirectionWithTimeout={setDirectionWithTimeout}
                />

                <div className="row">
                    <Button
                        direction={Directions.DIRECTION_LEFT}
                        isDisabled={direction === Directions.DIRECTION_LEFT || isConverting}
                        setDirectionWithTimeout={setDirectionWithTimeout}
                    />

                    <button
                        onClick={handleVideoDownload}
                        disabled={videoUrl === null}
                        className="download-btn"
                    >
                        {
                            isConverting ? (
                                <div className="loader-wrapper">
                                    <div className="spinning-loader"/>
                                </div>
                            ) : "DOWNLOAD"
                        }
                    </button>

                    <Button
                        direction={Directions.DIRECTION_RIGHT}
                        isDisabled={direction === Directions.DIRECTION_RIGHT || isConverting}
                        setDirectionWithTimeout={setDirectionWithTimeout}
                    />
                </div>

                <Button
                    direction={Directions.DIRECTION_DOWN}
                    isDisabled={direction === Directions.DIRECTION_DOWN || isConverting}
                    setDirectionWithTimeout={setDirectionWithTimeout}
                />

            </div>


        </section>
    );
}

export default App;